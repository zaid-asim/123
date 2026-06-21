import { GoogleGenAI } from "@google/genai";

export const MODELS = {
  PRIMARY: "gemini-3.5-flash",     // Answer generation
  ROUTING: "gemini-3.5-flash",     // Can downgrade to flash-lite
  REASONING: "gemini-3.5-pro",     // Complex analysis
  EMBEDDING: "text-embedding-004", // Semantic retrieval (gemini-embedding-2 fallback)
  LITE: "gemini-3.1-flash-lite",   // Lite classification
  GROQ_DEFAULT: "llama-4-scout-17b-16e-instruct",
};

let defaultAi: GoogleGenAI | null = null;

export function getClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here" || key === "") {
    throw new Error("No valid Gemini API key configured. Please add your API key in Settings.");
  }
  
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }
  
  if (!defaultAi) {
    defaultAi = new GoogleGenAI({ apiKey: key });
  }
  return defaultAi;
}
