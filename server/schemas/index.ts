export { QueryUnderstandingSchema } from "./query-understanding.schema";

export const CriticFindingSchema = {
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
};

export const EvidencePlanSchema = {
  type: "object",
  properties: {
    queries: { type: "array", items: { type: "string" } },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    privateOnly: { type: "boolean" }
  },
  required: ["queries", "priority", "privateOnly"]
};

export const AnswerDraftSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    keyClaims: { type: "array", items: { type: "string" } },
    uncertaintyNotes: { type: "array", items: { type: "string" } }
  },
  required: ["answer", "keyClaims", "uncertaintyNotes"]
};

export const ConfidenceAssessmentSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    rationale: { type: "string" },
    factors: {
      type: "object",
      properties: {
        evidence: { type: "number" },
        verification: { type: "number" },
        critic: { type: "number" }
      },
      required: ["evidence", "verification", "critic"]
    }
  },
  required: ["score", "rationale", "factors"]
};

export const CitationMapSchema = {
  type: "object",
  properties: {
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          textQuote: { type: "string" },
          startIndex: { type: "number" },
          endIndex: { type: "number" }
        },
        required: ["sourceId", "textQuote", "startIndex", "endIndex"]
      }
    }
  },
  required: ["citations"]
};

export const SafetyDecisionSchema = {
  type: "object",
  properties: {
    safe: { type: "boolean" },
    flaggedCategory: { type: "string" },
    explanation: { type: "string" }
  },
  required: ["safe", "flaggedCategory", "explanation"]
};

export const LocalizationSchema = {
  type: "object",
  properties: {
    languageCode: { type: "string" },
    transliterateNeeded: { type: "boolean" },
    englishGlossaryTerms: { type: "array", items: { type: "string" } }
  },
  required: ["languageCode", "transliterateNeeded", "englishGlossaryTerms"]
};
