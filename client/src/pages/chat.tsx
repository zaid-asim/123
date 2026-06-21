import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Send, Volume2, VolumeX, Mic, MicOff, Loader2,
  Sparkles, User, Trash2, Copy, CheckCheck, Menu, MessageSquare, Plus, AlertCircle,
  Upload, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useTTS } from "@/lib/tts-context";
import { useSettings, getEngineDetails } from "@/lib/settings-context";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { apiRequest, getApiUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage, Conversation } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { SourcesStrip } from "@/components/sources-strip";
import { ReasoningTrace } from "@/components/reasoning-trace";

const CHAT_HISTORY_KEY = "swadesh-chat-history";

function loadHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export default function Chat() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const initialQuery = new URLSearchParams(searchString).get("q") || "";
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { speak, stop, isSpeaking } = useTTS();
  const { settings } = useSettings();
  const engine = getEngineDetails(settings);
  const [updatedBlocks, setUpdatedBlocks] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sourcesData, refetch: refetchSources } = useQuery<any[]>({
    queryKey: ["/api/sources"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/sources?workspaceId=default"));
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json();
    },
    enabled: isAuthenticated,
  });
  const uploadedSources = sourcesData || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validTypes = ["txt", "md", "csv", "json", "pdf", "docx"];
    if (!ext || !validTypes.includes(ext)) {
      toast({ title: `Unsupported file type. Use: ${validTypes.join(", ")}`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const headers: Record<string, string> = {
        "Content-Type": "application/octet-stream"
      };
      if (settings.geminiModel) {
        headers["x-gemini-model"] = settings.geminiModel;
      }
      if (settings.useCustomApiKey && settings.customApiKey) {
        headers["x-gemini-api-key"] = settings.customApiKey;
      }
      if (settings.useGroq && settings.groqApiKey) {
        headers["x-use-groq"] = "true";
        headers["x-groq-api-key"] = settings.groqApiKey;
        headers["x-groq-model"] = settings.groqModel || "llama-4-scout-17b-16e-instruct";
      }
      if (settings.useOpenRouter && settings.openRouterApiKey) {
        headers["x-use-openrouter"] = "true";
        headers["x-openrouter-api-key"] = settings.openRouterApiKey;
        headers["x-openrouter-model"] = settings.openRouterModel || "google/gemini-2.5-flash";
      }
      if (settings.useOpenAI && settings.openAiApiKey) {
        headers["x-use-openai"] = "true";
        headers["x-openai-api-key"] = settings.openAiApiKey;
        headers["x-openai-model"] = settings.openAiModel || "gpt-5.5";
      }
      if (settings.useGrok && settings.grokApiKey) {
        headers["x-use-grok"] = "true";
        headers["x-grok-api-key"] = settings.grokApiKey;
        headers["x-grok-model"] = settings.grokModel || "grok-4.3";
      }
      if (settings.useDeepSeek && settings.deepseekApiKey) {
        headers["x-use-deepseek"] = "true";
        headers["x-deepseek-api-key"] = settings.deepseekApiKey;
        headers["x-deepseek-model"] = settings.deepseekModel || "deepseek-chat";
      }
      if (settings.useAnthropic && settings.anthropicApiKey) {
        headers["x-use-anthropic"] = "true";
        headers["x-anthropic-api-key"] = settings.anthropicApiKey;
        headers["x-anthropic-model"] = settings.anthropicModel || "claude-3-5-sonnet-latest";
      }
      
      const res = await fetch(`/api/sources/upload?name=${encodeURIComponent(file.name)}&type=${ext}`, {
        method: "POST",
        headers,
        body: arrayBuffer
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload file");
      }

      toast({ title: "Document uploaded successfully!", description: `${file.name} chunked and indexed.` });
      refetchSources();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete source");
      toast({ title: "Source deleted" });
      refetchSources();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const { data: conversationsData } = useQuery<Conversation[] | null>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });
  const conversations = conversationsData ?? [];

  const createConvMutation = useMutation({
    mutationFn: async (msgs: ChatMessage[]) => {
      const title = msgs[0]?.content.slice(0, 30) + "..." || "New Conversation";
      const res = await apiRequest("POST", "/api/conversations", { title, messages: msgs });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  });

  const updateConvMutation = useMutation({
    mutationFn: async ({ id, msgs }: { id: string, msgs: ChatMessage[] }) => {
      const res = await apiRequest("PATCH", `/api/conversations/${id}`, { messages: msgs });
      return res.json();
    }
  });

  const deleteConvMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (currentConversationId === id) {
        setMessages([]);
        setCurrentConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    }
  });

  // Auto-scroll
  useEffect(() => {
    if (settings.autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, settings.autoScroll]);

  // Persist history — only triggered on message changes
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-100)));
    // DB persistence is handled via onSuccess callbacks of chat mutation
  }, [messages]);

  // Auto-send initial query
  const hasSentInitial = useRef(false);
  useEffect(() => {
    if (initialQuery && messages.length === 0 && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSend(initialQuery);
      setInput("");
    }
  }, []);

  const [isPending, setIsPending] = useState(false);

  const streamChat = async (messageText: string) => {
    setIsPending(true);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (settings.geminiModel) {
      headers["x-gemini-model"] = settings.geminiModel;
    }
    if (settings.useCustomApiKey && settings.customApiKey) {
      headers["x-gemini-api-key"] = settings.customApiKey;
    }
    if (settings.useGroq && settings.groqApiKey) {
      headers["x-use-groq"] = "true";
      headers["x-groq-api-key"] = settings.groqApiKey;
      headers["x-groq-model"] = settings.groqModel || "llama-4-scout-17b-16e-instruct";
    }
    if (settings.useOpenRouter && settings.openRouterApiKey) {
      headers["x-use-openrouter"] = "true";
      headers["x-openrouter-api-key"] = settings.openRouterApiKey;
      headers["x-openrouter-model"] = settings.openRouterModel || "google/gemini-2.5-flash";
    }
    if (settings.useOpenAI && settings.openAiApiKey) {
      headers["x-use-openai"] = "true";
      headers["x-openai-api-key"] = settings.openAiApiKey;
      headers["x-openai-model"] = settings.openAiModel || "gpt-5.5";
    }
    if (settings.useGrok && settings.grokApiKey) {
      headers["x-use-grok"] = "true";
      headers["x-grok-api-key"] = settings.grokApiKey;
      headers["x-grok-model"] = settings.grokModel || "grok-4.3";
    }
    if (settings.useDeepSeek && settings.deepseekApiKey) {
      headers["x-use-deepseek"] = "true";
      headers["x-deepseek-api-key"] = settings.deepseekApiKey;
      headers["x-deepseek-model"] = settings.deepseekModel || "deepseek-chat";
    }
    if (settings.useAnthropic && settings.anthropicApiKey) {
      headers["x-use-anthropic"] = "true";
      headers["x-anthropic-api-key"] = settings.anthropicApiKey;
      headers["x-anthropic-model"] = settings.anthropicModel || "claude-3-5-sonnet-latest";
    }

    const assistantMsgId = Date.now().toString() + "-assistant";
    try {
      const res = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: messageText,
          personality: settings.personality,
          mustReadMemory: settings.mustReadMemory,
          settings
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      // Add initial empty assistant message with status
      setMessages(prev => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          status: "Routing query..."
        }
      ]);
      
      setIsPending(false);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.substring(5).trim();
            if (!dataStr) continue;
            try {
              const parsedData = JSON.parse(dataStr);
              
              setMessages(prev => {
                return prev.map(msg => {
                  if (msg.id === assistantMsgId) {
                    const newMsg = { ...msg };
                    if (currentEvent === "status") {
                      newMsg.status = parsedData;
                    } else if (currentEvent === "text") {
                      newMsg.content += parsedData;
                      newMsg.status = undefined;
                    } else if (currentEvent === "sources") {
                      newMsg.sources = parsedData;
                    } else if (currentEvent === "verification") {
                      newMsg.claims = parsedData.claims;
                      newMsg.status = undefined;
                    } else if (currentEvent === "critic") {
                      newMsg.criticNotes = parsedData;
                      newMsg.status = undefined;
                    } else if (currentEvent === "metacognition") {
                      newMsg.metacognition = parsedData;
                      newMsg.status = undefined;
                    } else if (currentEvent === "confidence") {
                      newMsg.confidence = parsedData;
                    } else if (currentEvent === "timing") {
                      newMsg.timing = parsedData;
                    } else if (currentEvent === "revised") {
                      newMsg.content = parsedData;
                      newMsg.isRevised = true;
                    } else if (currentEvent === "patch") {
                      const patch = parsedData;
                      const paragraphs = newMsg.content.split("\n\n");
                      let matchedIdx = -1;
                      if (patch.blockId) {
                        matchedIdx = paragraphs.findIndex(p => {
                          const cleanP = p.trim().replace(/\r/g, "");
                          let hash = 5381;
                          for (let i = 0; i < cleanP.length; i++) {
                            hash = (hash * 33) ^ cleanP.charCodeAt(i);
                          }
                          const hexHash = (hash >>> 0).toString(16);
                          return hexHash === patch.blockId;
                        });
                      }
                      const targetIdx = matchedIdx !== -1 ? matchedIdx : patch.index;
                      if (targetIdx >= 0) {
                        paragraphs[targetIdx] = patch.revisedText;
                        newMsg.content = paragraphs.filter(p => p !== "").join("\n\n");
                        newMsg.isRevised = true;
                        
                        const cleanRev = patch.revisedText.trim().replace(/\r/g, "");
                        let revHash = 5381;
                        for (let i = 0; i < cleanRev.length; i++) {
                          revHash = (revHash * 33) ^ cleanRev.charCodeAt(i);
                        }
                        const hexRevHash = (revHash >>> 0).toString(16);
                        
                        setUpdatedBlocks(prev => ({ ...prev, [hexRevHash]: true }));
                        setTimeout(() => {
                          setUpdatedBlocks(prev => {
                            const next = { ...prev };
                            delete next[hexRevHash];
                            return next;
                          });
                        }, 2000);
                      }
                    } else if (currentEvent === "error") {
                      newMsg.content = parsedData.error || "Failed to generate response";
                      newMsg.isError = true;
                      newMsg.errorDetails = parsedData.details;
                      newMsg.status = undefined;
                    } else if (currentEvent === "done") {
                      newMsg.content = parsedData.response;
                      newMsg.confidence = parsedData.confidence;
                      newMsg.sources = parsedData.sources;
                      newMsg.claims = parsedData.claims;
                      newMsg.criticNotes = parsedData.criticNotes;
                      newMsg.timing = parsedData.timing;
                      newMsg.metacognition = parsedData.metacognition;
                      newMsg.status = undefined;
                    }
                    return newMsg;
                  }
                  return msg;
                });
              });
            } catch (err) {
              console.error("Error parsing event data:", err, dataStr);
            }
          }
        }
      }

      // After streaming is fully done, persist the updated conversation history
      setMessages(prev => {
        const finalMessages = [...prev];
        const finalMsg = finalMessages.find(m => m.id === assistantMsgId);
        if (finalMsg && isAuthenticated) {
          if (currentConversationId) {
            updateConvMutation.mutate({ id: currentConversationId, msgs: finalMessages });
          } else if (!createConvMutation.isPending) {
            const title = finalMessages[0]?.content.slice(0, 40) + "..." || "New Conversation";
            apiRequest("POST", "/api/conversations", { title, messages: finalMessages })
              .then(r => r.json())
              .then(conv => setCurrentConversationId(conv.id))
              .catch(() => {});
          }
        }
        return finalMessages;
      });

    } catch (err: any) {
      setIsPending(false);
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast({ title: "Failed to get response. Please try again.", variant: "destructive" });
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Failed to get response. Please try again.",
        timestamp: Date.now(),
        isError: true,
        errorDetails: errorMsg,
      };
      setMessages(prev => {
        const next = [...prev, errorMessage];
        if (isAuthenticated && currentConversationId) {
          updateConvMutation.mutate({ id: currentConversationId, msgs: next });
        }
        return next;
      });
    }
  };

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    streamChat(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && settings.enterToSend) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    if (!isAuthenticated) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
    toast({ title: "Started new conversation" });
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages as ChatMessage[]);
    setCurrentConversationId(conv.id);
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Voice input not supported in this browser", variant: "destructive" });
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = settings.language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.start();
  };

  const handleSpeak = (text: string) => { isSpeaking ? stop() : speak(text); };

  const [suggestions, setSuggestions] = useState([
    "Explain the concept of Dharma",
    "Write a Hindi poem about monsoon",
    "What is the significance of Diwali?",
    "Translate 'How are you' to Tamil"
  ]);

  useEffect(() => {
    if (input.toLowerCase().includes("code") || input.toLowerCase().includes("bug")) {
      setSuggestions(["Debug my React code", "Explain this Python script", "Write a Java function", "Optimize this algorithm"]);
    } else if (input.toLowerCase().includes("translate") || input.toLowerCase().includes("hindi") || input.toLowerCase().includes("tamil")) {
      setSuggestions(["Translate this paragraph to Marathi", "How to say 'Thank you' in Bengali", "Explain Tamil grammar", "Write a letter in Hindi"]);
    } else if (input.toLowerCase().includes("history") || input.toLowerCase().includes("india")) {
      setSuggestions(["Tell me about the Maurya Empire", "Who was Chhatrapati Shivaji Maharaj?", "Explain the Independence movement", "History of the Chola Dynasty"]);
    } else {
      setSuggestions([
        "Explain the concept of Dharma",
        "Write a Hindi poem about monsoon",
        "What is the significance of Diwali?",
        "Translate 'How are you' to Tamil"
      ]);
    }
  }, [input]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <ParticleBackground />

      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Workspace Control</SheetTitle>
                  </SheetHeader>
                  <Tabs defaultValue="chats" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chats">Chats</TabsTrigger>
                      <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="chats" className="mt-4">
                      <Button onClick={handleClearChat} className="w-full justify-start gap-2 mb-4 bg-gradient-to-r from-saffron-500 to-india-green-500 text-white">
                        <Plus className="h-4 w-4" /> New Chat
                      </Button>
                      <ScrollArea className="h-[calc(100vh-220px)]">
                        <div className="space-y-2">
                          {conversations.map((conv) => (
                            <div key={conv.id} className="flex group items-center gap-2">
                              <Button 
                                variant={currentConversationId === conv.id ? "secondary" : "ghost"} 
                                className="flex-1 justify-start overflow-hidden text-left" 
                                onClick={() => loadConversation(conv)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate">{conv.title}</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 shrink-0 text-destructive"
                                onClick={(e) => { e.stopPropagation(); deleteConvMutation.mutate(conv.id); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {conversations.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No past conversations.</p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="sources" className="mt-4 space-y-4">
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".txt,.md,.csv,.json,.pdf,.docx"
                        />
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={uploading}
                          className="w-full justify-center gap-2 bg-gradient-to-r from-saffron-500 to-india-green-500 text-white"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Indexing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" /> Ingest Document
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                          Supports TXT, MD, CSV, JSON, PDF, DOCX (Max 50MB)
                        </p>
                      </div>
                      
                      <ScrollArea className="h-[calc(100vh-260px)]">
                        <div className="space-y-2.5">
                          {uploadedSources.map((source) => (
                            <div key={source.id} className="p-3 rounded-lg border border-border bg-card/40 flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate text-foreground">{source.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <span className="uppercase font-bold text-saffron-500">{source.type}</span>
                                  <span>•</span>
                                  <span className="text-green-500 font-bold">Trust: {source.trustScore}%</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => handleDeleteSource(source.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          {uploadedSources.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto opacity-30 mb-2" />
                              <p className="text-sm">No documents ingested.</p>
                              <p className="text-[11px] mt-1">Ingest files to enable private context RAG.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SwadeshLogo size="sm" animated={false} />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm transition-all cursor-pointer hover:bg-muted/40",
                  engine.bgClass
                )}
                onClick={() => navigate("/settings")}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      engine.colorClass
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      engine.colorClass
                    )}></span>
                  </span>
                  <span>
                    {engine.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] p-3 text-xs glassmorphism border-border/60">
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      engine.colorClass
                    )} />
                    {engine.provider} Engine Active
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {engine.desc}
                  </p>
                  <div className="text-[10px] text-primary/70 font-semibold pt-1">
                    Click to manage engines in settings
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="gap-1 h-8 text-xs text-muted-foreground hover:text-destructive" data-testid="button-clear-chat">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 pt-20 pb-32" ref={scrollRef}>
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full tricolor-gradient-animated mb-6 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Swadesh AI</h2>
              <p className="text-muted-foreground max-w-md">
                Your intelligent Indian AI assistant. Ask me anything — from general knowledge to code help, study materials, translations, and more!
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {suggestions.map((s, idx) => (
                  <Button 
                    key={s} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSend(s)} 
                    className={cn(
                      "text-xs bg-card/40 hover:bg-card/75 border-border/50 transition-all duration-300 rounded-full",
                      idx % 3 === 0 ? "hover:border-saffron-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] text-saffron-600 dark:text-saffron-400" :
                      idx % 3 === 1 ? "hover:border-india-green-500/50 hover:shadow-[0_0_12px_rgba(34,197,94,0.15)] text-green-600 dark:text-green-400" :
                      "hover:border-india-blue-500/50 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)] text-blue-600 dark:text-blue-400"
                    )}
                    data-testid={`button-suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3 animate-slide-up", message.role === "user" ? "justify-end" : "justify-start")}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full tricolor-gradient flex-shrink-0 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <Card className={cn("max-w-[80%] p-4", message.role === "user"
                    ? "bg-gradient-to-br from-saffron-500 to-saffron-600 text-white border-0"
                    : message.isError
                      ? "border border-rose-500/30 bg-rose-500/5 text-rose-200"
                      : "glassmorphism border-0"
                  )}>
                    {message.role === "assistant" && message.status && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-black/5 dark:bg-white/5 p-2 rounded border border-border/30 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-saffron-500" />
                        <span>{message.status}</span>
                      </div>
                    )}
                    {(() => {
                      const renderParagraphs = (text: string) => {
                        const paras = text.split("\n\n");
                        return paras.map((para, idx) => {
                          const cleanP = para.trim().replace(/\r/g, "");
                          let hash = 5381;
                          for (let i = 0; i < cleanP.length; i++) {
                            hash = (hash * 33) ^ cleanP.charCodeAt(i);
                          }
                          const blockId = (hash >>> 0).toString(16);
                          const isUpdated = updatedBlocks[blockId];
                          
                          return (
                            <p 
                              key={idx} 
                              className={cn(
                                "mb-3 last:mb-0 transition-all duration-700 rounded p-1.5 whitespace-pre-wrap",
                                isUpdated 
                                  ? "border border-saffron-500/40 bg-saffron-500/5 shadow-md shadow-saffron-500/5 scale-[1.01]" 
                                  : "border border-transparent"
                              )}
                            >
                              {para}
                            </p>
                          );
                        });
                      };

                      if (message.content.match(/<think>[\s\S]*?(?:<\/think>|$)/i)) {
                        const thinkMatch = message.content.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
                        const thinking = thinkMatch ? thinkMatch[1].trim() : "";
                        const remaining = message.content.replace(/<think>[\s\S]*?(?:<\/think>|$)/ig, "").trim();
                        return (
                          <div className="flex flex-col gap-2">
                            {thinking && (
                              <details className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-md border border-border/50 text-muted-foreground relative mt-2 group">
                                <summary className="cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 select-none hover:text-foreground transition-colors outline-none list-none">
                                  <span className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Show Thinking Process
                                  </span>
                                </summary>
                                <div className="mt-3 pt-3 border-t border-border/20 whitespace-pre-wrap text-[11px] italic">
                                  {thinking}
                                </div>
                              </details>
                            )}
                            <div className="text-sm pt-2">{renderParagraphs(remaining)}</div>
                          </div>
                        );
                      }
                      return <div className="text-sm">{renderParagraphs(message.content)}</div>;
                    })()}
                    {message.isError && message.errorDetails && (
                      <details className="text-xs bg-rose-950/10 p-3 rounded-md border border-rose-500/20 text-rose-300 relative mt-2 group">
                        <summary className="cursor-pointer text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 select-none hover:text-rose-200 transition-colors outline-none list-none">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Show Error Details
                          </span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-rose-500/10 whitespace-pre-wrap text-[11px] font-mono leading-relaxed break-all">
                          {message.errorDetails}
                        </div>
                      </details>
                    )}
                    {message.role === "assistant" && (
                      <div className="mt-3.5 space-y-3.5 pt-1">
                        {settings.showConfidence && message.confidence && (
                          <ConfidenceBadge confidence={message.confidence} />
                        )}
                        {settings.showSources && message.sources && message.sources.length > 0 && (
                          <SourcesStrip sources={message.sources} />
                        )}
                        {settings.showReasoningTrace && message.timing && (
                          <ReasoningTrace 
                            timing={message.timing} 
                            criticNotes={message.criticNotes || { issues: [], assessment: 'pass' }}
                            metacognition={message.metacognition || { knownUnknowns: [], potentialBiases: [], confidenceCalibration: '', suggestedFollowUp: [] }}
                          />
                        )}
                      </div>
                    )}
                    {settings.showTimestamps && (
                      <div className={cn("text-[10px] mt-1 opacity-50", message.role === "user" ? "text-right" : "text-left")}>
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                        {message.isRevised && (
                          <span className="text-[10px] font-bold text-saffron-500 mr-auto flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Fact-checked & Revised
                          </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleSpeak(message.content)} className="h-7 text-xs gap-1" data-testid={`button-speak-${message.id}`}>
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {isSpeaking ? "Stop" : "Listen"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyMessage(message.content, message.id)} className="h-7 text-xs gap-1" data-testid={`button-copy-${message.id}`}>
                          {copiedId === message.id ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {copiedId === message.id ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    )}
                  </Card>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex gap-3 animate-slide-up">
                  <div className="w-8 h-8 rounded-full tricolor-gradient flex-shrink-0 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 glassmorphism border-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Swadesh AI is thinking...
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 glassmorphism p-4">
        <div className="container mx-auto max-w-3xl">
          <div className="relative flex gap-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-saffron-500/30 via-transparent to-india-green-500/30 rounded-lg blur-sm" />
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="relative flex-1 min-h-[48px] max-h-32 resize-none bg-background/80 border-0"
              data-testid="input-chat"
            />
            <div className="relative flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleVoiceInput}
                className={cn("h-12 w-12", isListening && "bg-destructive/20 border-destructive text-destructive")}
                data-testid="button-voice-input">
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button onClick={() => handleSend()} disabled={!input.trim() || isPending}
                className="h-12 w-12 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600 border-0"
                data-testid="button-send">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">Powered by Swadesh AI • Created by Zaid Asim</p>
            <p className="text-xs text-muted-foreground">{input.length} chars</p>
          </div>
        </div>
      </div>
    </div>
  );
}
