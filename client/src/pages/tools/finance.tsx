import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Loader2, PieChart, Briefcase, Calculator, TrendingUp } from "lucide-react";
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
  { value: "investment", label: "Mutual Funds & SIP", icon: TrendingUp, description: "Investment basics" },
  { value: "tax", label: "Tax & GST", icon: Calculator, description: "Income tax and GST concepts" },
  { value: "startup", label: "Startup Guidance", icon: Briefcase, description: "Indian business framework" },
  { value: "budget", label: "Budget Planning", icon: PieChart, description: "Personal finance" },
];

export default function FinanceTools() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("investment");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  const financeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/finance", {
        query: `${topic}: ${query}`,
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
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Desi Finance & Business</h1>
            <p className="text-muted-foreground">Tailored for the Indian market</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Financial Query</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {topics.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTopic(t.value)}
                    className={cn(
                      "p-4 rounded-md text-left transition-all",
                      topic === t.value
                        ? "bg-blue-500/20 ring-2 ring-blue-500"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <t.icon className="w-5 h-5 mb-2 text-blue-500" />
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Question</label>
                <Textarea 
                  placeholder="e.g. Explain how ELSS mutual funds help in tax saving under 80C..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-24 resize-none bg-background/50 border-white/10"
                />
              </div>

              <Button 
                onClick={() => financeMutation.mutate()} 
                disabled={financeMutation.isPending || !query.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              >
                {financeMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Get Advice</>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0 min-h-[400px] flex flex-col">
            <h2 className="font-semibold mb-4">Insights</h2>
            <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-md p-4 relative overflow-hidden">
              {result ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {result}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm italic">
                  Your financial guidance will appear here...
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
