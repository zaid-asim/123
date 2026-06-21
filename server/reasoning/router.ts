import { performance } from "perf_hooks";
import { ExpertPersona } from "./personas";
import { MODELS, getClient } from "./models";

export type PipelineDepth = "direct" | "light" | "full" | "maximum";

export interface RoutingDecision {
  depth: PipelineDepth;
  persona: ExpertPersona;
  temperature: number;
  searchDepth: number;       // 0 = no search, 1-3 = light, 4-10 = deep
  candidateCount: number;    // 1 = direct, 3 = standard, 5 = maximum
  enableEnsemble: boolean;   // cross-check with Groq?
  enableSelfRefine: boolean; // iterative improvement?
  maxRefineLoops: number;    // 1-3
  searchQueries: string[];   // Suggested queries for Google Search
  bypassCandidates: boolean; // Skip candidate generation fork?
  bypassRefine: boolean;     // Skip self-refine pass?
  bypassCritic: boolean;     // Skip critic check?
}

export function localClassify(message: string): RoutingDecision | null {
  const cleanMsg = message.trim().toLowerCase();
  
  // 1. Obvious greetings
  const greetings = /^(hi|hello|hey|good morning|namaste|good afternoon|good evening|howdy|hola|heyy+)(\s+.*)?$/i;
  
  // 2. Simple conversational phrases
  const simplePhrases = [
    "thank you",
    "thanks",
    "ok",
    "okay",
    "yes",
    "no",
    "sure",
    "bye",
    "goodbye",
    "cool",
    "awesome",
    "great"
  ];
  
  // 3. Very short query (e.g. 1-2 words, unless it's a code block or something)
  const words = cleanMsg.split(/\s+/);
  const isGreeting = greetings.test(cleanMsg);
  const isSimplePhrase = simplePhrases.includes(cleanMsg);
  const isVeryShort = words.length <= 2 && !cleanMsg.includes("{") && !cleanMsg.includes("=") && !cleanMsg.includes("<");
  
  if (isGreeting || isSimplePhrase || isVeryShort) {
    return {
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
  
  return null;
}

export async function routeQuery(
  message: string,
  conversationHistory: string[] = [],
  apiKey?: string,
  hasGroq: boolean = false
): Promise<RoutingDecision> {
  const localDecision = localClassify(message);
  if (localDecision) {
    return localDecision;
  }

  if (process.env.LOCAL_SLM_URL) {
    try {
      const tStart = performance.now();
      const response = await fetch(process.env.LOCAL_SLM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: conversationHistory })
      });
      if (response.ok) {
        const parsed = await response.json();
        const latency = Math.round(performance.now() - tStart);
        console.log(`[LSED Router] Edge routing completed in ${latency}ms`);
        return parsed as RoutingDecision;
      }
    } catch (err) {
      console.error("[LSED Router] Local Edge routing failed, falling back to Gemini client:", err);
    }
  }

  let client;
  try {
    client = getClient(apiKey);
  } catch (err) {
    console.error("[Router] Failed to initialize Gemini client (missing API key?), falling back to direct mode:", err);
    return {
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
  
  const systemInstruction = `You are the core routing brain of Swadesh AI. Your job is to classify the user's incoming query and decide the best execution pipeline configuration.
Choose configurations based on:
1. "direct" depth: greetings, simple follow-ups, basic math, small talk, definitions. (Fastest, 1 model call).
2. "light" depth: factual lookups, weather, simple explanations. (Uses search, no self-refine/critic).
3. "full" depth: complex technical analysis, programming debugs, comparison, essay writing, creative tasks.
4. "maximum" depth: medical queries, high-stakes finance, legal analysis, reasoning puzzles. (Uses ensemble if available).

Choose the right expert persona from:
- software-architect
- medical-advisor
- financial-analyst
- legal-scholar
- data-scientist
- creative-writer
- teacher
- debugger
- security-expert
- systems-engineer
- researcher
- philosopher
- conversationalist
- indian-culture

Be extremely concise and output ONLY the required JSON. No explanations, no preamble.

Return a JSON object conforming exactly to this schema:
{
  "depth": "direct" | "light" | "full" | "maximum",
  "persona": "<one of the personas listed above>",
  "temperature": <float between 0.1 and 1.5, e.g., 0.2 for precise, 1.0 for creative>,
  "searchDepth": <integer 0 to 10>,
  "candidateCount": <integer 1 to 5>,
  "enableEnsemble": <boolean>,
  "enableSelfRefine": <boolean>,
  "maxRefineLoops": <integer 0 to 3>,
  "searchQueries": <array of 1-3 strings for search terms, empty array if searchDepth is 0>,
  "bypassCandidates": <boolean, set true for direct or light depth queries>,
  "bypassRefine": <boolean, set true for simple, direct, or factual lookups that do not require editing>,
  "bypassCritic": <boolean, set true for direct, light, or low-stakes creative tasks>
}`;

  const contents = `Classify this message: "${message}"\nHistory context (last 3 messages):\n${conversationHistory.slice(-3).join("\n")}`;

  try {
    const response = await client.models.generateContent({
      model: MODELS.ROUTING,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            depth: { type: "string", enum: ["direct", "light", "full", "maximum"] },
            persona: { 
              type: "string", 
              enum: [
                "software-architect", "medical-advisor", "financial-analyst", "legal-scholar", 
                "data-scientist", "creative-writer", "teacher", "debugger", "security-expert", 
                "systems-engineer", "researcher", "philosopher", "conversationalist", "indian-culture"
              ] 
            },
            temperature: { type: "number" },
            searchDepth: { type: "number" },
            candidateCount: { type: "number" },
            enableEnsemble: { type: "boolean" },
            enableSelfRefine: { type: "boolean" },
            maxRefineLoops: { type: "number" },
            searchQueries: { type: "array", items: { type: "string" } },
            bypassCandidates: { type: "boolean" },
            bypassRefine: { type: "boolean" },
            bypassCritic: { type: "boolean" }
          },
          required: [
            "depth", "persona", "temperature", "searchDepth", "candidateCount", 
            "enableEnsemble", "enableSelfRefine", "maxRefineLoops", "searchQueries",
            "bypassCandidates", "bypassRefine", "bypassCritic"
          ]
        } as any
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const decision: RoutingDecision = {
      depth: ["direct", "light", "full", "maximum"].includes(parsed.depth) ? parsed.depth : "direct",
      persona: parsed.persona || "conversationalist",
      temperature: typeof parsed.temperature === "number" ? parsed.temperature : 0.7,
      searchDepth: typeof parsed.searchDepth === "number" ? parsed.searchDepth : 0,
      candidateCount: typeof parsed.candidateCount === "number" ? parsed.candidateCount : 1,
      enableEnsemble: typeof parsed.enableEnsemble === "boolean" ? parsed.enableEnsemble : false,
      enableSelfRefine: typeof parsed.enableSelfRefine === "boolean" ? parsed.enableSelfRefine : false,
      maxRefineLoops: typeof parsed.maxRefineLoops === "number" ? parsed.maxRefineLoops : 0,
      searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [],
      bypassCandidates: typeof parsed.bypassCandidates === "boolean" ? parsed.bypassCandidates : (parsed.depth === "direct" || parsed.depth === "light"),
      bypassRefine: typeof parsed.bypassRefine === "boolean" ? parsed.bypassRefine : (parsed.depth === "direct" || parsed.depth === "light"),
      bypassCritic: typeof parsed.bypassCritic === "boolean" ? parsed.bypassCritic : (parsed.depth === "direct" || parsed.depth === "light")
    };
    // Ensure ensemble is only enabled if Groq is configured
    if (!hasGroq) decision.enableEnsemble = false;
    return decision;
  } catch (err) {
    console.error("Router model error, falling back to direct mode:", err);
    // Safe fallback configuration
    return {
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
}
