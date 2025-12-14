import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  FileText, Code, GraduationCap, Languages, Search, Mic, 
  Image, Video, Newspaper, ListTodo, Sparkles, Settings,
  Music, Volume2, Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogoFull } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolCard } from "@/components/tool-card";
import { indianQuotes } from "@shared/schema";
import { cn } from "@/lib/utils";

const tools = [
  { id: "document-master", title: "Document Master", description: "PDF reader, summarizer, translator, notes extraction", icon: FileText, gradient: "saffron" as const, path: "/tools/document" },
  { id: "code-lab", title: "Code AI Lab", description: "Code generation, debugging, optimization, explanation", icon: Code, gradient: "blue" as const, path: "/tools/code" },
  { id: "study-pro", title: "Study Pro Suite", description: "NCERT solutions, MCQ generator, math solver", icon: GraduationCap, gradient: "green" as const, path: "/tools/study" },
  { id: "language-converter", title: "Language Converter", description: "Hindi, English, Tamil, Telugu, Bengali translation", icon: Languages, gradient: "purple" as const, path: "/tools/language" },
  { id: "search-engine", title: "AI Search", description: "Smart search with AI summaries and knowledge panels", icon: Search, gradient: "saffron" as const, path: "/search" },
  { id: "voice-ops", title: "Voice Operations", description: "Voice search, commands, and notes", icon: Mic, gradient: "blue" as const, path: "/tools/voice" },
  { id: "image-vision", title: "Image Vision", description: "OCR, object detection, scene analysis", icon: Image, gradient: "green" as const, path: "/tools/image" },
  { id: "video-brain", title: "Video Brain", description: "Video summarization and key points", icon: Video, gradient: "purple" as const, path: "/tools/video" },
  { id: "swadesh-daily", title: "Swadesh Daily", description: "Daily quotes, facts, and news", icon: Newspaper, gradient: "saffron" as const, path: "/daily" },
  { id: "productivity", title: "Productivity", description: "To-do list, reminders, smart notes", icon: ListTodo, gradient: "blue" as const, path: "/productivity" },
  { id: "creative-tools", title: "Creative Tools", description: "Script, story, poem generator", icon: Sparkles, gradient: "green" as const, path: "/tools/creative" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [quote, setQuote] = useState(indianQuotes[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

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
            <span className="font-bold text-gradient-tricolor hidden sm:inline">SWADESH AI</span>
          </div>
          
          <div className="flex items-center gap-2">
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

          <div className="animate-fade-in">
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
