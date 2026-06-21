import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  chat,
  analyzeDocument,
  analyzeCode,
  studyAssistant,
  translateText,
  searchAndSummarize,
  analyzeImage,
  generateCreativeContent,
  extractTextOCR,
  generateImagePrompt,
  checkGrammar,
  generateRecipe,
  planTravel,
  buildResume,
  getHealthAdvice,
  exploreCulture,
  getAstrologyInsights,
  getAyurvedaAdvice,
  getFinanceAdvice,
  testGeminiApiKey,
  testGroqApiKey,
  testOpenRouterApiKey,
  testOpenAiApiKey,
  testGrokApiKey,
  testDeepSeekApiKey,
  testAnthropicApiKey,
} from "./gemini";
import {
  chatRequestSchema,
  documentAnalysisSchema,
  codeAnalysisSchema,
  studyRequestSchema,
  languageConvertSchema,
  searchRequestSchema,
  imageAnalysisSchema,
  creativeRequestSchema,
  insertMemorySchema,
  insertConversationSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { processQuery } from "./reasoning/pipeline";

interface PipelineMetricEntry {
  timestamp: number;
  timing: {
    routing: number;
    retrieval: number;
    candidates: number;
    refine: number;
    verification: number;
    critic: number;
    ensemble: number;
    metacognition: number;
    total: number;
  };
  confidence: number;
}

const pipelineMetrics: PipelineMetricEntry[] = [];
const lastUserRequestTime = new Map<string, number>();

function cleanResult(text: string): string {
  if (!text) return "";
  return text.replace(/<think>[\s\S]*?(?:<\/think>|$)/ig, "").trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  function extractConfigs(req: any) {
    return {
      apiKey: req.headers["x-gemini-api-key"] as string | undefined,
      geminiModel: req.headers["x-gemini-model"] as string | undefined,
      groqConfig: {
        useGroq: req.headers["x-use-groq"] === "true",
        groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
        groqModel: req.headers["x-groq-model"] as string | undefined,
      },
      openRouterConfig: {
        useOpenRouter: req.headers["x-use-openrouter"] === "true",
        openRouterApiKey: req.headers["x-openrouter-api-key"] as string | undefined,
        openRouterModel: req.headers["x-openrouter-model"] as string | undefined,
      },
      openAiConfig: {
        useOpenAI: req.headers["x-use-openai"] === "true",
        openAiApiKey: req.headers["x-openai-api-key"] as string | undefined,
        openAiModel: req.headers["x-openai-model"] as string | undefined,
      },
      grokConfig: {
        useGrok: req.headers["x-use-grok"] === "true",
        grokApiKey: req.headers["x-grok-api-key"] as string | undefined,
        grokModel: req.headers["x-grok-model"] as string | undefined,
      },
      deepseekConfig: {
        useDeepSeek: req.headers["x-use-deepseek"] === "true",
        deepseekApiKey: req.headers["x-deepseek-api-key"] as string | undefined,
        deepseekModel: req.headers["x-deepseek-model"] as string | undefined,
      },
      anthropicConfig: {
        useAnthropic: req.headers["x-use-anthropic"] === "true",
        anthropicApiKey: req.headers["x-anthropic-api-key"] as string | undefined,
        anthropicModel: req.headers["x-anthropic-model"] as string | undefined,
      },
    };
  }


  // ─── Health Check (used by Render) ──────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "Swadesh AI",
      version: "2.0.0",
      uptime: Math.floor(process.uptime()),
      db: !!process.env.DATABASE_URL,
      ai: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/test-key", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "API key is required" });
    }
    try {
      const result = await testGeminiApiKey(apiKey);
      if (result.valid) {
        return res.json({ valid: true });
      } else {
        return res.status(400).json({ valid: false, error: result.error || "Invalid API key" });
      }
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── Groq key validation ──────────────────────────────────────────────────
  app.post("/api/test-key/groq", async (req, res) => {
    const apiKey = req.headers["x-groq-api-key"] as string | undefined;
    const model  = req.headers["x-groq-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "Groq API key is required" });
    }
    try {
      const result = await testGroqApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── OpenRouter key validation ────────────────────────────────────────────
  app.post("/api/test-key/openrouter", async (req, res) => {
    const apiKey = req.headers["x-openrouter-api-key"] as string | undefined;
    const model  = req.headers["x-openrouter-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "OpenRouter API key is required" });
    }
    try {
      const result = await testOpenRouterApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── OpenAI key validation ────────────────────────────────────────────────
  app.post("/api/test-key/openai", async (req, res) => {
    const apiKey = req.headers["x-openai-api-key"] as string | undefined;
    const model  = req.headers["x-openai-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "OpenAI API key is required" });
    }
    try {
      const result = await testOpenAiApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── Grok (xAI) key validation ────────────────────────────────────────────
  app.post("/api/test-key/grok", async (req, res) => {
    const apiKey = req.headers["x-grok-api-key"] as string | undefined;
    const model  = req.headers["x-grok-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "Grok API key is required" });
    }
    try {
      const result = await testGrokApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── DeepSeek key validation ──────────────────────────────────────────────
  app.post("/api/test-key/deepseek", async (req, res) => {
    const apiKey = req.headers["x-deepseek-api-key"] as string | undefined;
    const model  = req.headers["x-deepseek-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "DeepSeek API key is required" });
    }
    try {
      const result = await testDeepSeekApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });

  // ─── Anthropic key validation ─────────────────────────────────────────────
  app.post("/api/test-key/anthropic", async (req, res) => {
    const apiKey = req.headers["x-anthropic-api-key"] as string | undefined;
    const model  = req.headers["x-anthropic-model"]   as string | undefined;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "Anthropic API key is required" });
    }
    try {
      const result = await testAnthropicApiKey(apiKey, model);
      return result.valid
        ? res.json({ valid: true })
        : res.status(400).json({ valid: false, error: result.error });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || String(err) });
    }
  });


  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const memories = await storage.getMemories(userId);
      res.json({ user, memoriesCount: memories.length });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/user/setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateUserSetup(userId, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating setup:", error);
      res.status(500).json({ error: "Failed to update setup" });
    }
  });

  app.get("/api/memories", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() && !req.session?.devUser) {
        return res.json(req.session.guestMemories || []);
      }
      const userId = req.user.claims.sub;
      const memories = await storage.getMemories(userId);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", async (req: any, res) => {
    try {
      const data = insertMemorySchema.parse(req.body);
      if (!req.isAuthenticated() && !req.session?.devUser) {
        const guestMemory = {
          id: `guest-mem-${Math.random().toString(36).substring(2, 15)}`,
          userId: "guest",
          content: data.content,
          category: data.category || "general",
          tags: data.tags || "",
          isPinned: data.isPinned || false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        if (!req.session.guestMemories) {
          req.session.guestMemories = [];
        }
        req.session.guestMemories.push(guestMemory);
        return res.json(guestMemory);
      }
      const userId = req.user.claims.sub;
      const memory = await storage.createMemory(userId, data);
      res.json(memory);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Error creating memory:", error);
        res.status(500).json({ error: "Failed to create memory" });
      }
    }
  });

  app.patch("/api/memories/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!req.isAuthenticated() && !req.session?.devUser) {
        const list = req.session.guestMemories || [];
        const mem = list.find((m: any) => m.id === id);
        if (!mem) {
          return res.status(404).json({ error: "Memory not found" });
        }
        mem.content = content;
        mem.updatedAt = new Date();
        return res.json(mem);
      }
      const userId = req.user.claims.sub;
      const memory = await storage.updateMemory(id, userId, content);
      if (!memory) {
        return res.status(404).json({ error: "Memory not found" });
      }
      res.json(memory);
    } catch (error) {
      console.error("Error updating memory:", error);
      res.status(500).json({ error: "Failed to update memory" });
    }
  });

  app.delete("/api/memories/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      if (!req.isAuthenticated() && !req.session?.devUser) {
        if (req.session.guestMemories) {
          req.session.guestMemories = req.session.guestMemories.filter((m: any) => m.id !== id);
        }
        return res.json({ success: true });
      }
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteMemory(id, userId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Memory not found" });
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const convs = await storage.getConversations(userId);
      res.json(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertConversationSchema.parse(req.body);
      const conv = await storage.createConversation(userId, data);
      res.json(conv);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
      }
    }
  });

  app.patch("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const conv = await storage.updateConversation(id, userId, req.body);
      if (!conv) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conv);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.deleteConversation(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // ─── Knowledge Fabric endpoints ─────────────────────────────────────────────
  app.get("/api/sources", async (req, res) => {
    let workspaceId = req.query.workspaceId as string || "default";
    if (workspaceId === "default") {
      if (req.isAuthenticated()) {
        const userId = (req.user as any).claims?.sub;
        workspaceId = `user-${userId}`;
      } else {
        if (!(req as any).session.guestWorkspaceId) {
          (req as any).session.guestWorkspaceId = `guest-${Math.random().toString(36).substring(2, 15)}`;
        }
        workspaceId = (req as any).session.guestWorkspaceId;
      }
    }
    try {
      const docs = await storage.getSources(workspaceId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.post("/api/sources/upload", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const name = req.query.name as string;
    const type = req.query.type as any;
    let workspaceId = req.query.workspaceId as string || "default";
    if (workspaceId === "default") {
      if (req.isAuthenticated()) {
        const userId = (req.user as any).claims?.sub;
        workspaceId = `user-${userId}`;
      } else {
        if (!(req as any).session.guestWorkspaceId) {
          (req as any).session.guestWorkspaceId = `guest-${Math.random().toString(36).substring(2, 15)}`;
        }
        workspaceId = (req as any).session.guestWorkspaceId;
      }
    }
    
    if (!name || !type) {
      return res.status(400).json({ error: "Missing name or type query parameters" });
    }

    const validTypes = ["txt", "md", "csv", "json", "pdf", "docx"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Supported types: ${validTypes.join(", ")}` });
    }

    let userId: string | null = null;
    if (req.isAuthenticated()) {
      userId = (req.user as any).claims?.sub || null;
    }

    // Read raw body stream
    const dataChunks: Buffer[] = [];
    req.on("data", chunk => dataChunks.push(chunk));
    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(dataChunks);
        if (buffer.length === 0) {
          return res.status(400).json({ error: "File buffer is empty" });
        }

        // 1. Ingest/parse buffer text
        const { extractTextFromBuffer, chunkText, calculateTrustScore, computeVersionHash } = await import("./knowledge/ingestion");
        const text = await extractTextFromBuffer(buffer, type, name);
        if (!text || text.trim() === "") {
          return res.status(422).json({ error: "No text could be extracted from document" });
        }

        // 2. Chunk text
        const textChunks = chunkText(text);
        if (textChunks.length === 0) {
          return res.status(422).json({ error: "Failed to chunk document text" });
        }

        // 3. Compute lineage and trust scores
        const versionHash = computeVersionHash(buffer);
        const trustScore = calculateTrustScore(type, buffer.length);
        const tokenCount = Math.round(text.length / 4);

        // 4. Create source record
        const source = await storage.createSource(userId, workspaceId, {
          name,
          type,
          owner: userId ? "User" : "System",
          scope: "private",
          trustScore,
          versionHash,
          tokenCount
        });

        // 5. Generate embeddings and create chunk records
        const { generateBatchEmbeddings } = await import("./knowledge/embeddings");
        const embeddings = await generateBatchEmbeddings(textChunks, apiKey);

        const chunkInserts = textChunks.map((chunkText, idx) => ({
          sourceId: source.id,
          text: chunkText,
          embedding: embeddings[idx] || new Array(768).fill(0),
          tokenCount: Math.round(chunkText.length / 4),
          page: idx + 1
        }));

        await storage.createChunks(chunkInserts);

        res.json({ success: true, source, chunkCount: textChunks.length });
      } catch (err: any) {
        console.error("Document ingestion endpoint failed:", err);
        res.status(500).json({ error: err.message || "Failed to process document" });
      }
    });
  });

  app.delete("/api/sources/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const source = await storage.getSource(id);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      let currentWorkspaceId = "default";
      if (req.isAuthenticated()) {
        const userId = (req.user as any).claims?.sub;
        currentWorkspaceId = `user-${userId}`;
      } else {
        currentWorkspaceId = (req as any).session.guestWorkspaceId || "default";
      }
      if (source.workspaceId !== currentWorkspaceId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteSource(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Source not found" });
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      res.status(500).json({ error: "Failed to delete source" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = chatRequestSchema.parse(req.body);
      const useReasoning = data.settings?.useReasoningPipeline === true;
      const requestTime = Date.now();
      let userId = "";
      let workspaceId = "default";
      if (req.isAuthenticated()) {
        userId = (req.user as any).claims?.sub;
        if (userId) {
          lastUserRequestTime.set(userId, requestTime);
        }
        workspaceId = `user-${userId}`;
      } else {
        if (!(req as any).session.guestWorkspaceId) {
          (req as any).session.guestWorkspaceId = `guest-${Math.random().toString(36).substring(2, 15)}`;
        }
        workspaceId = (req as any).session.guestWorkspaceId;
      }
      
      let memoriesContext = "";
      if (userId) {
        const memories = await storage.getMemories(userId);
        if (memories.length > 0) {
          memoriesContext = "User's memories for context:\n" + memories.map(m => `- ${m.content}`).join("\n");
        }
      }
      const fullContext = [memoriesContext, data.context, data.mustReadMemory ? `MUST READ MEMORY (STRICTLY ADHERE TO THIS):\n${data.mustReadMemory}` : ""].filter(Boolean).join("\n\n");
      
      if (useReasoning) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
 
        const onStream = (event: string, data: any) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };
 
        const result = await processQuery(
          data.message,
          data.personality || "friendly",
          fullContext,
          data.settings,
          apiKey,
          groqConfig,
          onStream,
          userId,
          workspaceId,
          openRouterConfig,
          openAiConfig,
          grokConfig,
          geminiModel,
          deepseekConfig,
          anthropicConfig
        );
 
        // Record metrics
        pipelineMetrics.push({
          timestamp: Date.now(),
          timing: result.timing,
          confidence: result.confidence.score,
        });
 
        // Trigger memory extraction in background if user is authenticated
        if (userId) {
          import("./reasoning/memory-graph")
            .then(m => m.extractMemories(data.message, result.response, apiKey))
            .then(facts => {
              if (lastUserRequestTime.get(userId) !== requestTime) {
                console.log(`[Memory ETI] Cancelled background memory save for user ${userId} due to new turn.`);
                return;
              }
              if (facts && facts.length > 0) {
                facts.forEach(fact => {
                  storage.createMemory(userId, {
                    content: fact.content,
                    category: fact.category,
                    tags: fact.tags,
                    isPinned: false
                  }).catch(err => console.error("Failed to save background memory:", err));
                });
              }
            })
            .catch(err => console.error("Failed background memory process:", err));
        }
 
        res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
        res.end();
      } else {
        const response = await chat(
          data.message,
          data.personality || "friendly",
          fullContext || undefined,
          "chat",
          data.settings,
          apiKey,
          groqConfig,
          openRouterConfig,
          openAiConfig,
          grokConfig,
          geminiModel,
          deepseekConfig,
          anthropicConfig
        );
        res.json({ response });
      }
    } catch (error) {
      if (res.headersSent) {
        console.error("Chat error (stream already started):", error);
        const details = error instanceof Error ? error.message : String(error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to generate response", details })}\n\n`);
        res.end();
      } else {
        if (error instanceof ZodError) {
          res.status(400).json({ error: fromZodError(error).message });
        } else {
          console.error("Chat error:", error);
          const details = error instanceof Error ? error.message : String(error);
          res.status(500).json({ error: "Failed to generate response", details });
        }
      }
    }
  });
 
  app.post("/api/voice-chat", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = chatRequestSchema.parse(req.body);
      let memoriesContext = "";
      if (req.isAuthenticated()) {
        const userId = (req.user as any).claims?.sub;
        if (userId) {
          const memories = await storage.getMemories(userId);
          if (memories.length > 0) {
            memoriesContext = "User's memories for context:\n" + memories.map(m => `- ${m.content}`).join("\n");
          }
        }
      }
      const fullContext = [memoriesContext, data.context, data.mustReadMemory ? `MUST READ MEMORY (STRICTLY ADHERE TO THIS):\n${data.mustReadMemory}` : ""].filter(Boolean).join("\n\n");
      const response = await chat(
        data.message,
        data.personality || "friendly",
        fullContext || undefined,
        "voice",
        data.settings,
        apiKey,
        groqConfig,
        openRouterConfig,
        openAiConfig,
        grokConfig,
        geminiModel,
        deepseekConfig,
        anthropicConfig
      );
      res.json({ response });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Voice chat error:", error);
        res.status(500).json({ error: "Failed to generate response" });
      }
    }
  });

  app.post("/api/tools/document", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = documentAnalysisSchema.parse(req.body);
      const result = await analyzeDocument(data.content, data.action, data.targetLanguage, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Document analysis error:", error);
        res.status(500).json({ error: "Failed to analyze document" });
      }
    }
  });

  app.post("/api/tools/code", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = codeAnalysisSchema.parse(req.body);
      const result = await analyzeCode(data.code, data.action, data.language || "javascript", data.prompt, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Code analysis error:", error);
        res.status(500).json({ error: "Failed to process code" });
      }
    }
  });

  app.post("/api/tools/study", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = studyRequestSchema.parse(req.body);
      const result = await studyAssistant(data.topic, data.action, data.grade, data.subject, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Study assistant error:", error);
        res.status(500).json({ error: "Failed to provide study assistance" });
      }
    }
  });

  app.post("/api/tools/language", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = languageConvertSchema.parse(req.body);
      const result = await translateText(data.text, data.sourceLanguage, data.targetLanguage, data.transliterate || false, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Failed to translate" });
      }
    }
  });

  app.post("/api/tools/search", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = searchRequestSchema.parse(req.body);
      const result = await searchAndSummarize(data.query, data.type || "general", apiKey, geminiModel);
      res.json({
        summary: cleanResult(result.summary),
        sources: result.sources
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to search" });
      }
    }
  });

  app.post("/api/tools/image", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = imageAnalysisSchema.parse(req.body);
      const result = await analyzeImage(data.imageBase64, data.action, apiKey, geminiModel);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Image analysis error:", error);
        res.status(500).json({ error: "Failed to analyze image" });
      }
    }
  });

  app.post("/api/tools/creative", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const data = creativeRequestSchema.parse(req.body);
      const result = await generateCreativeContent(data.type, data.prompt, data.language || "en", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Creative content error:", error);
        res.status(500).json({ error: "Failed to generate content" });
      }
    }
  });

  // OCR - Extract text from image
  app.post("/api/tools/ocr", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });
      const result = await extractTextOCR(imageBase64, mimeType || "image/jpeg", apiKey, geminiModel);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ error: "Failed to extract text from image" });
    }
  });

  // AI Image Generation (description + prompt)
  app.post("/api/tools/image-gen", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { prompt, style } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });
      const result = await generateImagePrompt(prompt, style || "realistic", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Image gen error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Grammar Checker / Writing Assistant
  app.post("/api/tools/grammar", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { text, mode } = req.body;
      if (!text) return res.status(400).json({ error: "text is required" });
      const result = await checkGrammar(text, mode || "check", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Grammar error:", error);
      res.status(500).json({ error: "Failed to check grammar" });
    }
  });

  // Recipe AI
  app.post("/api/tools/recipe", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { query, dietary, cuisine } = req.body;
      if (!query) return res.status(400).json({ error: "query is required" });
      const result = await generateRecipe(query, dietary || "any", cuisine || "Indian", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Recipe error:", error);
      res.status(500).json({ error: "Failed to generate recipe" });
    }
  });

  // Travel Planner
  app.post("/api/tools/travel", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { destination, duration, budget, interests } = req.body;
      if (!destination) return res.status(400).json({ error: "destination is required" });
      const result = await planTravel(destination, duration || "3 days", budget || "moderate", interests || "culture, food, sightseeing", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Travel error:", error);
      res.status(500).json({ error: "Failed to plan travel" });
    }
  });

  // Resume Builder
  app.post("/api/tools/resume", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { name, email, phone, role, experience, skills, education, achievements } = req.body;
      if (!name || !role) return res.status(400).json({ error: "name and role are required" });
      const result = await buildResume({ name, email, phone, role, experience, skills, education, achievements }, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Resume error:", error);
      res.status(500).json({ error: "Failed to build resume" });
    }
  });

  // Health & Wellness AI
  app.post("/api/tools/health", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { symptom, age, type } = req.body;
      const result = await getHealthAdvice(symptom || "general wellness", age || "adult", type || "symptoms", apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Health error:", error);
      res.status(500).json({ error: "Failed to get health advice" });
    }
  });

  app.post("/api/tools/culture", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { topic } = req.body;
      const result = await exploreCulture(topic, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Culture error:", error);
      res.status(500).json({ error: "Failed to generate culture insights" });
    }
  });

  app.post("/api/tools/astrology", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const query = req.body.query || req.body.details || "";
      const result = await getAstrologyInsights(query, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Astrology error:", error);
      res.status(500).json({ error: "Failed to generate astrology insights" });
    }
  });

  app.post("/api/tools/ayurveda", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const query = req.body.query || req.body.symptoms || "";
      const result = await getAyurvedaAdvice(query, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Ayurveda error:", error);
      res.status(500).json({ error: "Failed to generate ayurveda advice" });
    }
  });

  app.post("/api/tools/finance", async (req, res) => {
    const { apiKey, geminiModel, groqConfig, openRouterConfig, openAiConfig, grokConfig, deepseekConfig, anthropicConfig } = extractConfigs(req);
    try {
      const { query } = req.body;
      const result = await getFinanceAdvice(query, apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
      res.json({ result: cleanResult(result) });
    } catch (error) {
      console.error("Finance error:", error);
      res.status(500).json({ error: "Failed to generate finance advice" });
    }
  });

  app.get("/api/metrics", (req, res) => {
    if (pipelineMetrics.length === 0) {
      return res.json({
        totalRequests: 0,
        averageConfidence: 0,
        averageTimings: {
          routing: 0,
          retrieval: 0,
          candidates: 0,
          refine: 0,
          verification: 0,
          critic: 0,
          ensemble: 0,
          metacognition: 0,
          total: 0
        }
      });
    }

    const total = pipelineMetrics.length;
    let sumConfidence = 0;
    const sumTimings = {
      routing: 0,
      retrieval: 0,
      candidates: 0,
      refine: 0,
      verification: 0,
      critic: 0,
      ensemble: 0,
      metacognition: 0,
      total: 0
    };

    pipelineMetrics.forEach(m => {
      sumConfidence += m.confidence;
      sumTimings.routing += m.timing.routing;
      sumTimings.retrieval += m.timing.retrieval;
      sumTimings.candidates += m.timing.candidates;
      sumTimings.refine += m.timing.refine;
      sumTimings.verification += m.timing.verification;
      sumTimings.critic += m.timing.critic;
      sumTimings.ensemble += m.timing.ensemble;
      sumTimings.metacognition += m.timing.metacognition;
      sumTimings.total += m.timing.total;
    });

    res.json({
      totalRequests: total,
      averageConfidence: Math.round(sumConfidence / total),
      averageTimings: {
        routing: Math.round(sumTimings.routing / total),
        retrieval: Math.round(sumTimings.retrieval / total),
        candidates: Math.round(sumTimings.candidates / total),
        refine: Math.round(sumTimings.refine / total),
        verification: Math.round(sumTimings.verification / total),
        critic: Math.round(sumTimings.critic / total),
        ensemble: Math.round(sumTimings.ensemble / total),
        metacognition: Math.round(sumTimings.metacognition / total),
        total: Math.round(sumTimings.total / total)
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
