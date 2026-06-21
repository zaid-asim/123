import { MODELS, getClient } from "./models";

export interface ContextSketch {
  claims: string[];
  keySymbols: string[];
  summary: string;
}

export async function extractContextSketch(
  context: string,
  apiKey?: string
): Promise<ContextSketch> {
  const cleanContext = context.trim();
  if (cleanContext.length === 0) {
    return { claims: [], keySymbols: [], summary: "" };
  }

  // Bypass LLM extraction if context is extremely short (< 1500 chars, ~300 tokens)
  if (cleanContext.length < 1500) {
    return {
      claims: [cleanContext],
      keySymbols: [],
      summary: cleanContext
    };
  }

  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("Context sketch extraction failed to initialize Gemini client:", err);
    return {
      claims: [cleanContext.slice(0, 1000)],
      keySymbols: [],
      summary: cleanContext.slice(0, 500) + "..."
    };
  }

  const systemInstruction = `You are a context compression engine. Your task is to extract a dense "Fact Sketch" from the provided context text.
Extract:
1. "claims": Up to 6 core factual claims, rules, or assumptions.
2. "keySymbols": Important names, code APIs, mathematical variables, or unique identifiers.
3. "summary": A highly dense, structured summary under 150 words.

Be extremely concise and output ONLY the required JSON. Do not explain anything.`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents: `Context to compress:\n${cleanContext}`,
      config: {
        systemInstruction,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            claims: { type: "array", items: { type: "string" } },
            keySymbols: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          },
          required: ["claims", "keySymbols", "summary"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      keySymbols: Array.isArray(parsed.keySymbols) ? parsed.keySymbols : [],
      summary: parsed.summary || ""
    };
  } catch (err) {
    console.error("Failed to extract context sketch, using fallback:", err);
    return {
      claims: [cleanContext.slice(0, 1000)],
      keySymbols: [],
      summary: cleanContext.slice(0, 500) + "..."
    };
  }
}
