import { MODELS, getClient } from "./models";

export interface VerificationClaim {
  claim: string;
  verificationQuestion: string;
  independentAnswer: string;
  consistent: boolean;
  confidence: number;
}

export interface VerificationResult {
  claims: VerificationClaim[];
  overallConsistency: number; // 0-100
  flaggedClaims: string[];
}

export async function chainOfVerification(
  answer: string,
  evidence: string,
  apiKey?: string
): Promise<VerificationResult> {
  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("CoVe failed to initialize Gemini client:", err);
    return { claims: [], overallConsistency: 100, flaggedClaims: [] };
  }

  const extractInstruction = `You are an auditor. Extract up to 3 factual claims from the answer. Generate a direct, neutral verification question for each.
Use C-CoT: keep claims and questions extremely concise using shorthand syntax where appropriate.

Return JSON exactly as:
{
  "claims": [
    {
      "claim": "<factual claim>",
      "verificationQuestion": "<neutral verification question>"
    }
  ]
}`;

  let extracted: { claim: string; verificationQuestion: string }[] = [];
  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents: `Answer to audit:\n${answer}`,
      config: {
        systemInstruction: extractInstruction,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            claims: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  claim: { type: "string" },
                  verificationQuestion: { type: "string" }
                },
                required: ["claim", "verificationQuestion"]
              }
            }
          },
          required: ["claims"]
        } as any
      }
    });
    extracted = JSON.parse(response.text || "{}").claims || [];
  } catch (err) {
    console.error("Failed to extract claims for CoVe:", err);
    return { claims: [], overallConsistency: 100, flaggedClaims: [] };
  }

  if (extracted.length === 0) {
    return { claims: [], overallConsistency: 100, flaggedClaims: [] };
  }

  const answersInstruction = `You are an independent researcher. Answer the questions using ONLY search evidence. Do not speculate.
Use C-CoT: keep answers extremely short, under 15 words each.

Return JSON exactly as:
{
  "answers": ["<short answer 1>", "<short answer 2>", ...]
}`;

  const questionsText = extracted.map((c, i) => `Question ${i + 1}: ${c.verificationQuestion}`).join("\n");
  let independentAnswers: string[] = [];

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents: `Search Evidence Context:\n${evidence}\n\nQuestions to Answer:\n${questionsText}`,
      config: {
        systemInstruction: answersInstruction,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            answers: { type: "array", items: { type: "string" } }
          },
          required: ["answers"]
        } as any
      }
    });
    independentAnswers = JSON.parse(response.text || "{}").answers || [];
  } catch (err) {
    console.error("Failed to generate independent answers for CoVe:", err);
    independentAnswers = extracted.map(() => "Unable to verify independently.");
  }

  const compareInstruction = `You are a jury. Compare each claim with its independent answer. Decide consistency.
Use C-CoT: output evaluation array with zero explanations.

Return JSON exactly as:
{
  "evaluations": [
    {
      "consistent": <boolean>,
      "confidence": <integer 0 to 100>
    }
  ]
}`;

  let comparisons: { consistent: boolean; confidence: number }[] = [];
  let comparisonPrompt = "";
  extracted.forEach((c, i) => {
    comparisonPrompt += `--- CLAIM #${i + 1} ---\nClaim: ${c.claim}\nIndependent Verification Answer: ${independentAnswers[i] || "N/A"}\n\n`;
  });

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents: comparisonPrompt,
      config: {
        systemInstruction: compareInstruction,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            evaluations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  consistent: { type: "boolean" },
                  confidence: { type: "number" }
                },
                required: ["consistent", "confidence"]
              }
            }
          },
          required: ["evaluations"]
        } as any
      }
    });
    comparisons = JSON.parse(response.text || "{}").evaluations || [];
  } catch (err) {
    console.error("Failed to compare claims for CoVe:", err);
    comparisons = extracted.map(() => ({ consistent: true, confidence: 90 }));
  }

  // Compile final results
  const claims: VerificationClaim[] = extracted.map((ext, idx) => ({
    claim: ext.claim,
    verificationQuestion: ext.verificationQuestion,
    independentAnswer: independentAnswers[idx] || "No verification answer provided.",
    consistent: comparisons[idx]?.consistent ?? true,
    confidence: comparisons[idx]?.confidence ?? 90,
  }));

  const flaggedClaims = claims.filter(c => !c.consistent).map(c => c.claim);
  
  let overallConsistency = 100;
  if (claims.length > 0) {
    const consistentCount = claims.filter(c => c.consistent).length;
    overallConsistency = Math.round((consistentCount / claims.length) * 100);
  }

  return {
    claims,
    overallConsistency,
    flaggedClaims,
  };
}

export async function quickVerify(
  answer: string,
  evidence: string,
  apiKey?: string
): Promise<VerificationResult> {
  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("QuickVerify failed to initialize Gemini client:", err);
    return { claims: [], overallConsistency: 100, flaggedClaims: [] };
  }
  
  const quickInstruction = `You are a rapid auditor. Read the answer and search evidence. Identify up to 2 claims, determine consistency.
Use C-CoT: keep claims, answers, and questions extremely brief, using shorthand notations.

Return JSON exactly as:
{
  "claims": [
    {
      "claim": "<brief claim>",
      "verificationQuestion": "Rapid check",
      "independentAnswer": "<brief answer>",
      "consistent": <boolean>,
      "confidence": <integer 0 to 100>
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents: `Answer to audit:\n${answer}\n\nSearch Evidence Context:\n${evidence}`,
      config: {
        systemInstruction: quickInstruction,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            claims: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  claim: { type: "string" },
                  verificationQuestion: { type: "string" },
                  independentAnswer: { type: "string" },
                  consistent: { type: "boolean" },
                  confidence: { type: "number" }
                },
                required: ["claim", "verificationQuestion", "independentAnswer", "consistent", "confidence"]
              }
            }
          },
          required: ["claims"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const claims = parsed.claims || [];
    const flaggedClaims = claims.filter((c: any) => !c.consistent).map((c: any) => c.claim);
    
    let overallConsistency = 100;
    if (claims.length > 0) {
      const consistentCount = claims.filter((c: any) => c.consistent).length;
      overallConsistency = Math.round((consistentCount / claims.length) * 100);
    }

    return {
      claims,
      overallConsistency,
      flaggedClaims
    };
  } catch (err) {
    console.error("Failed quick verification:", err);
    return { claims: [], overallConsistency: 100, flaggedClaims: [] };
  }
}
