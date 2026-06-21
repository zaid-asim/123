export const QueryUnderstandingSchema = {
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
};
