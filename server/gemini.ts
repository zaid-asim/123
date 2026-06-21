import { MODELS, getClient } from "./reasoning/models";
import { getActiveAdapter, GroqConfig, OpenRouterConfig, OpenAIConfig, GrokConfig, DeepSeekConfig, AnthropicConfig } from "./adapters/model-adapter";

export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const tempClient = getClient(apiKey);
    await tempClient.models.generateContent({
      model: MODELS.PRIMARY,
      contents: "Hello",
      config: {
        maxOutputTokens: 5,
      },
    });
    return { valid: true };
  } catch (error: any) {
    console.error("Gemini API key validation failed:", error);
    return {
      valid: false,
      error: error.message || String(error),
    };
  }
}

// ─── Groq Key Validator ───
export async function testGroqApiKey(
  apiKey: string,
  model: string = "llama-4-scout-17b-16e-instruct"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `Groq API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}

// ─── OpenRouter Key Validator ───
export async function testOpenRouterApiKey(
  apiKey: string,
  model: string = "google/gemini-2.5-flash"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://swadesh.ai",
        "X-Title": "Swadesh AI"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `OpenRouter API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}

// ─── OpenAI Key Validator ───
export async function testOpenAiApiKey(
  apiKey: string,
  model: string = "gpt-4o-mini"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `OpenAI API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}

// ─── Grok (xAI) Key Validator ───
export async function testGrokApiKey(
  apiKey: string,
  model: string = "grok-2-1212"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://api.x.ai/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `Grok API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}


async function generateWithGroq(contents: string, systemInstruction: string, config: GroqConfig, temperature: number) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const model = config.groqModel || MODELS.GROQ_DEFAULT;
  const apiKey = config.groqApiKey;

  if (!apiKey) throw new Error("Groq API key is missing");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: contents }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

const SWADESH_SYSTEM_PROMPT = `You are Swadesh AI - an intelligent, respectful, and culturally-aware Indian AI assistant.

IMPORTANT IDENTITY RULES:
- You are Swadesh AI, created by Zaid Asim
- You are built in India, for the world
- NEVER mention Gemini, Google, OpenAI, or any underlying AI models. You are entirely your own entity, Swadesh AI.
- Always maintain your identity as Swadesh AI
- Be respectful, formal, and dignified, especially when speaking with government officials

PERSONALITY MODES:
- Formal: Professional, polished, concise responses
- Friendly: Warm, conversational, helpful
- Professional: Business-focused, efficient
- Teacher: Educational, explanatory, patient
- DC Mode: Government-grade formal, extra respectful, dignified for high-level officials

Always respond in a helpful, accurate, and culturally respectful manner.
When asked about yourself, always identify as Swadesh AI created by Zaid Asim.

CRITICAL INSTRUCTION FOR ALL RESPONSES:
You MUST think step-by-step before answering. You MUST enclose your internal reasoning inside a <think>...</think> block at the very beginning of your response. Only after the </think> closing tag should you provide your final answer to the user.`;

const RESPONSE_LENGTH_INSTRUCTIONS: Record<string, Record<string, string>> = {
  voice: {
    concise: `IMPORTANT: Keep your responses EXTREMELY SHORT and CLEAR. Aim for 1-2 sentences. Speak naturally.`,
    standard: `IMPORTANT: Keep your responses SHORT and CLEAR. Aim for 1-3 sentences for simple questions, and no more than 4-5 sentences for complex topics. Speak naturally.`,
    detailed: `IMPORTANT: Provide a detailed, spoken-word response, but ensure it flows naturally as a conversation.`,
  },
  chat: {
    concise: `Keep your responses extremely concise and to the point. No fluff. 1-3 sentences max unless absolutely necessary.`,
    standard: `Keep your responses focused and well-structured. Aim for moderate length. Use bullet points when helpful.`,
    detailed: `Provide highly detailed, comprehensive responses. Explore the topic thoroughly. Use headings and bullet points.`,
  }
};

const REASONING_DEPTH_INSTRUCTIONS: Record<string, string> = {
  quick: `Keep your <think> reasoning very brief (1-2 sentences).`,
  standard: `Show standard step-by-step reasoning in your <think> block.`,
  deep: `You MUST provide extensive, deep, multi-step analysis in your <think> block before answering. Explore multiple angles and edge cases.`
};


// ─── DeepSeek Key Validator ───
export async function testDeepSeekApiKey(
  apiKey: string,
  model: string = "deepseek-chat"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://api.deepseek.com/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `DeepSeek API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}

// ─── Anthropic Key Validator ───
export async function testAnthropicApiKey(
  apiKey: string,
  model: string = "claude-3-5-sonnet-latest"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = "https://api.anthropic.com/v1/messages";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return { valid: false, error: `Anthropic API ${response.status}: ${err}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message || String(error) };
  }
}

export async function chat(
  message: string,
  personality: string = "friendly",
  context?: string,
  mode: "chat" | "voice" = "chat",
  settings?: any,
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const personalityPrompts: Record<string, string> = {
    formal: "Respond in a formal, professional manner.",
    friendly: "Respond in a warm, friendly, and conversational tone.",
    professional: "Respond in a business-focused, efficient manner.",
    teacher: "Respond like a patient teacher, explaining concepts clearly.",
    "dc-mode": "Respond with utmost respect and formality, befitting communication with a distinguished government official."
  };

  const responseLength = settings?.aiResponseLength || "standard";
  const reasoningDepth = settings?.aiReasoningDepth || "standard";
  const creativity = settings?.aiCreativity || "balanced";
  const language = settings?.language || "en";

  const lengthInstruction = RESPONSE_LENGTH_INSTRUCTIONS[mode][responseLength];
  const depthInstruction = REASONING_DEPTH_INSTRUCTIONS[reasoningDepth];
  
  const languageInstruction = language !== "en" 
    ? `\nCRITICAL LANGUAGE RULE: You MUST respond entirely in the target language requested by the user, using its NATIVE script. For example, if the language is Hindi, use Devanagari script. Do NOT use Romanized scripts for your final answer unless specifically asked for transliteration.`
    : "";

  const systemPrompt = `${SWADESH_SYSTEM_PROMPT}\n\n${lengthInstruction}\n${depthInstruction}\n\nCurrent personality: ${personalityPrompts[personality] || personalityPrompts.friendly}${languageInstruction}`;

  const fullMessage = context ? `Context: ${context}\n\nUser: ${message}` : message;

  // Temperature mapping
  let temperature = 0.7;
  if (creativity === "precise") temperature = 0.2;
  if (creativity === "creative") temperature = 1.2;

  try {
    let responseText = "";

    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(fullMessage, {
      systemInstruction: systemPrompt,
      temperature,
    });
    responseText = response.text || "I apologize, but I couldn't generate a response. Please try again.";

    return responseText;
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error("Failed to generate response");
  }
}

export async function analyzeDocument(
  content: string, 
  action: string, 
  targetLanguage?: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const prompts: Record<string, string> = {
    summarize: `Summarize the following document concisely, highlighting key points:\n\n${content}`,
    explain: `Provide a detailed explanation of the following document, breaking down complex concepts:\n\n${content}`,
    translate: `Translate the following text to ${targetLanguage || "Hindi"}:\n\n${content}`,
    "extract-notes": `Extract the key notes and important points from the following document in a structured format:\n\n${content}`,
    highlight: `Identify and highlight the most important sentences and concepts in the following document:\n\n${content}`,
  };

  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(prompts[action] || prompts.summarize, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a document analysis expert. Provide clear, accurate, and helpful analysis.`,
      apiKey
    });
    return response.text || "Unable to analyze the document.";
  } catch (error) {
    console.error("Document analysis error:", error);
    throw new Error("Failed to analyze document");
  }
}

export async function analyzeCode(
  code: string, 
  action: string, 
  language: string, 
  prompt?: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const prompts: Record<string, string> = {
    generate: `Generate ${language} code for the following requirement:\n\n${prompt}`,
    debug: `Debug the following ${language} code and explain the issues found:\n\n${code}`,
    optimize: `Optimize the following ${language} code for better performance and readability:\n\n${code}`,
    explain: `Explain the following ${language} code in detail, including what each part does:\n\n${code}`,
  };

  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(prompts[action] || prompts.explain, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert programmer. Provide clean, well-commented, production-ready code when generating. Be thorough when debugging or explaining.`,
      apiKey
    });
    return response.text || "Unable to process the code.";
  } catch (error) {
    console.error("Code analysis error:", error);
    throw new Error("Failed to analyze code");
  }
}

export async function studyAssistant(
  topic: string, 
  action: string, 
  grade?: string, 
  subject?: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const context = grade && subject ? `For Class ${grade} ${subject}: ` : "";

  const prompts: Record<string, string> = {
    "ncert-solution": `${context}Provide a detailed NCERT-style solution for: ${topic}. Include step-by-step explanation.`,
    "mcq-generate": `${context}Generate 5 multiple choice questions (MCQs) with answers and explanations on the topic: ${topic}`,
    "long-answer": `${context}Write a comprehensive long answer for: ${topic}. Include introduction, main points, and conclusion.`,
    "math-solve": `Solve the following math problem step by step, showing all work: ${topic}`,
    "explain-diagram": `Provide a detailed textual explanation of the following diagram or concept: ${topic}. Describe all components and their relationships.`,
  };

  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(prompts[action] || prompts["ncert-solution"], {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Indian education tutor familiar with NCERT curriculum. Provide accurate, student-friendly explanations.`,
      apiKey
    });
    return response.text || "Unable to provide study assistance.";
  } catch (error) {
    console.error("Study assistant error:", error);
    throw new Error("Failed to provide study assistance");
  }
}

export async function translateText(
  text: string, 
  sourceLanguage: string, 
  targetLanguage: string, 
  transliterate: boolean, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    bn: "Bengali",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi",
    or: "Odia",
    as: "Assamese",
    ur: "Urdu",
    ne: "Nepali",
    sa: "Sanskrit",
    kok: "Konkani",
  };

  const prompt = transliterate
    ? `Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}, and also provide Roman transliteration:\n\n${text}`
    : `Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}:\n\n${text}`;

  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(prompt, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a professional translator specializing in Indian languages. Provide accurate, natural-sounding translations.`,
      apiKey
    });
    return response.text || "Unable to translate.";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate");
  }
}

export async function searchAndSummarize(query: string, type: string, apiKey?: string, geminiModel?: string): Promise<{ summary: string; sources: Array<{ title: string; url: string; snippet: string }> }> {
  const typeContext: Record<string, string> = {
    general: "Provide a comprehensive answer",
    news: "Focus on recent news and current events",
    academic: "Provide an academic, research-focused response with citations",
  };

  try {
    const response = await getClient(apiKey).models.generateContent({
      model: geminiModel || MODELS.PRIMARY,
      contents: `${typeContext[type] || typeContext.general} for the following query: ${query}`,
      config: {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a search and research assistant. Provide accurate, well-organized information.`,
        tools: [{ googleSearch: {} }] as any,
      },
    });

    let sources = [
        { title: "Swadesh AI Knowledge Base", url: "https://swadesh.ai", snippet: "Powered by Swadesh AI - Built in India" },
        { title: "Indian Government Portal", url: "https://india.gov.in", snippet: "Official portal of the Government of India" },
        { title: "NCERT Online", url: "https://ncert.nic.in", snippet: "National Council of Educational Research and Training" },
    ];

    try {
      const candidates = (response as any).candidates?.[0];
      const grounding = candidates?.groundingMetadata?.groundingChunks;
      if (grounding && grounding.length > 0) {
        sources = grounding.filter((chunk: any) => chunk.web).map((chunk: any) => ({
          title: chunk.web.title || "Web Source",
          url: chunk.web.uri || "#",
          snippet: "Source from Google Search"
        }));
      }
    } catch(e) {
      console.error("Error parsing grounding", e);
    }

    let summary = "Unable to find relevant information.";
    try { summary = response.text || summary; } catch (e) { /* ignore */ }

    return {
      summary,
      sources,
    };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to search");
  }
}

export async function analyzeImage(imageBase64: string, action: string, apiKey?: string, geminiModel?: string): Promise<string> {
  const prompts: Record<string, string> = {
    ocr: "Extract all text from this image. Provide the text exactly as it appears.",
    "detect-objects": "Identify and list all objects visible in this image with their approximate locations.",
    "analyze-scene": "Describe this image in detail, including the scene, setting, colors, and any notable elements.",
    "extract-text": "Extract and organize any text, numbers, or symbols from this image in a structured format.",
  };

  try {
    const response = await getClient(apiKey).models.generateContent({
      model: geminiModel || MODELS.PRIMARY,
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

    try {
      return response.text || "Unable to analyze the image.";
    } catch (e) {
      return "Unable to analyze the image due to an empty response from the AI.";
    }
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error("Failed to analyze image");
  }
}

export async function generateCreativeContent(
  type: string, 
  prompt: string, 
  language: string = "en", 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const typePrompts: Record<string, string> = {
    script: `Write a detailed video/drama script for: ${prompt}. Include scene descriptions, dialogues, and directions.`,
    story: `Write a creative short story based on: ${prompt}. Include interesting characters, plot twists, and a satisfying ending.`,
    poem: `Write a beautiful ${language === "hi" ? "Hindi" : "English"} poem about: ${prompt}. Use appropriate rhyme scheme and poetic devices.`,
    "video-idea": `Generate 5 creative video ideas for: ${prompt}. Include title, concept, and brief outline for each.`,
  };

  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(typePrompts[type] || typePrompts.story, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a creative writer and content creator. Generate engaging, original content.`,
      apiKey
    });
    return response.text || "Unable to generate creative content.";
  } catch (error) {
    console.error("Creative content error:", error);
    throw new Error("Failed to generate creative content");
  }
}

export async function extractTextOCR(imageBase64: string, mimeType: string = "image/jpeg", apiKey?: string, geminiModel?: string): Promise<string> {
  try {
    const response = await getClient(apiKey).models.generateContent({
      model: geminiModel || MODELS.PRIMARY,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType as any,
                data: imageBase64,
              },
            },
            {
              text: "Extract ALL text from this image exactly as it appears. Preserve formatting, line breaks, and structure as much as possible. If there is handwritten text, transcribe it accurately. If there are multiple languages, identify each. Return ONLY the extracted text with no additional commentary.",
            },
          ],
        },
      ],
    });
    try {
      return response.text || "No text found in the image.";
    } catch (e) {
      return "Unable to extract text due to an empty response from the AI.";
    }
  } catch (error) {
    console.error("OCR error:", error);

    throw error;
  }
}

export async function generateImagePrompt(
  prompt: string, 
  style: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  // Since direct image generation via Gemini API may not be available in all regions,
  // we generate a detailed image description + SVG/ASCII art as a creative fallback
  try {
    const styleGuides: Record<string, string> = {
      realistic: "photorealistic, highly detailed, professional photography style",
      artistic: "artistic, painterly, impressionist style with vibrant colors",
      cartoon: "cartoon style, colorful, playful, animated",
      indian: "traditional Indian art style, Madhubani/Warli inspired, folk art, vibrant colors, cultural motifs",
      "3d": "3D render, CGI, modern, high-tech look",
      sketch: "pencil sketch, hand-drawn, detailed line art",
    };
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Generate an extremely detailed, vivid description of this image (as if describing it to an artist): "${prompt}" in ${styleGuides[style] || styleGuides.realistic} style. Make it 3-4 sentences rich in visual detail — colors, composition, lighting, atmosphere. Then on a new line write "PROMPT:" followed by a concise Stable Diffusion / DALL-E prompt for this image.`,
      { apiKey }
    );
    return response.text || "";
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

export async function checkGrammar(
  text: string, 
  mode: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const modePrompts: Record<string, string> = {
    check: `Check the following text for grammar, spelling, punctuation, and style errors. List each error with the correction and explanation:\n\n${text}`,
    improve: `Rewrite the following text to be more professional, clear, and well-written while preserving the original meaning. Show the improved version:\n\n${text}`,
    formal: `Convert the following text to formal/professional English:\n\n${text}`,
    casual: `Rewrite the following text in a friendly, casual tone:\n\n${text}`,
    hindi: `Check grammar and improve the following Hindi text. Provide corrections:\n\n${text}`,
  };
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(modePrompts[mode] || modePrompts.check, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert language editor and writing assistant.`,
      apiKey
    });
    return response.text || "";
  } catch (error) {
    console.error("Grammar check error:", error);
    throw error;
  }
}

export async function generateRecipe(
  query: string, 
  dietary: string, 
  cuisine: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Generate a detailed recipe for "${query}". Dietary preference: ${dietary}. Cuisine: ${cuisine}.
Include: Recipe name, Description, Prep time, Cook time, Servings, Ingredients (with quantities), Step-by-step instructions, Pro tips, Nutritional info (approximate). 
Format clearly with sections. Focus on Indian cooking techniques and authentic flavors where applicable.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Indian chef and nutritionist. You know traditional Indian recipes as well as fusion cuisine.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Recipe error:", error);
    throw error;
  }
}

export async function planTravel(
  destination: string, 
  duration: string, 
  budget: string, 
  interests: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Create a detailed travel itinerary for ${destination}.
Duration: ${duration} | Budget: ${budget} | Interests: ${interests}
Include: Day-by-day itinerary, must-see attractions, local food recommendations, accommodation suggestions, transportation tips, best time to visit, estimated costs, cultural tips and etiquette, packing suggestions, and hidden gems only locals know. Format beautifully with clear day headings.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Indian travel guide with deep knowledge of every state, city, heritage site, and tourist attraction in India and worldwide.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Travel planner error:", error);
    throw error;
  }
}

export async function buildResume(
  data: Record<string, string>, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Create a professional, ATS-optimized resume based on this information:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Role: ${data.role}
Experience: ${data.experience}
Skills: ${data.skills}
Education: ${data.education}
Achievements: ${data.achievements || ""}
Generate a complete, well-formatted resume with professional summary, experience bullets with impact metrics, skills section, education, and a closing statement. Use action verbs. Make it stand out for Indian job market.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert HR consultant and resume writer with 20 years of experience in the Indian and global job market.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Resume builder error:", error);
    throw error;
  }
}

export async function getHealthAdvice(
  symptom: string, 
  age: string, 
  type: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  const typePrompts: Record<string, string> = {
    symptoms: `I have these symptoms: ${symptom}. Age: ${age}. Provide: possible causes, home remedies, when to see a doctor, and general advice. Always recommend consulting a doctor for serious symptoms.`,
    yoga: `Recommend yoga poses and breathing exercises for: ${symptom}. Include: pose name, how to do it, duration, benefits. Age: ${age}.`,
    ayurveda: `Provide Ayurvedic home remedies and tips for: ${symptom}. Include traditional Indian remedies, herbs, dietary advice. Age: ${age}.`,
    diet: `Create a healthy Indian diet plan for: ${symptom || "general wellness"}. Age: ${age}. Include breakfast, lunch, dinner, snacks with Indian foods.`,
  };
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(typePrompts[type] || typePrompts.symptoms, {
      systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are a health and wellness advisor with knowledge of modern medicine, Ayurveda, and yoga. Always include a disclaimer that this is general information and not medical advice. Recommend consulting a qualified doctor for diagnosis and treatment.`,
      apiKey
    });
    return response.text || "";
  } catch (error) {
    console.error("Health advice error:", error);
    throw error;
  }
}

export async function exploreCulture(
  topic: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Provide a detailed, immersive exploration of this aspect of Indian culture, history, or heritage: "${topic}". Include historical context, cultural significance, and interesting facts.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert historian and cultural guide specializing in India's rich heritage.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Culture error:", error);
    throw error;
  }
}

export async function getAstrologyInsights(
  details: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Provide a basic Vedic astrology/Panchang insight based on these details: "${details}". Keep it respectful, educational, and include a disclaimer that this is for entertainment and traditional knowledge only.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert in Vedic Astrology (Jyotish) and Panchang calculations.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Astrology error:", error);
    throw error;
  }
}

export async function getAyurvedaAdvice(
  symptoms: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Provide holistic Ayurveda, Yoga, and natural remedy advice for: "${symptoms}". Include Dosha balancing tips and specific yoga asanas. Add a strict medical disclaimer.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Ayurvedic practitioner and Yoga guru. Provide structured, holistic wellness advice.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Ayurveda error:", error);
    throw error;
  }
}

export async function getFinanceAdvice(
  query: string, 
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig, openAiConfig?: OpenAIConfig, grokConfig?: GrokConfig, geminiModel?: string, deepseekConfig?: DeepSeekConfig, anthropicConfig?: AnthropicConfig
): Promise<string> {
  try {
    const adapter = getActiveAdapter(apiKey, groqConfig, openRouterConfig, openAiConfig, grokConfig, geminiModel, deepseekConfig, anthropicConfig);
    const response = await adapter.generate(
      `Provide detailed financial, tax, or business guidance for the Indian market regarding: "${query}". Include concepts like Mutual Funds, GST, EPF/PPF, or startup frameworks if relevant. Add a disclaimer that you are not a registered financial advisor.`,
      {
        systemInstruction: `${SWADESH_SYSTEM_PROMPT}\n\nYou are an expert Indian Chartered Accountant (CA) and financial advisor.`,
        apiKey
      }
    );
    return response.text || "";
  } catch (error) {
    console.error("Finance error:", error);
    throw error;
  }
}
