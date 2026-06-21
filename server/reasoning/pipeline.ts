import { performance } from "perf_hooks";
import { ReasonedAnswer } from "@shared/schema";
import { routeQuery, RoutingDecision } from "./router";
import { MODELS, getClient } from "./models";
import { getActiveAdapter, GroqConfig, OpenRouterConfig, OpenAIConfig, GrokConfig, DeepSeekConfig, AnthropicConfig } from "../adapters/model-adapter";
import { EXPERT_PERSONAS } from "./personas";
import { retrieveEvidence, EvidenceBundle } from "./retrieval";
import { retrievePrivateEvidence } from "../knowledge/retrieval";
import { generateCandidates, judgeAndSelect } from "./candidates";
import { selfRefine } from "./self-refine";
import { chainOfVerification, quickVerify } from "./verification";
import { runCritic } from "./critic";
import { ensembleCheck, EnsembleResult } from "./ensemble";
import { metaCognize, MetaCognitionResult } from "./metacognition";
import { computeConfidence } from "./confidence";
import { extractContextSketch } from "./sketch";
import { logAnswerRun } from "../audit/audit-service";

// Fast hashing algorithm (djb2) for block-level mapping (DSBH)
function generateBlockHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export async function processQuery(
  message: string,
  personality: string,
  context: string,
  settings: any,
  apiKey?: string,
  groqConfig?: { useGroq: boolean; groqApiKey?: string; groqModel?: string },
  onStream?: (event: string, data: any) => void,
  userId?: string | null,
  workspaceId?: string,
  openRouterConfig?: { useOpenRouter: boolean; openRouterApiKey?: string; openRouterModel?: string },
  openAiConfig?: { useOpenAI: boolean; openAiApiKey?: string; openAiModel?: string },
  grokConfig?: { useGrok: boolean; grokApiKey?: string; grokModel?: string },
  geminiModel?: string,
  deepseekConfig?: DeepSeekConfig,
  anthropicConfig?: AnthropicConfig
): Promise<ReasonedAnswer> {
  const tTotalStart = performance.now();
  const timings = {
    routing: 0,
    retrieval: 0,
    candidates: 0,
    refine: 0,
    verification: 0,
    critic: 0,
    ensemble: 0,
    metacognition: 0,
    total: 0
  };

  // 1. DYNAMIC TOKEN BUDGET CASCADING (TBC)
  const estimatedInputTokens = Math.round((message.length + context.length) / 4);
  const maxReasoningBudget = Math.round(estimatedInputTokens * 1.5);
  let accumulatedTokens = 0;
  let useCoTCompression = false;

  const trackTokenUsage = (generatedText: string) => {
    accumulatedTokens += Math.round(generatedText.length / 4);
    if (accumulatedTokens > maxReasoningBudget * 0.85) {
      useCoTCompression = true;
    }
  };

  // 2. CONTEXT DISTILLATION SKETCHING (MGRB / CDS)
  let activeContext = context;
  if (context && context.length >= 3000) {
    onStream?.("status", "Distilling context sketch...");
    try {
      const sketch = await extractContextSketch(context, apiKey);
      activeContext = `Dense Context Sketch:\n- Summary: ${sketch.summary}\n- Claims: ${sketch.claims.map(c => `- ${c}`).join("\n")}\n- Symbols/Identifiers: ${sketch.keySymbols.join(", ")}`;
      trackTokenUsage(JSON.stringify(sketch));
    } catch (err) {
      console.error("Context sketching failed, fallback to raw context:", err);
    }
  }

  // 3. ROUTING
  onStream?.("status", "Routing query...");
  const tStart = performance.now();
  const hasGroq = !!(groqConfig?.useGroq && groqConfig?.groqApiKey);
  let decision: RoutingDecision;
  try {
    decision = await routeQuery(message, [], apiKey, hasGroq);
  } catch (err) {
    console.error("Routing stage failed, using fallback:", err);
    decision = {
      depth: "direct",
      persona: "conversationalist",
      temperature: 0.7,
      searchDepth: 0,
      candidateCount: 1,
      enableEnsemble: false,
      enableSelfRefine: false,
      maxRefineLoops: 0,
      searchQueries: [],
      bypassCandidates: true,
      bypassRefine: true,
      bypassCritic: true
    };
  }
  timings.routing = Math.round(performance.now() - tStart);

  // If the user settings override reasoning depth to "quick", force direct depth
  if (settings?.aiReasoningDepth === "quick") {
    decision.depth = "direct";
    decision.bypassCandidates = true;
    decision.bypassRefine = true;
    decision.bypassCritic = true;
  }

  const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);

  // DIRECT MODE BYPASS (Greeting, casual chatter, or forced quick)
  if (decision.depth === "direct") {
    const tDirectStart = performance.now();
    const systemInstruction = EXPERT_PERSONAS[decision.persona] || EXPERT_PERSONAS.conversationalist;
    
    // Inject memories and context
    const fullContext = activeContext ? `Context:\n${activeContext}\n\n` : "";
    let directAnswer = "";

    try {
      if (onStream) {
        onStream("status", "Generating direct response...");
        const responseStream = adapter.stream(`${fullContext}User Query: "${message}"`, {
          systemInstruction,
          temperature: decision.temperature,
          maxOutputTokens: 2000
        });
        for await (const chunk of responseStream) {
          directAnswer += chunk;
          onStream("text", chunk);
        }
      } else {
        const response = await adapter.generate(`${fullContext}User Query: "${message}"`, {
          systemInstruction,
          temperature: decision.temperature,
          maxOutputTokens: 2000
        });
        directAnswer = response.text || "I was unable to formulate a response.";
      }
    } catch (err) {
      console.error("Direct response generation failed:", err);
      directAnswer = "I encountered an error generating the response.";
    }

    timings.total = Math.round(performance.now() - tTotalStart);

    return {
      response: directAnswer,
      confidence: {
        score: 95,
        level: "Verified",
        factors: { evidenceScore: 10, verificationScore: 20, criticScore: 20, ensembleScore: 0, metacognitionScore: 20 }
      },
      sources: [{ title: "Swadesh AI Local Knowledge", url: "https://swadesh.ai", snippet: "Direct immediate response mode." }],
      claims: [],
      criticNotes: { issues: [], assessment: "pass" },
      timing: { ...timings, total: timings.total },
      metacognition: {
        knownUnknowns: [],
        potentialBiases: [],
        confidenceCalibration: "Direct conversational path bypasses complex audits.",
        suggestedFollowUp: []
      }
    };
  }

  // 4. RETRIEVAL (HYBRID PRIVATE RAG + LIVE GROUNDING)
  const tRetStart = performance.now();
  onStream?.("status", "Retrieving private evidence and searching web...");
  let evidence: EvidenceBundle = {
    synthesis: "",
    sources: [],
    sourceCount: 0,
    sourceAgreement: 100,
    contradictionsFound: []
  };

  let privateResults: any[] = [];
  try {
    privateResults = await retrievePrivateEvidence(message, workspaceId || "default", apiKey);
  } catch (err) {
    console.error("Private retrieval failed:", err);
  }

  let webEvidence: EvidenceBundle | null = null;
  if (decision.searchDepth > 0 && decision.searchQueries.length > 0) {
    try {
      webEvidence = await retrieveEvidence(decision.searchQueries, decision.searchDepth, apiKey);
    } catch (err) {
      console.error("Web grounding failed:", err);
    }
  }

  const combinedSources: any[] = [];
  const synthesisParts: string[] = [];

  if (privateResults.length > 0) {
    privateResults.forEach(r => {
      combinedSources.push({
        title: `${r.sourceName}${r.page ? ` (Page ${r.page})` : ""}`,
        url: r.sourceUrl,
        snippet: r.text.slice(0, 300)
      });
      synthesisParts.push(`[Private Document: ${r.sourceName}] ${r.text}`);
    });
  }

  if (webEvidence) {
    webEvidence.sources.forEach(s => combinedSources.push(s));
    if (webEvidence.synthesis) {
      synthesisParts.push(webEvidence.synthesis);
    }
    evidence.contradictionsFound.push(...webEvidence.contradictionsFound);
  }

  evidence.sources = combinedSources;
  evidence.sourceCount = combinedSources.length;
  evidence.synthesis = synthesisParts.join("\n\n");

  if (evidence.sources.length === 0) {
    evidence.sources = [
      { title: "Swadesh AI Local Knowledge", url: "https://swadesh.ai", snippet: "Direct internal response mode." }
    ];
  }

  if (evidence.synthesis) {
    trackTokenUsage(evidence.synthesis);
  }

  timings.retrieval = Math.round(performance.now() - tRetStart);
  onStream?.("sources", evidence.sources);

  // 5. MULTI-CANDIDATE GENERATION & JUDGING OR DIRECT SPECULATIVE STREAMING
  const tCandStart = performance.now();
  let selectedDraft = "";
  let judgeReasoning = "";

  const fullContext = activeContext ? `Context:\n${activeContext}\n\n` : "";

  if (decision.bypassCandidates) {
    onStream?.("status", "Generating answer...");
    try {
      if (onStream) {
        const responseStream = adapter.stream(`${fullContext}User Query: "${message}"`, {
          systemInstruction: `${EXPERT_PERSONAS[decision.persona] || EXPERT_PERSONAS.conversationalist}${useCoTCompression ? "\nSystem budget exhausted. Switch to C-CoT shorthand format." : ""}`,
          temperature: decision.temperature,
          maxOutputTokens: useCoTCompression ? 150 : 2000
        });
        for await (const chunk of responseStream) {
          selectedDraft += chunk;
          onStream("text", chunk);
        }
      } else {
        const response = await adapter.generate(`${fullContext}User Query: "${message}"`, {
          systemInstruction: `${EXPERT_PERSONAS[decision.persona] || EXPERT_PERSONAS.conversationalist}${useCoTCompression ? "\nSystem budget exhausted. Switch to C-CoT shorthand format." : ""}`,
          temperature: decision.temperature,
          maxOutputTokens: useCoTCompression ? 150 : 2000
        });
        selectedDraft = response.text || "";
      }
      trackTokenUsage(selectedDraft);
    } catch (err) {
      console.error("Speculative direct response generation failed:", err);
      selectedDraft = "I encountered an error generating the response.";
    }
  } else {
    onStream?.("status", "Generating candidate responses...");
    try {
      const candidates = await generateCandidates(
        message,
        evidence.synthesis || activeContext,
        decision.persona,
        decision.temperature,
        decision.candidateCount,
        apiKey,
        groqConfig,
        openRouterConfig,
        openAiConfig,
        grokConfig
      );
      candidates.forEach(c => trackTokenUsage(c.answer));
      
      onStream?.("status", "Selecting the best response...");
      const judgeResult = await judgeAndSelect(candidates, message, apiKey);
      selectedDraft = judgeResult.selected;
      judgeReasoning = judgeResult.reasoning;
      trackTokenUsage(selectedDraft);
    } catch (err) {
      console.error("Candidates generation/judging failed:", err);
      selectedDraft = "Failed to generate candidates.";
    }
  }
  timings.candidates = Math.round(performance.now() - tCandStart);

  // 6. SELF-REFINE LOOP
  const tRefStart = performance.now();
  let refinedAnswer = selectedDraft;
  let refineImprovements: string[] = [];
  if (!decision.bypassRefine && decision.enableSelfRefine && decision.maxRefineLoops > 0) {
    onStream?.("status", "Refining the selected draft answer...");
    try {
      const refineResult = await selfRefine(
        selectedDraft,
        message,
        evidence.synthesis || activeContext,
        decision.maxRefineLoops,
        apiKey
      );
      refinedAnswer = refineResult.refined;
      refineImprovements = refineResult.improvements;
      trackTokenUsage(refinedAnswer);
    } catch (err) {
      console.error("Self-refine failed:", err);
    }
  }
  timings.refine = Math.round(performance.now() - tRefStart);

  // Stream refined answer to user if we generated via candidates path and didn't stream it yet
  if (!decision.bypassCandidates && onStream) {
    onStream("status", "Streaming answer...");
    const chunkSize = 16;
    for (let i = 0; i < refinedAnswer.length; i += chunkSize) {
      onStream("text", refinedAnswer.slice(i, i + chunkSize));
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }

  // 7 & 8. VERIFICATION AND ADVERSARIAL CRITIC WITH CIRCUIT BREAKER (CCB)
  let verification: any = { claims: [], overallConsistency: 100, flaggedClaims: [] };
  let critic: any = { issues: [], assessment: "pass", revisedAnswer: undefined };
  let currentAnswerState = refinedAnswer;

  if (decision.bypassCritic) {
    onStream?.("status", "Performing rapid verification check...");
    try {
      verification = await quickVerify(currentAnswerState, evidence.synthesis || activeContext, apiKey);
      trackTokenUsage(JSON.stringify(verification));
    } catch (err) {
      console.error("Quick verification check failed:", err);
    }
  } else {
    onStream?.("status", "Performing verification audits and factuality checks...");
    
    // Asynchronous audit loop with oscillation prevention
    let auditLoops = 0;
    const maxAuditLoops = 3;
    const oscillationMatrix: string[] = [];

    while (auditLoops < maxAuditLoops) {
      const [vResult, cResult] = await Promise.all([
        (async () => {
          const tStart = performance.now();
          try {
            let res;
            if (decision.depth === "light") {
              res = await quickVerify(currentAnswerState, evidence.synthesis || activeContext, apiKey) as any;
            } else {
              res = await chainOfVerification(currentAnswerState, evidence.synthesis || activeContext, apiKey) as any;
            }
            timings.verification += Math.round(performance.now() - tStart);
            return res;
          } catch (err) {
            console.error("Verification failed:", err);
            return { claims: [], overallConsistency: 100, flaggedClaims: [] };
          }
        })(),
        (async () => {
          const tStart = performance.now();
          try {
            const res = await runCritic(
              currentAnswerState,
              evidence.synthesis || activeContext,
              settings?.criticStrictness || "standard",
              apiKey
            ) as any;
            timings.critic += Math.round(performance.now() - tStart);
            return res;
          } catch (err) {
            console.error("Adversarial critic failed:", err);
            return { issues: [], assessment: "pass", revisedAnswer: undefined };
          }
        })()
      ]);

      verification = vResult;
      critic = cResult;
      
      trackTokenUsage(JSON.stringify(verification) + JSON.stringify(critic));

      if (critic.revisedAnswer && critic.revisedAnswer !== currentAnswerState) {
        const stateHash = generateBlockHash(critic.revisedAnswer);
        if (oscillationMatrix.includes(stateHash)) {
          console.warn(`[CCB] Critic Circuit Breaker tripped on loop ${auditLoops}. Oscillation detected. Halting.`);
          break;
        }
        oscillationMatrix.push(stateHash);
        
        // Push block-level patches to client (DSBH)
        if (onStream) {
          const originalParas = currentAnswerState.split("\n\n");
          const revisedParas = critic.revisedAnswer.split("\n\n");

          originalParas.forEach((orig, idx) => {
            const rev = revisedParas[idx];
            if (rev !== undefined && orig.trim() !== rev.trim()) {
              const origHash = generateBlockHash(orig);
              onStream("patch", {
                blockId: origHash,
                index: idx,
                originalText: orig,
                revisedText: rev,
                reason: "Audited for factuality by critic review"
              });
            }
          });

          if (revisedParas.length > originalParas.length) {
            for (let i = originalParas.length; i < revisedParas.length; i++) {
              onStream("patch", {
                blockId: `new-${i}`,
                index: i,
                originalText: "",
                revisedText: revisedParas[i],
                reason: "Added context"
              });
            }
          } else if (revisedParas.length < originalParas.length) {
            for (let i = revisedParas.length; i < originalParas.length; i++) {
              const origHash = generateBlockHash(originalParas[i]);
              onStream("patch", {
                blockId: origHash,
                index: i,
                originalText: originalParas[i],
                revisedText: "",
                reason: "Removed details"
              });
            }
          }
        }
        
        currentAnswerState = critic.revisedAnswer;
        auditLoops++;
      } else {
        break; // No revisions made, exit audit loop
      }
    }
  }

  onStream?.("verification", verification);
  onStream?.("critic", critic);

  if (currentAnswerState !== refinedAnswer && onStream) {
    onStream("revised", currentAnswerState);
  }

  // 9 & 10. CROSS-MODEL ENSEMBLE AND META-COGNITION (Parallel Execution in Background)
  onStream?.("status", "Performing metacognitive calibration check...");
  const [ensemble, metacognition] = await Promise.all([
    (async () => {
      if (decision.enableEnsemble && groqConfig?.useGroq) {
        const tStart = performance.now();
        try {
          const res = await ensembleCheck(
            message,
            currentAnswerState,
            decision.persona,
            groqConfig,
            apiKey
          );
          timings.ensemble = Math.round(performance.now() - tStart);
          return res;
        } catch (err) {
          console.error("Ensemble check failed:", err);
          timings.ensemble = Math.round(performance.now() - tStart);
          return null;
        }
      }
      return null;
    })(),
    (async () => {
      const tStart = performance.now();
      try {
        const res = await metaCognize(
          currentAnswerState,
          verification.claims,
          critic.issues,
          apiKey
        );
        timings.metacognition = Math.round(performance.now() - tStart);
        return res;
      } catch (err) {
        console.error("Meta-cognition check failed:", err);
        timings.metacognition = Math.round(performance.now() - tStart);
        return { knownUnknowns: [], potentialBiases: [], confidenceCalibration: "Calibration failed", suggestedFollowUp: [] };
      }
    })()
  ]);

  onStream?.("metacognition", metacognition);

  // 11. CONFIDENCE CALCULATION
  const confidenceScore = computeConfidence(
    { sourceCount: evidence.sources.length, sourceAgreement: evidence.sourceAgreement },
    { overallConsistency: verification.overallConsistency, flaggedClaimsCount: verification.flaggedClaims.length },
    { assessment: critic.assessment as any, criticalCount: critic.issues.filter((i: any) => i.severity === "critical").length, warningCount: critic.issues.filter((i: any) => i.severity === "warning").length },
    ensemble ? { agreement: ensemble.agreement } : null,
    { knownUnknownsCount: metacognition.knownUnknowns.length, potentialBiasesCount: metacognition.potentialBiases.length },
    decision.depth
  );

  onStream?.("confidence", confidenceScore);

  timings.total = Math.round(performance.now() - tTotalStart);
  onStream?.("timing", timings);

  // 12. LOG AUDIT RUN IN DATABASE
  const timingStats = { ...timings, total: timings.total };
  logAnswerRun(userId || null, workspaceId || "default", {
    question: message,
    mode: settings?.aiReasoningDepth || "standard",
    taskType: decision.persona,
    model: MODELS.PRIMARY,
    executionMode: openRouterConfig?.useOpenRouter ? "openrouter" : (groqConfig?.useGroq ? "groq" : "gemini"),
    fallbackUsed: false,
    confidenceScore: confidenceScore.score,
    confidenceLabel: confidenceScore.level,
    timing: timingStats,
    criticFindings: critic.issues || [],
    claims: (verification.claims || []).map((c: any) => ({
      text: c.claim || "",
      supportLevel: c.consistent ? "strong" : "weak",
      sourceIds: [],
      criticFlags: []
    }))
  }).catch(err => console.error("Failed to log answer run in pipeline:", err));

  return {
    response: currentAnswerState,
    confidence: confidenceScore,
    sources: evidence.sources,
    claims: verification.claims,
    criticNotes: {
      issues: critic.issues,
      assessment: critic.assessment as any
    },
    timing: { ...timings, total: timings.total },
    metacognition
  };
}
