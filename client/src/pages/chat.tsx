import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Send, Volume2, VolumeX, Mic, MicOff, Loader2,
  Sparkles, User, Trash2, Copy, CheckCheck, Menu, MessageSquare, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useTTS } from "@/lib/tts-context";
import { useSettings } from "@/lib/settings-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage, Conversation } from "@shared/schema";
import { cn } from "@/lib/utils";

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

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { 
        message, 
        personality: settings.personality, 
        mustReadMemory: settings.mustReadMemory,
        settings
      });
      return res.json();
    },
    onSuccess: (data, message) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages(prev => {
        const next = [...prev, assistantMessage];
        // Persist to DB if authenticated
        if (isAuthenticated) {
          if (currentConversationId) {
            updateConvMutation.mutate({ id: currentConversationId, msgs: next });
          } else if (!createConvMutation.isPending) {
            const title = next[0]?.content.slice(0, 40) + "..." || "New Conversation";
            apiRequest("POST", "/api/conversations", { title, messages: next })
              .then(r => r.json())
              .then(conv => setCurrentConversationId(conv.id))
              .catch(() => {});
          }
        }
        return next;
      });
    },
    onError: () => toast({ title: "Failed to get response. Please try again.", variant: "destructive" }),
  });

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
    chatMutation.mutate(messageText);
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
                    <SheetTitle>Conversations</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <Button onClick={handleClearChat} className="w-full justify-start gap-2 mb-4 bg-gradient-to-r from-saffron-500 to-india-green-500 text-white">
                      <Plus className="h-4 w-4" /> New Chat
                    </Button>
                    <ScrollArea className="h-[calc(100vh-140px)]">
                      <div className="space-y-2">
                        {conversations.map((conv) => (
                          <div key={conv.id} className="flex group items-center gap-2">
                            <Button 
                              variant={currentConversationId === conv.id ? "secondary" : "ghost"} 
                              className="flex-1 justify-start overflow-hidden" 
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
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SwadeshLogo size="sm" animated={false} />
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
                {suggestions.map(s => (
                  <Button key={s} variant="outline" size="sm" onClick={() => handleSend(s)} className="text-xs" data-testid={`button-suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}>
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
                    : "glassmorphism border-0"
                  )}>
                    {(() => {
                      if (message.content.includes("<think>")) {
                        const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
                        const thinking = thinkMatch ? thinkMatch[1].trim() : "";
                        const remaining = message.content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
                        return (
                          <div className="flex flex-col gap-2">
                            {thinking && (
                              <div className="text-xs bg-black/10 dark:bg-white/5 p-3 rounded-md border border-border/50 text-muted-foreground italic relative mt-2">
                                <div className="absolute -top-2 left-2 bg-background/80 backdrop-blur-md px-2 text-[10px] uppercase font-bold tracking-widest rounded-full">Reasoning</div>
                                {thinking}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm pt-2">{remaining}</div>
                          </div>
                        );
                      }
                      return <div className="whitespace-pre-wrap text-sm">{message.content}</div>;
                    })()}
                    {settings.showTimestamps && (
                      <div className={cn("text-[10px] mt-1 opacity-50", message.role === "user" ? "text-right" : "text-left")}>
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
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
              {chatMutation.isPending && (
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
              <Button onClick={() => handleSend()} disabled={!input.trim() || chatMutation.isPending}
                className="h-12 w-12 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600 border-0"
                data-testid="button-send">
                {chatMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
