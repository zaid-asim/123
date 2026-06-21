import { retrievePrivateEvidence } from "../knowledge/retrieval";
import { retrieveEvidence } from "../reasoning/retrieval";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, apiKey?: string) => Promise<any>;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  searchPrivateSources: {
    name: "searchPrivateSources",
    description: "Search private document workspace for files, reports, and team context",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or question matching private files" },
        workspaceId: { type: "string", description: "Workspace ID to search in, defaults to default" }
      },
      required: ["query"]
    },
    execute: async (args, apiKey) => {
      const workspaceId = args.workspaceId || "default";
      const results = await retrievePrivateEvidence(args.query, workspaceId, apiKey);
      return { results };
    }
  },

  searchPublicWeb: {
    name: "searchPublicWeb",
    description: "Search the public web for real-time information, news, current events",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term or query for Google Search" }
      },
      required: ["query"]
    },
    execute: async (args, apiKey) => {
      const evidence = await retrieveEvidence([args.query], 3, apiKey);
      return { synthesis: evidence.synthesis, sources: evidence.sources };
    }
  },

  calculate: {
    name: "calculate",
    description: "Calculate mathematical expressions safely",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Math expression, e.g., '120 * 45 / (12 + 8)'" }
      },
      required: ["expression"]
    },
    execute: async (args) => {
      try {
        // Safe evaluation of standard arithmetic
        const sanitized = args.expression.replace(/[^0-9+\-*/().\s]/g, "");
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        return { success: true, result };
      } catch (err) {
        return { success: false, error: "Failed to evaluate math expression" };
      }
    }
  },

  translate: {
    name: "translate",
    description: "Translate text between languages, including Indian regional languages",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to translate" },
        targetLanguage: { type: "string", description: "Target language code, e.g., 'hi' for Hindi, 'ta' for Tamil" }
      },
      required: ["text", "targetLanguage"]
    },
    execute: async (args, apiKey) => {
      // Dynamic import to avoid circular dependencies
      const { translateText } = await import("../gemini");
      try {
        const result = await translateText(args.text, "auto", args.targetLanguage, false, apiKey);
        return { success: true, translatedText: result };
      } catch (err: any) {
        return { success: false, error: err.message || "Translation failed" };
      }
    }
  }
};

/**
 * Executes a tool by name with safety checks.
 */
export async function executeTool(name: string, args: any, apiKey?: string): Promise<any> {
  const tool = TOOL_REGISTRY[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not found in registry.`);
  }
  console.log(`[ToolRegistry] Executing tool "${name}" with args:`, args);
  return await tool.execute(args, apiKey);
}

/**
 * Returns function declarations in format expected by Gemini tools configuration.
 */
export function getGeminiToolDeclarations() {
  return Object.values(TOOL_REGISTRY).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}
