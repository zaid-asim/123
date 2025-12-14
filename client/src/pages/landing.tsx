import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { MessageSquare, Mic, Brain, BookOpen, Languages, Code, Sparkles, Shield } from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Chat", description: "Intelligent conversations with cultural awareness" },
  { icon: Mic, title: "Voice Assistant", description: "Natural voice interactions in multiple languages" },
  { icon: Brain, title: "Memory System", description: "Personalized responses that remember you" },
  { icon: BookOpen, title: "Study Pro", description: "NCERT-aligned educational assistance" },
  { icon: Languages, title: "Multi-lingual", description: "Support for Hindi, Tamil, Telugu, Bengali" },
  { icon: Code, title: "Code Lab", description: "Programming help and code generation" },
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <ParticleBackground />
      
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <SwadeshLogo size="md" />
        <Button
          onClick={handleLogin}
          className="gap-2 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
          data-testid="button-login-header"
        >
          Sign In
        </Button>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-saffron-500 via-white to-india-green-500 bg-clip-text text-transparent animate-fade-in">
            Your Intelligent Indian AI Assistant
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground animate-slide-up">
            Built in India, for the world. Experience culturally-aware AI with voice capabilities,
            memory, and powerful tools for education, productivity, and creativity.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button
              size="lg"
              onClick={handleLogin}
              className="gap-2 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700"
              data-testid="button-get-started"
            >
              <Sparkles className="h-5 w-5" />
              Get Started
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-16 max-w-4xl animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {features.map((feature) => (
            <Card key={feature.title} className="bg-background/60 backdrop-blur-sm border-muted-foreground/20">
              <CardContent className="p-4 text-center space-y-2">
                <feature.icon className="h-8 w-8 mx-auto text-saffron-500" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Created by Zaid Asim | Powered by Swadesh AI</span>
        </div>
      </footer>
    </div>
  );
}
