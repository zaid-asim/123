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

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

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

  app.get("/api/memories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memories = await storage.getMemories(userId);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMemorySchema.parse(req.body);
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

  app.patch("/api/memories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { content } = req.body;
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

  app.delete("/api/memories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.deleteMemory(id, userId);
      res.json({ success: true });
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

  app.post("/api/chat", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
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
        "chat",
        data.settings,
        apiKey,
        groqConfig
      );
      res.json({ response });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to generate response" });
      }
    }
  });

  app.post("/api/voice-chat", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
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
        groqConfig
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = documentAnalysisSchema.parse(req.body);
      const result = await analyzeDocument(data.content, data.action, data.targetLanguage, apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = codeAnalysisSchema.parse(req.body);
      const result = await analyzeCode(data.code, data.action, data.language || "javascript", data.prompt, apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = studyRequestSchema.parse(req.body);
      const result = await studyAssistant(data.topic, data.action, data.grade, data.subject, apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = languageConvertSchema.parse(req.body);
      const result = await translateText(data.text, data.sourceLanguage, data.targetLanguage, data.transliterate || false, apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = searchRequestSchema.parse(req.body);
      const result = await searchAndSummarize(data.query, data.type || "general", apiKey);
      res.json(result);
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = imageAnalysisSchema.parse(req.body);
      const result = await analyzeImage(data.imageBase64, data.action, apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const data = creativeRequestSchema.parse(req.body);
      const result = await generateCreativeContent(data.type, data.prompt, data.language || "en", apiKey);
      res.json({ result });
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
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });
      const result = await extractTextOCR(imageBase64, mimeType || "image/jpeg", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ error: "Failed to extract text from image" });
    }
  });

  // AI Image Generation (description + prompt)
  app.post("/api/tools/image-gen", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { prompt, style } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });
      const result = await generateImagePrompt(prompt, style || "realistic", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Image gen error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Grammar Checker / Writing Assistant
  app.post("/api/tools/grammar", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { text, mode } = req.body;
      if (!text) return res.status(400).json({ error: "text is required" });
      const result = await checkGrammar(text, mode || "check", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Grammar error:", error);
      res.status(500).json({ error: "Failed to check grammar" });
    }
  });

  // Recipe AI
  app.post("/api/tools/recipe", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query, dietary, cuisine } = req.body;
      if (!query) return res.status(400).json({ error: "query is required" });
      const result = await generateRecipe(query, dietary || "any", cuisine || "Indian", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Recipe error:", error);
      res.status(500).json({ error: "Failed to generate recipe" });
    }
  });

  // Travel Planner
  app.post("/api/tools/travel", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { destination, duration, budget, interests } = req.body;
      if (!destination) return res.status(400).json({ error: "destination is required" });
      const result = await planTravel(destination, duration || "3 days", budget || "moderate", interests || "culture, food, sightseeing", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Travel error:", error);
      res.status(500).json({ error: "Failed to plan travel" });
    }
  });

  // Resume Builder
  app.post("/api/tools/resume", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { name, email, phone, role, experience, skills, education, achievements } = req.body;
      if (!name || !role) return res.status(400).json({ error: "name and role are required" });
      const result = await buildResume({ name, email, phone, role, experience, skills, education, achievements }, apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Resume error:", error);
      res.status(500).json({ error: "Failed to build resume" });
    }
  });

  // Health & Wellness AI
  app.post("/api/tools/health", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { symptom, age, type } = req.body;
      const result = await getHealthAdvice(symptom || "general wellness", age || "adult", type || "symptoms", apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Health error:", error);
      res.status(500).json({ error: "Failed to get health advice" });
    }
  });

  
  app.post("/api/tools/culture", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { topic } = req.body;
      const result = await exploreCulture(topic, apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Culture error:", error);
      res.status(500).json({ error: "Failed to generate culture insights" });
    }
  });

  app.post("/api/tools/astrology", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query } = req.body;
      const result = await getAstrologyInsights(query, apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Astrology error:", error);
      res.status(500).json({ error: "Failed to generate astrology insights" });
    }
  });

  app.post("/api/tools/ayurveda", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query } = req.body;
      const result = await getAyurvedaAdvice(query, apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Ayurveda error:", error);
      res.status(500).json({ error: "Failed to generate ayurveda advice" });
    }
  });

  app.post("/api/tools/finance", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query } = req.body;
      const result = await getFinanceAdvice(query, apiKey);
      res.json({ result });
    } catch (error) {
      console.error("Finance error:", error);
      res.status(500).json({ error: "Failed to generate finance advice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
