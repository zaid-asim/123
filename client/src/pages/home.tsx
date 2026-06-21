import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  FileText, Code, GraduationCap, Languages, Search, Mic,
  Image, Video, Newspaper, ListTodo, Sparkles, Settings,
  Music, Volume2, Clock, MapPin, User, Brain, CloudSun,
  Calculator, BookOpen, DollarSign, HelpCircle,
  ScanText, Wand2, PenLine, UtensilsCrossed, Plane, FileUser, Heart,
  Landmark, Star, Leaf, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogoFull } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolCard } from "@/components/tool-card";
import { indianQuotes } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useSettings, getEngineDetails } from "@/lib/settings-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Conversation } from "@shared/schema";
import { MessageSquare, Plus } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const tools = [
  // Core AI Tools
  { id: "document-master", title: "Document Master", description: "PDF reader, summarizer, translator, notes extraction", icon: FileText, gradient: "saffron" as const, path: "/tools/document" },
  { id: "code-lab", title: "Code AI Lab", description: "Code generation, debugging, optimization, explanation", icon: Code, gradient: "blue" as const, path: "/tools/code" },
  { id: "study-pro", title: "Study Pro Suite", description: "NCERT solutions, MCQ generator, math solver", icon: GraduationCap, gradient: "green" as const, path: "/tools/study" },
  { id: "language-converter", title: "Language Converter", description: "Hindi, English, Tamil, Telugu, Bengali translation", icon: Languages, gradient: "purple" as const, path: "/tools/language" },
  { id: "search-engine", title: "AI Search", description: "Smart search with AI summaries and knowledge panels", icon: Search, gradient: "saffron" as const, path: "/search" },
  { id: "voice-ops", title: "Voice Operations", description: "Voice search, commands, and notes", icon: Mic, gradient: "blue" as const, path: "/tools/voice" },
  // Vision Tools
  { id: "image-vision", title: "Image Vision", description: "AI image analysis: object detection, scene analysis", icon: Image, gradient: "green" as const, path: "/tools/image" },
  { id: "ocr", title: "OCR Scanner", description: "Extract text from images — printed, handwritten, Hindi", icon: ScanText, gradient: "purple" as const, path: "/tools/ocr" },
  { id: "image-gen", title: "AI Image Studio", description: "Generate images from text prompts with style options", icon: Wand2, gradient: "saffron" as const, path: "/tools/image-gen" },
  { id: "video-brain", title: "Video Brain", description: "Video summarization, key points, chapter breakdown", icon: Video, gradient: "blue" as const, path: "/tools/video" },
  // Writing & Language
  { id: "grammar", title: "Grammar & Writing AI", description: "Grammar check, improve, formal/casual writing", icon: PenLine, gradient: "green" as const, path: "/tools/grammar" },
  { id: "creative-tools", title: "Creative Tools", description: "Script, story, poem & essay generator", icon: Sparkles, gradient: "purple" as const, path: "/tools/creative" },
  // Knowledge & Learning
  { id: "culture", title: "Cultural Explorer", description: "Deep dive into India's rich heritage, history, and arts", icon: Landmark, gradient: "saffron" as const, path: "/tools/culture" },
  { id: "astrology", title: "Vedic Astrologer", description: "Panchang, Muhurat & Cosmic Insights", icon: Star, gradient: "purple" as const, path: "/tools/astrology" },
  { id: "dictionary", title: "AI Dictionary", description: "Word definitions, etymology, Hindi translation", icon: BookOpen, gradient: "saffron" as const, path: "/tools/dictionary" },
  { id: "quiz", title: "Quiz Master", description: "AI-generated quizzes on Indian history, science & more", icon: HelpCircle, gradient: "blue" as const, path: "/tools/quiz" },
  // Lifestyle
  { id: "recipe", title: "AI Recipe Chef", description: "Detailed Indian recipes with ingredients & nutrition", icon: UtensilsCrossed, gradient: "green" as const, path: "/tools/recipe" },
  { id: "ayurveda", title: "Yoga & Ayurveda", description: "Holistic health, Dosha analysis, and ancient wisdom", icon: Leaf, gradient: "green" as const, path: "/tools/ayurveda" },
  { id: "health", title: "Health & Wellness AI", description: "Symptom checker & medical guidance", icon: Heart, gradient: "purple" as const, path: "/tools/health" },
  { id: "travel", title: "AI Travel Planner", description: "Complete itineraries for India & worldwide", icon: Plane, gradient: "saffron" as const, path: "/tools/travel" },
  { id: "weather", title: "Weather AI", description: "AI-powered climate insights for Indian cities", icon: CloudSun, gradient: "blue" as const, path: "/tools/weather" },
  // Utilities
  { id: "finance", title: "Desi Finance", description: "Mutual funds, GST, and Indian startup guidance", icon: TrendingUp, gradient: "blue" as const, path: "/tools/finance" },
  { id: "calculator", title: "AI Calculator", description: "Smart calculator with AI step-by-step explanations", icon: Calculator, gradient: "green" as const, path: "/tools/calculator" },
  { id: "currency", title: "Currency Converter", description: "Convert 12 currencies with AI exchange rates", icon: DollarSign, gradient: "purple" as const, path: "/tools/currency" },
  { id: "resume", title: "Resume Builder", description: "ATS-optimized resume generated with AI in seconds", icon: FileUser, gradient: "saffron" as const, path: "/tools/resume" },
  // Daily & Productivity
  { id: "swadesh-daily", title: "Swadesh Daily", description: "Daily quotes, facts, and news", icon: Newspaper, gradient: "blue" as const, path: "/daily" },
  { id: "productivity", title: "Productivity Suite", description: "To-do list, reminders, smart notes — all persisted", icon: ListTodo, gradient: "green" as const, path: "/productivity" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const engine = getEngineDetails(settings);
  const [quote, setQuote] = useState(indianQuotes[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: conversationsData } = useQuery<Conversation[] | null>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });
  const conversations = conversationsData ?? [];

  useEffect(() => {
    const randomQuote = indianQuotes[Math.floor(Math.random() * indianQuotes.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <ParticleBackground />

      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full tricolor-gradient-animated" />
            <span className="font-bold text-gradient-tricolor-animated hidden sm:inline">SWADESH AI</span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm transition-all cursor-pointer hover:bg-muted/40",
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
                  <span>{engine.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] p-3 text-xs glassmorphism border-border/60">
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", engine.colorClass)} />
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/memory")}
              title="Memory Manager"
              data-testid="button-memory"
            >
              <Brain className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/music")}
              data-testid="button-music"
            >
              <Music className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/account")}
              title="My Account"
              data-testid="button-account"
            >
              <User className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-20 pb-12">
        <section className="container mx-auto px-4 py-12 flex flex-col items-center">
          <Card className="w-full max-w-md p-4 mb-8 glassmorphism border-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-saffron-500" />
              <div>
                <p className="text-sm text-muted-foreground">{getGreeting()}</p>
                <p className="font-medium">
                  {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-india-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">India</p>
                <p className="font-medium">
                  {currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions & Recent */}
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 glassmorphism border-0">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-saffron-500" /> Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={() => navigate("/chat")}>
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">Chat AI</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={() => navigate("/tools/document")}>
                  <FileText className="w-5 h-5 text-saffron-500" />
                  <span className="text-xs">Read PDF</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={() => navigate("/tools/image")}>
                  <Image className="w-5 h-5 text-india-green-500" />
                  <span className="text-xs">Vision AI</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={() => navigate("/tools/language")}>
                  <Languages className="w-5 h-5 text-purple-500" />
                  <span className="text-xs">Translate</span>
                </Button>
              </div>
            </Card>

            <Card className="p-6 glassmorphism border-0 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-india-blue-500" /> Recent Chats
                </h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => navigate("/chat")}>
                  <Plus className="w-3.5 h-3.5" /> New
                </Button>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-48 pr-2">
                {isAuthenticated ? (
                  conversations.length > 0 ? (
                    conversations.slice(0, 3).map((conv) => (
                      <Button key={conv.id} variant="ghost" className="w-full justify-start text-left bg-muted/30 hover:bg-muted" onClick={() => navigate("/chat")}>
                        <MessageSquare className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
                        <span className="truncate">{conv.title}</span>
                      </Button>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">No recent conversations.</p>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm">Sign in to view history.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="text-center mb-12">
            <SwadeshLogoFull />
          </div>

          <Card className="mt-8 p-6 max-w-2xl w-full glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <blockquote className="text-center">
              <p className="text-lg italic text-foreground/90">"{quote.quote}"</p>
              <footer className="mt-2 text-sm text-muted-foreground">— {quote.author}</footer>
            </blockquote>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button
              onClick={() => navigate("/chat")}
              className="bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white gap-2"
              data-testid="button-start-chat"
            >
              <Sparkles className="w-4 h-4" />
              Start AI Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/tools/voice")}
              className="gap-2"
              data-testid="button-voice-assistant"
            >
              <Volume2 className="w-4 h-4" />
              Voice Assistant
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-gradient-tricolor">
            AI-Powered Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tools.map((tool, index) => (
              <div
                key={tool.id}
                className="animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <ToolCard
                  title={tool.title}
                  description={tool.description}
                  icon={tool.icon}
                  gradient={tool.gradient}
                  onClick={() => navigate(tool.path)}
                  testId={`card-tool-${tool.id}`}
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="container mx-auto px-4 py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-saffron-500 rounded" />
              <div className="w-6 h-1 bg-white dark:bg-gray-300 rounded" />
              <div className="w-6 h-1 bg-india-green-500 rounded" />
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Swadesh AI
            </p>
            <p className="text-xs text-muted-foreground/70">
              Created by Zaid Asim • Built in India
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
