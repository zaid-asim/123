import { MODELS, getClient } from "./models";

export async function selfRefine(
  draft: string,
  query: string,
  evidence: string,
  maxLoops: number,
  apiKey?: string
): Promise<{ refined: string; improvements: string[] }> {
  if (maxLoops <= 0) {
    return { refined: draft, improvements: [] };
  }

  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("SelfRefine failed to initialize Gemini client:", err);
    return { refined: draft, improvements: [] };
  }
  let currentDraft = draft;
  const improvements: string[] = [];

  for (let loop = 1; loop <= maxLoops; loop++) {
    const systemInstruction = `You are a quality editor. Critique and refine the draft.
Use C-CoT: make "issuesAddressed" list extremely short and direct, utilizing shorthand notations (e.g., [S: style], [F: factuality], [R: redundancy]).

Return a JSON object conforming exactly to this schema:
{
  "improvedDraft": "<the newly rewritten and refined answer>",
  "issuesAddressed": ["<highly condensed C-CoT shorthand statement>"]
}`;

    const contents = `User Query: "${query}"\n\nSearch Evidence Context:\n${evidence}\n\nDraft Answer to Improve:\n${currentDraft}`;

    try {
      const response = await client.models.generateContent({
        model: MODELS.PRIMARY,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              improvedDraft: { type: "string" },
              issuesAddressed: { type: "array", items: { type: "string" } }
            },
            required: ["improvedDraft", "issuesAddressed"]
          } as any
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.improvedDraft && parsed.improvedDraft.trim().length > 0) {
        currentDraft = parsed.improvedDraft;
        if (parsed.issuesAddressed && Array.isArray(parsed.issuesAddressed)) {
          improvements.push(...parsed.issuesAddressed);
        } else {
          improvements.push(`Refinement loop #${loop} completed.`);
        }
      }
    } catch (err) {
      console.error(`Self-refine loop #${loop} failed:`, err);
      break; // Exit the refinement loop early on model error
    }
  }

  return {
    refined: currentDraft,
    improvements
  };
}
