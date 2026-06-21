import { useLocation } from "wouter";
import { useGuestMode } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogo } from "@/components/swadesh-logo";
import {
  MessageSquare, Mic, Brain, BookOpen, Languages, Code,
  Sparkles, Shield, ScanText, Wand2, ChefHat, Plane, Heart, FileText,
  ArrowRight, Zap, Star, Users
} from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Chat", description: "Intelligent conversations with cultural awareness" },
  { icon: Mic, title: "Voice Assistant", description: "Natural voice in Hindi, English & 10+ languages" },
  { icon: Brain, title: "Study Pro", description: "NCERT solutions, MCQ generator, math helper" },
  { icon: ScanText, title: "OCR Scanner", description: "Extract text from any image instantly" },
  { icon: Wand2, title: "Image Studio", description: "Generate stunning AI image descriptions" },
  { icon: ChefHat, title: "Recipe Chef", description: "Authentic Indian recipes with nutrition info" },
  { icon: Plane, title: "Travel Planner", description: "Complete itineraries for India & worldwide" },
  { icon: Heart, title: "Health AI", description: "Ayurveda, yoga poses & wellness guidance" },
  { icon: FileText, title: "Resume Builder", description: "ATS-optimized resume in seconds" },
  { icon: Languages, title: "Translator", description: "Hindi, Tamil, Telugu, Bengali & more" },
  { icon: Code, title: "Code Lab", description: "AI code generation, debugging & explanation" },
  { icon: Sparkles, title: "Creative Tools", description: "Stories, poems, scripts & essays" },
];

const stats = [
  { icon: Star, value: "23+", label: "AI Tools" },
  { icon: Zap, value: "Free", label: "No Credit Card" },
  { icon: Users, value: "Guest", label: "No Sign Up Needed" },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const { enableGuest } = useGuestMode();

  const handleGetStarted = () => {
    enableGuest();
    // navigate() is enough here because GuestContext state change forces a re-render
    navigate("/");
  };

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-x-hidden">
      <ParticleBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <SwadeshLogo size="md" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleSignIn} className="text-sm hidden sm:flex">
            Sign In
          </Button>
          <Button
            onClick={handleGetStarted}
            className="gap-2 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:opacity-90"
          >
            <Zap className="h-4 w-4" />
            Try Free
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-4xl w-full space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-500 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
            No sign up required — Start instantly
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-saffron-500 via-white to-india-green-500 bg-clip-text text-transparent">
            Your Intelligent<br />Indian AI Assistant
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Built in India 🇮🇳 for the world. 23 AI-powered tools — OCR, recipes, travel, health,
            resumes, code, language & more. <strong className="text-foreground">100% free, no account needed.</strong>
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-saffron-500/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-saffron-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:opacity-90 h-14 px-8 text-base font-semibold shadow-lg shadow-saffron-500/20"
              data-testid="button-get-started"
            >
              <Sparkles className="h-5 w-5" />
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSignIn}
              className="h-14 px-8 text-base gap-2 border-border/50 hover:border-saffron-500/50"
              data-testid="button-sign-in"
            >
              Sign In for Memory & Sync
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Guest mode: all AI tools available instantly. Sign in to save memories across devices.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-8 text-left">
            {features.map((f) => (
              <Card
                key={f.title}
                className="bg-background/60 backdrop-blur-sm border-border/30 hover:border-saffron-500/40 transition-colors cursor-pointer group"
                onClick={handleGetStarted}
              >
                <CardContent className="p-4 space-y-2">
                  <f.icon className="h-6 w-6 text-saffron-500 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-5 text-center text-sm text-muted-foreground border-t border-border/20">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Created by Zaid Asim · Swadesh AI v2.0 · Built in India 🇮🇳</span>
        </div>
      </footer>
    </div>
  );
}
