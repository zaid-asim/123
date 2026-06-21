import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { toast } from "@/hooks/use-toast";

export function getApiUrl(url: string): string {
  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return url.startsWith("/") ? `${apiUrl}${url}` : url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMsg = `${res.status}: ${text || res.statusText}`;
    let displayMsg = text || "An unexpected error occurred.";
    
    try {
      const parsed = JSON.parse(text);
      if (parsed.details) {
        errorMsg = `${res.status}: ${parsed.details}`;
        displayMsg = parsed.details;
      } else if (parsed.error) {
        errorMsg = `${res.status}: ${parsed.error}`;
        displayMsg = parsed.error;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }

    toast({
      title: "API Error",
      description: displayMsg,
      variant: "destructive",
    });
    throw new Error(errorMsg);
  }
}

function getGeminiHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      const headers: Record<string, string> = {};
      if (settings.geminiModel) {
        headers["x-gemini-model"] = settings.geminiModel;
      }
      if (settings.useCustomApiKey && settings.customApiKey) {
        headers["x-gemini-api-key"] = settings.customApiKey;
      }
      return headers;
    }
  } catch (e) {}
  return null;
}

function getDeepSeekHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useDeepSeek && settings.deepseekApiKey) {
        return {
          "x-use-deepseek": "true",
          "x-deepseek-api-key": settings.deepseekApiKey,
          "x-deepseek-model": settings.deepseekModel || "deepseek-chat",
        };
      }
    }
  } catch (e) {}
  return null;
}

function getAnthropicHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useAnthropic && settings.anthropicApiKey) {
        return {
          "x-use-anthropic": "true",
          "x-anthropic-api-key": settings.anthropicApiKey,
          "x-anthropic-model": settings.anthropicModel || "claude-3-5-sonnet-latest",
        };
      }
    }
  } catch (e) {}
  return null;
}

function getGroqHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useGroq && settings.groqApiKey) {
        return {
          "x-use-groq": "true",
          "x-groq-api-key": settings.groqApiKey,
          "x-groq-model": settings.groqModel || "llama-4-scout-17b-16e-instruct",
        };
      }
    }
  } catch (e) {}
  return null;
}

function getOpenRouterHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useOpenRouter && settings.openRouterApiKey) {
        return {
          "x-use-openrouter": "true",
          "x-openrouter-api-key": settings.openRouterApiKey,
          "x-openrouter-model": settings.openRouterModel || "google/gemini-2.5-flash",
        };
      }
    }
  } catch (e) {}
  return null;
}

function getOpenAIHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useOpenAI && settings.openAiApiKey) {
        return {
          "x-use-openai": "true",
          "x-openai-api-key": settings.openAiApiKey,
          "x-openai-model": settings.openAiModel || "gpt-4o-mini",
        };
      }
    }
  } catch (e) {}
  return null;
}

function getGrokHeaders() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useGrok && settings.grokApiKey) {
        return {
          "x-use-grok": "true",
          "x-grok-api-key": settings.grokApiKey,
          "x-grok-model": settings.grokModel || "grok-2-1212",
        };
      }
    }
  } catch (e) {}
  return null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  const geminiHeaders = getGeminiHeaders();
  if (geminiHeaders) {
    Object.assign(headers, geminiHeaders);
  }
  
  const groqHeaders = getGroqHeaders();
  if (groqHeaders) {
    Object.assign(headers, groqHeaders);
  }

  const openRouterHeaders = getOpenRouterHeaders();
  if (openRouterHeaders) {
    Object.assign(headers, openRouterHeaders);
  }

  const openAIHeaders = getOpenAIHeaders();
  if (openAIHeaders) {
    Object.assign(headers, openAIHeaders);
  }

  const grokHeaders = getGrokHeaders();
  if (grokHeaders) {
    Object.assign(headers, grokHeaders);
  }

  const deepseekHeaders = getDeepSeekHeaders();
  if (deepseekHeaders) {
    Object.assign(headers, deepseekHeaders);
  }

  const anthropicHeaders = getAnthropicHeaders();
  if (anthropicHeaders) {
    Object.assign(headers, anthropicHeaders);
  }

  const res = await fetch(getApiUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    const geminiHeaders = getGeminiHeaders();
    if (geminiHeaders) {
      Object.assign(headers, geminiHeaders);
    }
    
    const groqHeaders = getGroqHeaders();
    if (groqHeaders) {
      Object.assign(headers, groqHeaders);
    }

    const openRouterHeaders = getOpenRouterHeaders();
    if (openRouterHeaders) {
      Object.assign(headers, openRouterHeaders);
    }

    const openAIHeaders = getOpenAIHeaders();
    if (openAIHeaders) {
      Object.assign(headers, openAIHeaders);
    }

    const grokHeaders = getGrokHeaders();
    if (grokHeaders) {
      Object.assign(headers, grokHeaders);
    }

    const deepseekHeaders = getDeepSeekHeaders();
    if (deepseekHeaders) {
      Object.assign(headers, deepseekHeaders);
    }

    const anthropicHeaders = getAnthropicHeaders();
    if (anthropicHeaders) {
      Object.assign(headers, anthropicHeaders);
    }

    const res = await fetch(getApiUrl(queryKey.join("/") as string), {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
