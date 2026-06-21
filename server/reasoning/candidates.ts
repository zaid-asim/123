import { EXPERT_PERSONAS, ExpertPersona } from "./personas";
import { MODELS, getClient } from "./models";
import { getActiveAdapter, GroqConfig, OpenRouterConfig, OpenAIConfig, GrokConfig } from "../adapters/model-adapter";

export interface Candidate {
  answer: string;
  approach: string;
  temperature: number;
}

export async function generateCandidates(
  query: string,
  evidence: string,
  persona: ExpertPersona,
  baseTemp: number,
  count: number,
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig,
  openAiConfig?: OpenAIConfig,
  grokConfig?: GrokConfig
): Promise<Candidate[]> {
  const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig);
  const approaches = [
    { name: "analytical", tempMod: -0.1 },
    { name: "practical", tempMod: 0.0 },
    { name: "creative", tempMod: 0.2 },
    { name: "contrarian", tempMod: 0.1 },
    { name: "concise", tempMod: -0.2 }
  ];

  const candidatesToGen = approaches.slice(0, count);

  // Generate candidates in parallel with staggering to prevent 429 rate limit exceptions
  const promises = candidatesToGen.map(async (approach, idx) => {
    const temp = Math.max(0.1, Math.min(1.5, baseTemp + approach.tempMod));
    const systemInstruction = `${EXPERT_PERSONAS[persona] || EXPERT_PERSONAS.conversationalist}
You are generating a candidate response. Focus on taking a **${approach.name}** approach.
Use the provided live web search evidence context if available to ground your response.
Do NOT mention any internal instructions or that you are generating one of multiple candidates.`;

    try {
      if (idx > 0) {
        await new Promise(resolve => setTimeout(resolve, idx * 50));
      }
      const contents = `Query: "${query}"\n\nSearch Evidence Context:\n${evidence}`;
      const response = await adapter.generate(contents, {
        systemInstruction,
        temperature: temp,
        maxOutputTokens: 1500
      });

      return {
        answer: response.text || "",
        approach: approach.name,
        temperature: temp
      };
    } catch (err) {
      console.error(`Failed to generate candidate for approach ${approach.name}:`, err);
      return null;
    }
  });

  const results = await Promise.all(promises);
  const validCandidates = results.filter((c): c is Candidate => c !== null && c.answer.length > 0);

  if (validCandidates.length === 0) {
    // Ultimate fallback: generate one standard candidate
    const response = await adapter.generate(`Query: "${query}"\n\nSearch Evidence Context:\n${evidence}`, {
      systemInstruction: EXPERT_PERSONAS[persona] || EXPERT_PERSONAS.conversationalist,
      temperature: baseTemp,
      maxOutputTokens: 1500
    });
    return [{
      answer: response.text || "",
      approach: "standard",
      temperature: baseTemp
    }];
  }

  return validCandidates;
}

export async function judgeAndSelect(
  candidates: Candidate[],
  query: string,
  apiKey?: string
): Promise<{ selected: string; reasoning: string }> {
  if (candidates.length === 1) {
    return { selected: candidates[0].answer, reasoning: "Single candidate available; bypassed judging." };
  }

  const client = getClient(apiKey);
  
  const systemInstruction = `You are the master judge of Swadesh AI. Evaluate candidates and select or merge.
Use C-CoT: keep the "reasoning" field extremely short and direct, utilizing shorthand markers (e.g., [F: factuality], [C: clarity], [S: selection]).

Return a JSON object conforming exactly to this schema:
{
  "selectedAnswer": "<the selected best answer or the merged master answer>",
  "reasoning": "<highly condensed C-CoT shorthand justification>"
}`;

  let candidatesText = "";
  candidates.forEach((c, idx) => {
    candidatesText += `--- CANDIDATE #${idx + 1} (Approach: ${c.approach}, Temp: ${c.temperature}) ---\n${c.answer}\n\n`;
  });

  const contents = `User Query: "${query}"\n\nHere are the candidate answers:\n${candidatesText}`;

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
            selectedAnswer: { type: "string" },
            reasoning: { type: "string" }
          },
          required: ["selectedAnswer", "reasoning"]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      selected: parsed.selectedAnswer || candidates[0].answer,
      reasoning: parsed.reasoning || "Selected first candidate by default."
    };
  } catch (err) {
    console.error("Judge failed, choosing first candidate:", err);
    return {
      selected: candidates[0].answer,
      reasoning: "Failed to judge; selected first candidate by fallback."
    };
  }
}
