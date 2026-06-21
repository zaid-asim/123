import { MODELS, getClient } from "../reasoning/models";

export interface ModelConfig {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  apiKey?: string;
}

export interface ModelResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ModelAdapter {
  generate(prompt: string, config?: ModelConfig): Promise<ModelResult>;
  stream(prompt: string, config?: ModelConfig): AsyncIterable<string>;
}

/**
 * Adapter for Gemini models (like gemini-3.5-flash or gemini-3.5-pro)
 */
export class GeminiModelAdapter implements ModelAdapter {
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const client = getClient(config.apiKey);
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          responseMimeType: config.responseMimeType,
          responseSchema: config.responseSchema,
        },
      });

      return {
        text: response.text || "",
        inputTokens: (response as any).usageMetadata?.promptTokenCount || 0,
        outputTokens: (response as any).usageMetadata?.candidatesTokenCount || 0,
      };
    } catch (error) {
      console.error(`Gemini model ${this.modelName} generate failed, falling back to local:`, error);
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const client = getClient(config.apiKey);
      const responseStream = await client.models.generateContentStream({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error(`Gemini model ${this.modelName} stream failed, streaming local fallback:`, error);
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

/**
 * Local deterministic fallback adapter in case Gemini is offline or API key is missing.
 */
export class LocalFallbackAdapter implements ModelAdapter {
  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    const text = `[Local Fallback Mode] I was unable to connect to the active service. Here is a local response based on your query:\n\nYou asked: "${prompt.slice(0, 100)}..."`;
    return {
      text,
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    const text = `[Local Fallback Mode] I was unable to connect to the active service. Here is a local response based on your query:\n\nYou asked: "${prompt.slice(0, 100)}..."`;
    
    // Simulate streaming by splitting word-by-word
    const words = text.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export type GroqConfig = {
  useGroq: boolean;
  groqApiKey?: string;
  groqModel?: string;
};

export type OpenRouterConfig = {
  useOpenRouter: boolean;
  openRouterApiKey?: string;
  openRouterModel?: string;
};

export class GroqModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      if (config.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      return {
        text,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error(`Groq model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from Groq API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`Groq model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export class OpenRouterModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      if (config.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://swadesh.ai",
          "X-Title": "Swadesh AI"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      return {
        text,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error(`OpenRouter model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://swadesh.ai",
          "X-Title": "Swadesh AI"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from OpenRouter API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`OpenRouter model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export type OpenAIConfig = {
  useOpenAI: boolean;
  openAiApiKey?: string;
  openAiModel?: string;
};

export type GrokConfig = {
  useGrok: boolean;
  grokApiKey?: string;
  grokModel?: string;
};

export class OpenAIModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      if (config.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      return {
        text,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error(`OpenAI model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from OpenAI API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`OpenAI model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export class GrokModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://api.x.ai/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      if (config.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grok API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      return {
        text,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error(`Grok model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://api.x.ai/v1/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grok API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from Grok API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`Grok model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export type DeepSeekConfig = {
  useDeepSeek: boolean;
  deepseekApiKey?: string;
  deepseekModel?: string;
};

export type AnthropicConfig = {
  useAnthropic: boolean;
  anthropicApiKey?: string;
  anthropicModel?: string;
};

export class DeepSeekModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://api.deepseek.com/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      if (config.responseMimeType === "application/json") {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      return {
        text,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error(`DeepSeek model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://api.deepseek.com/chat/completions";
      const messages = [];
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const body: any = {
        model: this.modelName,
        messages,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.maxOutputTokens) {
        body.max_tokens = config.maxOutputTokens;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from DeepSeek API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`DeepSeek model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export class AnthropicModelAdapter implements ModelAdapter {
  private modelName: string;
  private apiKey: string;

  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }

  async generate(prompt: string, config: ModelConfig = {}): Promise<ModelResult> {
    try {
      const url = "https://api.anthropic.com/v1/messages";
      const messages = [{ role: "user" as const, content: prompt }];

      const body: any = {
        model: this.modelName,
        messages,
        max_tokens: config.maxOutputTokens || 4096,
        temperature: config.temperature ?? 0.7,
      };

      if (config.systemInstruction) {
        body.system = config.systemInstruction;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      
      return {
        text,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      };
    } catch (error) {
      console.error(`Anthropic model ${this.modelName} generate failed, falling back to Gemini:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          return await new GeminiModelAdapter(MODELS.PRIMARY).generate(prompt, config);
        } catch (geminiError) {
          console.error("Gemini fallback generate also failed, using local fallback:", geminiError);
        }
      }
      return new LocalFallbackAdapter().generate(prompt, config);
    }
  }

  async *stream(prompt: string, config: ModelConfig = {}): AsyncIterable<string> {
    try {
      const url = "https://api.anthropic.com/v1/messages";
      const messages = [{ role: "user" as const, content: prompt }];

      const body: any = {
        model: this.modelName,
        messages,
        max_tokens: config.maxOutputTokens || 4096,
        temperature: config.temperature ?? 0.7,
        stream: true
      };

      if (config.systemInstruction) {
        body.system = config.systemInstruction;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API stream error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream from Anthropic API");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.substring(5).trim();

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error(`Anthropic model ${this.modelName} stream failed, streaming Gemini fallback:`, error);
      const geminiKey = config.apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
        try {
          const fallback = new GeminiModelAdapter(MODELS.PRIMARY);
          for await (const chunk of fallback.stream(prompt, config)) {
            yield chunk;
          }
          return;
        } catch (geminiError) {
          console.error("Gemini fallback stream also failed, using local fallback:", geminiError);
        }
      }
      const fallback = new LocalFallbackAdapter();
      for await (const chunk of fallback.stream(prompt, config)) {
        yield chunk;
      }
    }
  }
}

export function getActiveAdapter(
  apiKey?: string,
  groqConfig?: GroqConfig,
  openRouterConfig?: OpenRouterConfig,
  openAiConfig?: OpenAIConfig,
  grokConfig?: GrokConfig,
  geminiModel?: string,
  deepseekConfig?: DeepSeekConfig,
  anthropicConfig?: AnthropicConfig
): ModelAdapter {
  if (openAiConfig?.useOpenAI && openAiConfig.openAiApiKey) {
    return new OpenAIModelAdapter(
      openAiConfig.openAiModel || "gpt-5.5",
      openAiConfig.openAiApiKey
    );
  }

  if (grokConfig?.useGrok && grokConfig.grokApiKey) {
    return new GrokModelAdapter(
      grokConfig.grokModel || "grok-4.3",
      grokConfig.grokApiKey
    );
  }

  if (openRouterConfig?.useOpenRouter && openRouterConfig.openRouterApiKey) {
    return new OpenRouterModelAdapter(
      openRouterConfig.openRouterModel || "google/gemini-3.5-flash",
      openRouterConfig.openRouterApiKey
    );
  }

  if (groqConfig?.useGroq && groqConfig.groqApiKey) {
    return new GroqModelAdapter(
      groqConfig.groqModel || MODELS.GROQ_DEFAULT,
      groqConfig.groqApiKey
    );
  }

  if (deepseekConfig?.useDeepSeek && deepseekConfig.deepseekApiKey) {
    return new DeepSeekModelAdapter(
      deepseekConfig.deepseekModel || "deepseek-chat",
      deepseekConfig.deepseekApiKey
    );
  }

  if (anthropicConfig?.useAnthropic && anthropicConfig.anthropicApiKey) {
    return new AnthropicModelAdapter(
      anthropicConfig.anthropicModel || "claude-3-5-sonnet-latest",
      anthropicConfig.anthropicApiKey
    );
  }

  // Fallback to Gemini
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "your_gemini_api_key_here" && geminiKey !== "") {
    return new GeminiModelAdapter(geminiModel || MODELS.PRIMARY);
  }

  return new LocalFallbackAdapter();
}
