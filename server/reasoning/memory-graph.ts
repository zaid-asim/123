import { MODELS, getClient } from "./models";

export interface ExtractedFact {
  content: string;
  category: "general" | "personal" | "work" | "health" | "learning";
  tags: string;
}

export async function extractMemories(
  query: string,
  answerText: string,
  apiKey?: string
): Promise<ExtractedFact[]> {
  const client = getClient(apiKey);

  const systemInstruction = `You are a memory consolidation engine. Analyze the conversation turn (User query + Assistant response) and extract any persistent facts, preferences, user corrections, or styles that are worth remembering for future sessions.
Only extract facts that are personally relevant, or core corrections to preferences.
Avoid generic facts (e.g. "Paris is the capital of France"). Focus on user-specific or dialogue-correction facts (e.g. "User preferred Python explanations", "User lives in Mumbai", "User prefers concise answers", "Correction: user has 2 kids not 3").

Return a JSON object conforming exactly to this schema:
{
  "facts": [
    {
      "content": "<the concise fact to remember>",
      "category": "general" | "personal" | "work" | "health" | "learning",
      "tags": "<comma separated tags, e.g., 'preference,coding'>"
    }
  ]
}`;

  const contents = `User Query: "${query}"\n\nAssistant Answer:\n${answerText}`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.PRIMARY,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            facts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  content: { type: "string" },
                  category: { type: "string", enum: ["general", "personal", "work", "health", "learning"] },
                  tags: { type: "string" }
                },
                required: ["content", "category", "tags"]
              }
            }
          },
          required: ["facts"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch (err) {
    console.error("Failed to extract memories:", err);
    return [];
  }
}

// Filters relevant memories for a given query to keep context size low
export function getRelevantContext(query: string, memoriesList: Array<{ content: string }>): string {
  if (memoriesList.length === 0) return "";
  
  // A simple keyword-matching filter to extract relevant memories
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  if (queryWords.length === 0) {
    // Return last 3 memories if query is too short
    return memoriesList.slice(-3).map(m => `- ${m.content}`).join("\n");
  }

  const matches = memoriesList.filter(memory => {
    const memoryLower = memory.content.toLowerCase();
    return queryWords.some(word => memoryLower.includes(word));
  });

  // Fallback to top general preferences if no direct match
  const finalMemories = matches.length > 0 ? matches : memoriesList.slice(-5);
  return finalMemories.map(m => `- ${m.content}`).join("\n");
}
