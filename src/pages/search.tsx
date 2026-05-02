import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Search as SearchIcon, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";

export default function Search() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const initialQuery = new URLSearchParams(searchString).get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"general" | "news" | "academic">("general");
  const [results, setResults] = useState<{ summary: string; sources: Array<{ title: string; url: string; snippet: string }> } | null>(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/search", {
        query,
        type: searchType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate();
    }
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
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-tricolor mb-2">AI-Powered Search</h1>
          <p className="text-muted-foreground">Get intelligent summaries and curated results</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-saffron-500 via-white to-india-green-500 rounded-lg opacity-30 blur" />
            <div className="relative flex gap-2">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
                className="flex-1 h-14 text-lg bg-background/80 border-0 pl-5"
                data-testid="input-search"
              />
              <Button
                type="submit"
                disabled={!query.trim() || searchMutation.isPending}
                className="h-14 px-8 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
                data-testid="button-search"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SearchIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </form>

        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News</TabsTrigger>
            <TabsTrigger value="academic" data-testid="tab-academic">Academic</TabsTrigger>
          </TabsList>
        </Tabs>

        {searchMutation.isPending && (
          <Card className="p-8 glassmorphism border-0 text-center animate-pulse">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-saffron-500" />
            <p className="text-muted-foreground">Searching and analyzing results...</p>
          </Card>
        )}

        {results && !searchMutation.isPending && (
          <div className="space-y-6 animate-slide-up">
            <Card className="p-6 glassmorphism border-0">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full tricolor-gradient flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold mb-2">AI Summary</h2>
                  <p className="text-foreground/90 whitespace-pre-wrap">{results.summary}</p>
                </div>
              </div>
            </Card>

            {results.sources && results.sources.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Sources</h3>
                <div className="space-y-3">
                  {results.sources.map((source, index) => (
                    <Card
                      key={index}
                      className="p-4 glassmorphism border-0 hover:bg-muted/50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{source.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{source.snippet}</p>
                          <p className="text-xs text-india-blue-500 mt-2 truncate">{source.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(source.url, "_blank")}
                          data-testid={`button-source-${index}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!results && !searchMutation.isPending && (
          <Card className="p-12 glassmorphism border-0 text-center">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">Search the web with AI</p>
            <p className="text-muted-foreground">
              Get intelligent summaries, key insights, and curated sources
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
