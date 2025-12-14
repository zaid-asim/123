import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Quote, Lightbulb, Newspaper, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { indianQuotes } from "@shared/schema";

export default function SwadeshDaily() {
  const [, navigate] = useLocation();
  const [quote, setQuote] = useState(indianQuotes[0]);
  const [fact, setFact] = useState("");
  const [news, setNews] = useState<string[]>([]);

  useEffect(() => {
    const randomQuote = indianQuotes[Math.floor(Math.random() * indianQuotes.length)];
    setQuote(randomQuote);
    
    const facts = [
      "India has the world's largest postal network with over 150,000 post offices.",
      "The game of Chess was invented in India.",
      "India has the highest number of post offices in the world.",
      "The first university in the world was established in India - Takshashila in 700 BC.",
      "Yoga has its origins in India and has been practiced for more than 5,000 years.",
      "India was one of the richest countries until the British invasion in the early 17th century.",
      "The Kumbh Mela festival is so large that it can be seen from space.",
      "India has the largest number of vegetarians in the world.",
      "The world's first granite temple is the Brihadeeswara Temple in Thanjavur.",
      "India gave the world the number system, including the concept of zero.",
    ];
    setFact(facts[Math.floor(Math.random() * facts.length)]);

    setNews([
      "ISRO announces plans for next lunar mission - Chandrayaan-4",
      "India's digital economy expected to reach $1 trillion by 2030",
      "New high-speed rail corridor proposed connecting major metros",
      "Startup ecosystem in India continues record growth",
      "India achieves new milestone in renewable energy capacity",
    ]);
  }, []);

  const refreshContent = () => {
    const randomQuote = indianQuotes[Math.floor(Math.random() * indianQuotes.length)];
    setQuote(randomQuote);
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
            <Button variant="ghost" size="icon" onClick={refreshContent} data-testid="button-refresh">
              <RefreshCw className="h-5 w-5" />
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

          <Card className="p-8 glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-india-green-500 to-india-green-600 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-3">Did You Know?</h2>
                <p className="text-foreground/90">{fact}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 glassmorphism border-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-india-blue-500 to-india-blue-600 flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-3">Today's Headlines</h2>
                <div className="space-y-3">
                  {news.map((headline, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <p className="text-foreground/90">{headline}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by Swadesh AI • Built in India
          </p>
        </div>
      </main>
    </div>
  );
}
