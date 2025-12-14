import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Loader2, FileVideo, BookOpen, Feather, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const types = [
  { value: "script", label: "Script Generator", icon: FileVideo, description: "Create video/drama scripts" },
  { value: "story", label: "Story Maker", icon: BookOpen, description: "Generate creative stories" },
  { value: "poem", label: "Poem Writer", icon: Feather, description: "Hindi & English poems" },
  { value: "video-idea", label: "Video Ideas", icon: Lightbulb, description: "YouTube/short video concepts" },
];

export default function CreativeTools() {
  const [, navigate] = useLocation();
  const [type, setType] = useState("story");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [result, setResult] = useState("");

  const creativeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/creative", {
        type,
        prompt,
        language,
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
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500/20 to-saffron-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Creative Tools</h1>
            <p className="text-muted-foreground">Scripts, stories, poems & video ideas</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Create Content</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "p-4 rounded-md text-left transition-all",
                      type === t.value
                        ? "bg-purple-500/20 ring-2 ring-purple-500"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                    data-testid={`button-type-${t.value}`}
                  >
                    <t.icon className="w-5 h-5 mb-2" />
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi")}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Idea / Theme</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    type === "script" 
                      ? "Describe your video script idea..."
                      : type === "story"
                      ? "What kind of story do you want? (genre, characters, setting...)"
                      : type === "poem"
                      ? "Theme for your poem (love, nature, patriotism...)"
                      : "What type of video content are you looking for?"
                  }
                  rows={6}
                  data-testid="input-prompt"
                />
              </div>

              <Button
                onClick={() => creativeMutation.mutate()}
                disabled={!prompt.trim() || creativeMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-saffron-500 hover:from-purple-600 hover:to-saffron-600"
                data-testid="button-create"
              >
                {creativeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Your Creation</h2>
            {result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Your creative content will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
