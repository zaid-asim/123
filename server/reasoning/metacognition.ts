import { MODELS, getClient } from "./models";

export interface MetaCognitionResult {
  knownUnknowns: string[];
  potentialBiases: string[];
  confidenceCalibration: string;
  suggestedFollowUp: string[];
}

export async function metaCognize(
  answer: string,
  verificationClaims: any[],
  criticIssues: any[],
  apiKey?: string
): Promise<MetaCognitionResult> {
  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("Metacognition failed to initialize Gemini client:", err);
    return {
      knownUnknowns: ["Unable to run meta-cognitive calibration check."],
      potentialBiases: [],
      confidenceCalibration: "Calibration failed; treat the entire answer with normal caution.",
      suggestedFollowUp: []
    };
  }

  const systemInstruction = `You are the meta-cognitive reasoning core of Swadesh AI. Analyze the proposed answer, factual audits, and critiques.
Use C-CoT: keep all outputs extremely brief, using dense shorthand notations.

Return JSON exactly as:
{
  "knownUnknowns": ["<brief shorthand uncertainty>"],
  "potentialBiases": ["<brief shorthand bias source>"],
  "confidenceCalibration": "<brief C-CoT calibration summary>",
  "suggestedFollowUp": ["<brief action/source verification suggestion>"]
}`;

  const claimsText = JSON.stringify(verificationClaims);
  const issuesText = JSON.stringify(criticIssues);

  const contents = `Proposed Answer:\n${answer}\n\nFactual Audits:\n${claimsText}\n\nAdversarial Critique Notes:\n${issuesText}`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            knownUnknowns: { type: "array", items: { type: "string" } },
            potentialBiases: { type: "array", items: { type: "string" } },
            confidenceCalibration: { type: "string" },
            suggestedFollowUp: { type: "array", items: { type: "string" } }
          },
          required: ["knownUnknowns", "potentialBiases", "confidenceCalibration", "suggestedFollowUp"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      knownUnknowns: Array.isArray(parsed.knownUnknowns) ? parsed.knownUnknowns : [],
      potentialBiases: Array.isArray(parsed.potentialBiases) ? parsed.potentialBiases : [],
      confidenceCalibration: parsed.confidenceCalibration || "No calibration statement provided.",
      suggestedFollowUp: Array.isArray(parsed.suggestedFollowUp) ? parsed.suggestedFollowUp : []
    };
  } catch (err) {
    console.error("Meta-cognition check failed:", err);
    return {
      knownUnknowns: ["Unable to run meta-cognitive calibration check."],
      potentialBiases: [],
      confidenceCalibration: "Calibration failed; treat the entire answer with normal caution.",
      suggestedFollowUp: []
    };
  }
}
