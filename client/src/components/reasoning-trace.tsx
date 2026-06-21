import React, { useState } from "react";
import { Zap, HelpCircle, AlertTriangle, Play, CheckCircle2, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticIssue {
  type: string;
  severity: 'critical' | 'warning' | 'minor';
  description: string;
  suggestion: string;
}

interface ReasoningTraceProps {
  timing: {
    routing: number;
    retrieval: number;
    candidates: number;
    refine: number;
    verification: number;
    critic: number;
    ensemble: number;
    metacognition: number;
    total: number;
  };
  criticNotes: {
    issues: CriticIssue[];
    assessment: 'pass' | 'revise' | 'fail';
  };
  metacognition: {
    knownUnknowns: string[];
    potentialBiases: string[];
    confidenceCalibration: string;
    suggestedFollowUp: string[];
  };
}

export function ReasoningTrace({ timing, criticNotes, metacognition }: ReasoningTraceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stages = [
    { name: "Query Routing", time: timing.routing, desc: "Intent, domain expert selection, temp & depth routing" },
    { name: "Live Retrieval", time: timing.retrieval, desc: "Evidence retrieval with search grounding & consistency checks" },
    { name: "Candidate Generation", time: timing.candidates, desc: "Parallel candidate generations & synthesis judging" },
    { name: "Self Refinement", time: timing.refine, desc: "Iterative edit loop to sharpen formatting and clarity" },
    { name: "Claim Verification", time: timing.verification, desc: "Chain-of-Verification (CoVe) extraction & fact checking" },
    { name: "Adversarial Critic", time: timing.critic, desc: "Reviewing logic, overconfidence, and semantic limits" },
    { name: "Cross-Model Ensemble", time: timing.ensemble, desc: "Llama-3 (Groq) verification comparison check" },
    { name: "Metacognition Calibration", time: timing.metacognition, desc: "Calibrating known unknowns and potential biases" },
  ].filter(s => s.time > 0);

  const maxTime = Math.max(...stages.map(s => s.time), 1);

  return (
    <div className="border border-white/10 rounded-xl bg-slate-900/20 backdrop-blur-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/5 active:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>⚡ View Reasoning Trace</span>
          <span className="text-[10px] text-slate-500 font-normal">({timing.total}ms total pipeline time)</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 opacity-65" />
        ) : (
          <ChevronRight className="w-4 h-4 opacity-65" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 animate-in slide-in-from-top-1 duration-200">
          
          {/* Stage Timings Section */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" /> Execution Timeline
            </h4>
            <div className="space-y-2">
              {stages.map((stage) => {
                const percentage = Math.round((stage.time / maxTime) * 100);
                return (
                  <div key={stage.name} className="flex flex-col gap-1 pb-1">
                    <div className="grid grid-cols-[110px_1fr_45px] items-center gap-3">
                      <span className="text-[10px] font-medium text-slate-300 truncate">{stage.name}</span>
                      <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-primary/80 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 text-right">{stage.time}ms</span>
                    </div>
                    <span className="text-[9px] text-slate-500 pl-[110px] leading-tight">{stage.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critic Notes Section */}
          {criticNotes.issues.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Adversarial Critic Audits
              </h4>
              <div className="space-y-2">
                {criticNotes.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs leading-relaxed",
                      issue.severity === "critical"
                        ? "bg-rose-500/5 border-rose-500/20 text-rose-300"
                        : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider",
                        issue.severity === "critical" ? "bg-rose-500/25 text-rose-200" : "bg-amber-500/25 text-amber-200"
                      )}>
                        {issue.severity}
                      </span>
                      <span className="capitalize">{issue.type.replace("_", " ")}</span>
                    </div>
                    <div>{issue.description}</div>
                    {issue.suggestion && (
                      <div className="mt-1 text-[10px] opacity-80 italic">
                        💡 Suggestion: {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metacognition Details Section */}
          {(metacognition.knownUnknowns.length > 0 || metacognition.potentialBiases.length > 0) && (
            <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-sky-400" /> Meta-Cognitive Disclosures
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metacognition.knownUnknowns.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20 text-sky-300">
                    <div className="font-bold text-[10px] mb-1 uppercase tracking-wider text-sky-400">Known Unknowns</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      {metacognition.knownUnknowns.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {metacognition.potentialBiases.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-indigo-300">
                    <div className="font-bold text-[10px] mb-1 uppercase tracking-wider text-indigo-400">Potential Biases</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                      {metacognition.potentialBiases.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {metacognition.confidenceCalibration && (
                <div className="p-2 rounded-lg bg-slate-800/40 text-[10px] text-slate-400 italic">
                  Calibration: {metacognition.confidenceCalibration}
                </div>
              )}
            </div>
          )}

          {criticNotes.issues.length === 0 && (
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Adversarial critic found no logical fallacies or contradictions in the final text.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
