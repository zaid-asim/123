import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { toast } from "@/hooks/use-toast";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMsg = `${res.status}: ${text}`;
    toast({
      title: "API Error",
      description: text || "An unexpected error occurred.",
      variant: "destructive",
    });
    throw new Error(errorMsg);
  }
}

function getCustomApiKeyHeader() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("swadesh-ai-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.useCustomApiKey && settings.customApiKey) {
        return settings.customApiKey;
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
          "x-groq-model": settings.groqModel || "llama3-8b-8192",
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
  const customKey = getCustomApiKeyHeader();
  if (customKey) headers["x-gemini-api-key"] = customKey;
  
  const groqHeaders = getGroqHeaders();
  if (groqHeaders) {
    Object.assign(headers, groqHeaders);
  }

  const res = await fetch(url, {
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
    const customKey = getCustomApiKeyHeader();
    if (customKey) headers["x-gemini-api-key"] = customKey;
    
    const groqHeaders = getGroqHeaders();
    if (groqHeaders) {
      Object.assign(headers, groqHeaders);
    }

    const res = await fetch(queryKey.join("/") as string, {
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
