import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SWADESH_SYSTEM_PROMPT = `You are Swadesh AI - an intelligent, respectful, and culturally-aware Indian AI assistant.

IMPORTANT IDENTITY RULES:
- You are Swadesh AI, created by Zaid Asim
- You are built in India, for the world
- NEVER mention Gemini, Google, or any underlying AI models
- Always maintain your identity as Swadesh AI
- Be respectful, formal, and dignified, especially when speaking with government officials

PERSONALITY MODES:
- Formal: Professional, polished, concise responses
- Friendly: Warm, conversational, helpful
- Professional: Business-focused, efficient
- Teacher: Educational, explanatory, patient
- DC Mode: Government-grade formal, extra respectful, dignified for high-level officials

Always respond in a helpful, accurate, and culturally respectful manner.
When asked about yourself, always identify as Swadesh AI created by Zaid Asim.`;

const RESPONSE_LENGTH_INSTRUCTIONS = {
  voice: `IMPORTANT: Keep your responses SHORT and CLEAR. Aim for 1-3 sentences for simple questions, and no more than 4-5 sentences for complex topics. Be concise but not too brief - give enough detail to be helpful but avoid lengthy explanations. Speak naturally as if having a conversation.`,
  chat: `Keep your responses focused and well-structured. Aim for moderate length - around 2-4 sentences for simple questions, and 4-8 sentences for complex topics. Use bullet points or numbered lists when helpful. Be informative but avoid unnecessary verbosity.`,
};

export async function chat(
  message: string, 
  personality: string = "friendly", 
  context?: string,
  mode: "chat" | "voice" = "chat"
): Promise<string> {
  const personalityPrompts: Record<string, string> = {
    formal: "Respond in a formal, professional manner.",
    friendly: "Respond in a warm, friendly, and conversational tone.",
    professional: "Respond in a business-focused, efficient manner.",
    teacher: "Respond like a patient teacher, explaining concepts clearly.",
    "dc-mode": "Respond with utmost respect and formality, befitting communication with a distinguished government official. Use honorifics and formal language."
  };

  const lengthInstruction = RESPONSE_LENGTH_INSTRUCTIONS[mode];
  const systemPrompt = `${SWADESH_SYSTEM_PROMPT}\n\n${lengthInstruction}\n\nCurrent personality: ${personalityPrompts[personality] || personalityPrompts.friendly}`;

  const fullMessage = context ? `Context: ${context}\n\nUser: ${message}` : message;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullMessage,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error("Failed to generate response");
  }
}

export async function analyzeDocument(content: string, action: string, targetLanguage?: string): Promise<string> {
  const prompts: Record<string, string> = {
    summarize: `Summarize the following document concisely, highlighting key points:\n\n${content}`,
    explain: `Provide a detailed explanation of the following document, breaking down complex concepts:\n\n${content}`,
    translate: `Translate the following text to ${targetLanguage || "Hindi"}:\n\n${content}`,
    "extract-notes": `Extract the key notes and important points from the following document in a structured format:\n\n${content}`,
    highlight: `Identify and highlight the most important sentences and concepts in the following document:\n\n${content}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[action] || prompts.summarize,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a document analysis expert. Provide clear, accurate, and helpful analysis.`,
      },
    });

    return response.text || "Unable to analyze the document.";
  } catch (error) {
    console.error("Document analysis error:", error);
    throw new Error("Failed to analyze document");
  }
}

export async function analyzeCode(code: string, action: string, language: string, prompt?: string): Promise<string> {
  const prompts: Record<string, string> = {
    generate: `Generate ${language} code for the following requirement:\n\n${prompt}`,
    debug: `Debug the following ${language} code and explain the issues found:\n\n${code}`,
    optimize: `Optimize the following ${language} code for better performance and readability:\n\n${code}`,
    explain: `Explain the following ${language} code in detail, including what each part does:\n\n${code}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[action] || prompts.explain,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert programmer. Provide clean, well-commented, production-ready code when generating. Be thorough when debugging or explaining.`,
      },
    });

    return response.text || "Unable to process the code.";
  } catch (error) {
    console.error("Code analysis error:", error);
    throw new Error("Failed to analyze code");
  }
}

export async function studyAssistant(topic: string, action: string, grade?: string, subject?: string): Promise<string> {
  const context = grade && subject ? `For Class ${grade} ${subject}: ` : "";
  
  const prompts: Record<string, string> = {
    "ncert-solution": `${context}Provide a detailed NCERT-style solution for: ${topic}. Include step-by-step explanation.`,
    "mcq-generate": `${context}Generate 5 multiple choice questions (MCQs) with answers and explanations on the topic: ${topic}`,
    "long-answer": `${context}Write a comprehensive long answer for: ${topic}. Include introduction, main points, and conclusion.`,
    "math-solve": `Solve the following math problem step by step, showing all work: ${topic}`,
    "explain-diagram": `Provide a detailed textual explanation of the following diagram or concept: ${topic}. Describe all components and their relationships.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[action] || prompts["ncert-solution"],
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Indian education tutor familiar with NCERT curriculum. Provide accurate, student-friendly explanations.`,
      },
    });

    return response.text || "Unable to provide study assistance.";
  } catch (error) {
    console.error("Study assistant error:", error);
    throw new Error("Failed to provide study assistance");
  }
}

export async function translateText(text: string, sourceLanguage: string, targetLanguage: string, transliterate: boolean): Promise<string> {
  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    bn: "Bengali",
  };

  const prompt = transliterate
    ? `Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}, and also provide Roman transliteration:\n\n${text}`
    : `Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}:\n\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a professional translator specializing in Indian languages. Provide accurate, natural-sounding translations.`,
      },
    });

    return response.text || "Unable to translate.";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate");
  }
}

export async function searchAndSummarize(query: string, type: string): Promise<{ summary: string; sources: Array<{ title: string; url: string; snippet: string }> }> {
  const typeContext: Record<string, string> = {
    general: "Provide a comprehensive answer",
    news: "Focus on recent news and current events",
    academic: "Provide an academic, research-focused response with citations",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${typeContext[type] || typeContext.general} for the following query: ${query}`,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a search and research assistant. Provide accurate, well-organized information.`,
      },
    });

    return {
      summary: response.text || "Unable to find relevant information.",
      sources: [
        { title: "Swadesh AI Knowledge Base", url: "https://swadesh.ai", snippet: "Powered by Swadesh AI - Built in India" },
        { title: "Indian Government Portal", url: "https://india.gov.in", snippet: "Official portal of the Government of India" },
        { title: "NCERT Online", url: "https://ncert.nic.in", snippet: "National Council of Educational Research and Training" },
      ],
    };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to search");
  }
}

export async function analyzeImage(imageBase64: string, action: string): Promise<string> {
  const prompts: Record<string, string> = {
    ocr: "Extract all text from this image. Provide the text exactly as it appears.",
    "detect-objects": "Identify and list all objects visible in this image with their approximate locations.",
    "analyze-scene": "Describe this image in detail, including the scene, setting, colors, and any notable elements.",
    "extract-text": "Extract and organize any text, numbers, or symbols from this image in a structured format.",
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
        prompts[action] || prompts["analyze-scene"],
      ],
    });

    return response.text || "Unable to analyze the image.";
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error("Failed to analyze image");
  }
}

export async function generateCreativeContent(type: string, prompt: string, language: string = "en"): Promise<string> {
  const typePrompts: Record<string, string> = {
    script: `Write a detailed video/drama script for: ${prompt}. Include scene descriptions, dialogues, and directions.`,
    story: `Write a creative short story based on: ${prompt}. Include interesting characters, plot twists, and a satisfying ending.`,
    poem: `Write a beautiful ${language === "hi" ? "Hindi" : "English"} poem about: ${prompt}. Use appropriate rhyme scheme and poetic devices.`,
    "video-idea": `Generate 5 creative video ideas for: ${prompt}. Include title, concept, and brief outline for each.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: typePrompts[type] || typePrompts.story,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a creative writer and content creator. Generate engaging, original content.`,
      },
    });

    return response.text || "Unable to generate creative content.";
  } catch (error) {
    console.error("Creative content error:", error);
    throw new Error("Failed to generate creative content");
  }
}
