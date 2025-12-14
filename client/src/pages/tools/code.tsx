import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Code, Loader2, Bug, Zap, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";

const actions = [
  { value: "generate", label: "Generate Code", icon: Sparkles, description: "Create new code from description" },
  { value: "debug", label: "Debug", icon: Bug, description: "Find and fix bugs" },
  { value: "optimize", label: "Optimize", icon: Zap, description: "Improve performance" },
  { value: "explain", label: "Explain", icon: HelpCircle, description: "Understand the code" },
];

const languages = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "php", "ruby", "swift", "kotlin"
];

export default function CodeLab() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [action, setAction] = useState("generate");
  const [language, setLanguage] = useState("javascript");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  const codeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/code", {
        code: action === "generate" ? "" : code,
        action,
        language,
        prompt: action === "generate" ? prompt : undefined,
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
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-india-blue-500/20 to-india-blue-600/10 flex items-center justify-center">
            <Code className="w-6 h-6 text-india-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Code AI Lab</h1>
            <p className="text-muted-foreground">Generate, debug, and optimize code</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Code Input</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {actions.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAction(a.value)}
                    className={`p-3 rounded-md text-left transition-all text-sm ${
                      action === a.value
                        ? "bg-india-blue-500/20 ring-2 ring-india-blue-500"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    data-testid={`button-action-${a.value}`}
                  >
                    <a.icon className="w-4 h-4 mb-1" />
                    {a.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {action === "generate" ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">Describe what you want</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Create a function that sorts an array..."
                    rows={6}
                    data-testid="input-prompt"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Code</label>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="input-code"
                  />
                </div>
              )}

              <Button
                onClick={() => codeMutation.mutate()}
                disabled={(action === "generate" ? !prompt.trim() : !code.trim()) || codeMutation.isPending}
                className="w-full bg-gradient-to-r from-india-blue-500 to-india-green-500 hover:from-india-blue-600 hover:to-india-green-600"
                data-testid="button-process"
              >
                {codeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    {action === "generate" ? "Generate Code" : `${action.charAt(0).toUpperCase() + action.slice(1)} Code`}
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Result</h2>
            {result ? (
              <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {result}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Code className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Results will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
