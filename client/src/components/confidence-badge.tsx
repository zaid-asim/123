import React, { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: {
    score: number;
    level: "Verified" | "Likely" | "Uncertain" | "Low Confidence";
    factors: {
      evidenceScore: number;
      verificationScore: number;
      criticScore: number;
      ensembleScore: number;
      metacognitionScore: number;
    };
  };
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { score, level, factors } = confidence;

  // Colors configuration based on level
  const config = {
    "Verified": {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      icon: ShieldCheck,
    },
    "Likely": {
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      icon: Shield,
    },
    "Uncertain": {
      bg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
      dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
      icon: ShieldAlert,
    },
    "Low Confidence": {
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
      icon: ShieldAlert,
    },
  }[level] || {
    bg: "bg-slate-500/10 border-slate-500/20 text-slate-400",
    dot: "bg-slate-500",
    icon: Shield,
  };

  const Icon = config.icon;

  return (
    <div className="relative inline-block text-left select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]",
          config.bg
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", config.dot)} />
        <Icon className="w-3.5 h-3.5" />
        <span>{level} ({score}%)</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 opacity-60" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-60" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            <h4 className="text-xs font-bold text-slate-200 mb-3 tracking-wide uppercase">
              Reasoning Confidence Audit
            </h4>
            <div className="space-y-3">
              {[
                { label: "Evidence Grounding", value: factors.evidenceScore, max: 25 },
                { label: "Claim Verification", value: factors.verificationScore, max: 30 },
                { label: "Critic Review", value: factors.criticScore, max: 30 },
                { label: "Metacognition Calibration", value: factors.metacognitionScore, max: 20 },
                { label: "Cross-Model Ensemble", value: factors.ensembleScore, max: 10 },
              ].map((f) => (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-slate-400">
                    <span>{f.label}</span>
                    <span>{f.value} / {f.max}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.min(100, (f.value / f.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t border-white/5 text-[9px] text-slate-500 italic">
              Score is computed from live sources, verification consistency, and semantic constraints.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
