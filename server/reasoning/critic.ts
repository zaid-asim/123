import { MODELS, getClient } from "./models";

export interface CriticIssue {
  type: 'unsupported' | 'contradiction' | 'logical_gap' | 'overconfidence' | 'stale' | 'bias' | 'incomplete';
  severity: 'critical' | 'warning' | 'minor';
  description: string;
  suggestion: string;
}

export interface CriticResult {
  issues: CriticIssue[];
  assessment: 'pass' | 'revise' | 'fail';
  revisedAnswer?: string;
  strictnessLevel: 'lenient' | 'standard' | 'strict';
}

export async function runCritic(
  answer: string,
  evidence: string,
  strictness: 'lenient' | 'standard' | 'strict' = 'standard',
  apiKey?: string
): Promise<CriticResult> {
  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("Critic failed to initialize Gemini client:", err);
    return {
      issues: [],
      assessment: 'pass',
      strictnessLevel: strictness
    };
  }

  const strictnessRules = {
    lenient: "Only flag serious factual errors, outright contradictions, or completely unsupported claims.",
    standard: "Flag factual errors, logical leaps, overconfident assertions, bias, and internal contradictions.",
    strict: "Flag factual errors, minor logical gaps, overconfidence, selection bias in evidence, omission of important caveats, lack of balanced alternatives, or slight incompleteness."
  };

  const systemInstruction = `You are a hostile reviewer auditing the answer against evidence.
Rule: ${strictnessRules[strictness]}
Use C-CoT: keep issue descriptions and suggestions extremely short, using dense shorthand notations.

Return a JSON object conforming exactly to this schema:
{
  "issues": [
    {
      "type": "unsupported" | "contradiction" | "logical_gap" | "overconfidence" | "stale" | "bias" | "incomplete",
      "severity": "critical" | "warning" | "minor",
      "description": "<shorthand issue description>",
      "suggestion": "<shorthand suggestion to fix>"
    }
  ],
  "assessment": "pass" | "revise" | "fail",
  "revisedAnswer": "<revised answer ONLY if critical issues exist, else empty string>"
}`;

  const contents = `Proposed Answer:\n${answer}\n\nSearch Evidence Context:\n${evidence}`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["unsupported", "contradiction", "logical_gap", "overconfidence", "stale", "bias", "incomplete"] },
                  severity: { type: "string", enum: ["critical", "warning", "minor"] },
                  description: { type: "string" },
                  suggestion: { type: "string" }
                },
                required: ["type", "severity", "description", "suggestion"]
              }
            },
            assessment: { type: "string", enum: ["pass", "revise", "fail"] },
            revisedAnswer: { type: "string" }
          },
          required: ["issues", "assessment"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      assessment: parsed.assessment || 'pass',
      revisedAnswer: parsed.revisedAnswer || undefined,
      strictnessLevel: strictness
    };
  } catch (err) {
    console.error("Adversarial critic failed, passing by default:", err);
    return {
      issues: [],
      assessment: 'pass',
      strictnessLevel: strictness
    };
  }
}
