import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Loader2, Star, Moon, Sun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ToolActionFooter } from "@/components/tool-action-footer";

const topics = [
  { value: "panchang", label: "Daily Panchang", icon: Calendar, description: "Tithi, Nakshatra, Yoga" },
  { value: "kundli", label: "Kundli Basics", icon: Star, description: "Birth chart insights" },
  { value: "muhurat", label: "Shubh Muhurat", icon: Sun, description: "Auspicious timings" },
  { value: "rashifal", label: "Rashifal", icon: Moon, description: "Horoscope readings" },
];

export default function AstrologyTools() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("panchang");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  const astrologyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/astrology", {
        details: `${topic}: ${query}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
    },
  });

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      
      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SwadeshLogo size="sm" animated={false} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Vedic Astrologer</h1>
            <p className="text-muted-foreground">Panchang, Muhurat & Cosmic Insights</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Cosmic Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {topics.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTopic(t.value)}
                    className={cn(
                      "p-4 rounded-md text-left transition-all",
                      topic === t.value
                        ? "bg-indigo-500/20 ring-2 ring-indigo-500"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <t.icon className="w-5 h-5 mb-2 text-indigo-500" />
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Enter Details</label>
                <Textarea 
                  placeholder="e.g. Provide the Panchang for today, or explain the significance of Magha Nakshatra..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-24 resize-none bg-background/50 border-white/10"
                />
              </div>

              <Button 
                onClick={() => astrologyMutation.mutate()} 
                disabled={astrologyMutation.isPending || !query.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
              >
                {astrologyMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading Stars...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Consult</>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0 min-h-[400px] flex flex-col">
            <h2 className="font-semibold mb-4">Guidance</h2>
            <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-md p-4 relative overflow-hidden">
              {result ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {result}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm italic">
                  Your cosmic guidance will appear here...
                </div>
              )}
            </div>
            {result && <ToolActionFooter content={result} />}
          </Card>
        </div>
      </main>
    </div>
  );
}
