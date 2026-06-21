import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, FileText, Upload, Loader2, BookOpen, Languages, Highlighter, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";

const actions = [
  { value: "summarize", label: "Summarize", icon: FileSearch, description: "Get a concise summary" },
  { value: "explain", label: "Explain", icon: BookOpen, description: "Detailed explanation" },
  { value: "translate", label: "Translate", icon: Languages, description: "Translate to another language" },
  { value: "extract-notes", label: "Extract Notes", icon: FileText, description: "Extract key points" },
  { value: "highlight", label: "Highlight", icon: Highlighter, description: "Highlight important parts" },
];

const languages = [
  { value: "hi", label: "Hindi" },
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
];

export default function DocumentMaster() {
  const [, navigate] = useLocation();
  const [content, setContent] = useState("");
  const [action, setAction] = useState("summarize");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [result, setResult] = useState("");

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/document", {
        content,
        action,
        targetLanguage: action === "translate" ? targetLanguage : undefined,
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
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-saffron-500/20 to-saffron-600/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-saffron-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Document Master</h1>
            <p className="text-muted-foreground">Analyze, summarize, and translate documents</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Input Document</h2>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your document text here, or upload a file..."
              rows={12}
              className="mb-4"
              data-testid="input-document"
            />
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Action</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAction(a.value)}
                      className={`p-3 rounded-md text-left transition-all text-sm ${
                        action === a.value
                          ? "bg-saffron-500/20 ring-2 ring-saffron-500"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      data-testid={`button-action-${a.value}`}
                    >
                      <a.icon className="w-4 h-4 mb-1" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {action === "translate" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={() => analysisMutation.mutate()}
                disabled={!content.trim() || analysisMutation.isPending}
                className="w-full bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
                data-testid="button-analyze"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-4 h-4 mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Result</h2>
            {result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Results will appear here after analysis
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
