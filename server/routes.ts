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
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

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

  app.post("/api/chat", async (req, res) => {
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
      const fullContext = [memoriesContext, data.context].filter(Boolean).join("\n\n");
      const response = await chat(
        data.message, 
        data.personality || "friendly", 
        fullContext || undefined,
        "chat"
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
      const fullContext = [memoriesContext, data.context].filter(Boolean).join("\n\n");
      const response = await chat(
        data.message, 
        data.personality || "friendly", 
        fullContext || undefined,
        "voice"
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
    try {
      const data = documentAnalysisSchema.parse(req.body);
      const result = await analyzeDocument(data.content, data.action, data.targetLanguage);
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
    try {
      const data = codeAnalysisSchema.parse(req.body);
      const result = await analyzeCode(data.code, data.action, data.language || "javascript", data.prompt);
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
    try {
      const data = studyRequestSchema.parse(req.body);
      const result = await studyAssistant(data.topic, data.action, data.grade, data.subject);
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
    try {
      const data = languageConvertSchema.parse(req.body);
      const result = await translateText(data.text, data.sourceLanguage, data.targetLanguage, data.transliterate || false);
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
    try {
      const data = searchRequestSchema.parse(req.body);
      const result = await searchAndSummarize(data.query, data.type || "general");
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
    try {
      const data = imageAnalysisSchema.parse(req.body);
      const result = await analyzeImage(data.imageBase64, data.action);
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
    try {
      const data = creativeRequestSchema.parse(req.body);
      const result = await generateCreativeContent(data.type, data.prompt, data.language || "en");
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

  const httpServer = createServer(app);
  return httpServer;
}
