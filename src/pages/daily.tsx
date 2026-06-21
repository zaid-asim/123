import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Quote, Lightbulb, Newspaper, RefreshCw, Loader2, CalendarDays, Sunrise, Sunset, Star, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { indianQuotes } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DailyData = {
  fact: string;
  news: string[];
  panchang: {
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
  };
};

export default function SwadeshDaily() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quote, setQuote] = useState(indianQuotes[0]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);

  const generateDailyMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate a daily brief for India. Provide a highly interesting, lesser-known historical fact about India. Provide 3 positive, recent or plausible news headlines about India. Provide the Hindu Panchang for today (Tithi, Nakshatra, Sunrise, Sunset). 
      You MUST respond ONLY with a raw JSON object matching exactly this structure: 
      {
        "fact": "string",
        "news": ["string", "string", "string"],
        "panchang": {
          "tithi": "string",
          "nakshatra": "string",
          "sunrise": "string",
          "sunset": "string"
        }
      }`;

      const res = await apiRequest("POST", "/api/chat", { 
        message: prompt, 
        personality: "professional" 
      });
      const data = await res.json();
      const content = data.response.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(content) as DailyData;
    },
    onSuccess: (data) => {
      setDailyData(data);
    },
    onError: () => {
      toast({ title: "Failed to load daily content", variant: "destructive" });
      // Fallback data
      setDailyData({
        fact: "The game of Chess (Chaturanga) was invented in India.",
        news: ["India's digital economy expected to reach $1 trillion by 2030", "Startup ecosystem in India continues record growth", "India achieves new milestone in renewable energy capacity"],
        panchang: { tithi: "Pratipada", nakshatra: "Ashwini", sunrise: "06:15 AM", sunset: "06:30 PM" }
      });
    }
  });

  useEffect(() => {
    refreshContent();
  }, []);

  const refreshContent = () => {
    const randomQuote = indianQuotes[Math.floor(Math.random() * indianQuotes.length)];
    setQuote(randomQuote);
    generateDailyMutation.mutate();
  };

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={refreshContent} disabled={generateDailyMutation.isPending} data-testid="button-refresh">
              <RefreshCw className={`h-5 w-5 ${generateDailyMutation.isPending ? "animate-spin text-muted-foreground" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-tricolor mb-2">Swadesh Daily</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>

        {generateDailyMutation.isPending && !dailyData ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-saffron-500" />
            <p>Curating today's Panchang, facts, and news for you...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="p-8 glassmorphism border-0 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center flex-shrink-0">
                  <Quote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-3">Quote of the Day</h2>
                  <blockquote className="text-xl italic text-foreground/90 mb-2">
                    "{quote.quote}"
                  </blockquote>
                  <footer className="text-muted-foreground">— {quote.author}</footer>
                </div>
              </div>
            </Card>

            {dailyData && (
              <>
                <Card className="p-8 glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Today's Panchang</h2>
                      <p className="text-sm text-muted-foreground">Traditional Hindu Calendar details for today.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center text-center">
                      <Moon className="w-5 h-5 text-indigo-400 mb-2" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Tithi</span>
                      <span className="font-medium text-sm">{dailyData.panchang.tithi}</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center text-center">
                      <Star className="w-5 h-5 text-yellow-500 mb-2" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Nakshatra</span>
                      <span className="font-medium text-sm">{dailyData.panchang.nakshatra}</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center text-center">
                      <Sunrise className="w-5 h-5 text-orange-500 mb-2" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Sunrise</span>
                      <span className="font-medium text-sm">{dailyData.panchang.sunrise}</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center text-center">
                      <Sunset className="w-5 h-5 text-red-400 mb-2" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Sunset</span>
                      <span className="font-medium text-sm">{dailyData.panchang.sunset}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-india-green-500 to-india-green-600 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg mb-3">Historical Fact</h2>
                      <p className="text-foreground/90">{dailyData.fact}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-india-blue-500 to-india-blue-600 flex items-center justify-center flex-shrink-0">
                      <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg mb-3">Today's Headlines</h2>
                      <div className="space-y-3">
                        {dailyData.news.map((headline, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <p className="text-foreground/90">{headline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by Swadesh AI • Built in India
          </p>
        </div>
      </main>
    </div>
  );
}
