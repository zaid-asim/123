import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Loader2, BookOpen, ListChecks, Calculator, FileQuestion, Image } from "lucide-react";
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
  { value: "ncert-solution", label: "NCERT Solution", icon: BookOpen },
  { value: "mcq-generate", label: "Generate MCQs", icon: ListChecks },
  { value: "long-answer", label: "Long Answer", icon: FileQuestion },
  { value: "math-solve", label: "Math Solver", icon: Calculator },
  { value: "explain-diagram", label: "Explain Diagram", icon: Image },
];

const grades = ["6", "7", "8", "9", "10", "11", "12"];
const subjects = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "History", "Geography", "English", "Hindi"];

export default function StudyPro() {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [action, setAction] = useState("ncert-solution");
  const [grade, setGrade] = useState("10");
  const [subject, setSubject] = useState("Mathematics");
  const [result, setResult] = useState("");

  const studyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/study", {
        topic,
        action,
        grade,
        subject,
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
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-india-green-500/20 to-india-green-600/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-india-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Study Pro Suite</h1>
            <p className="text-muted-foreground">NCERT solutions, MCQs, math solver & more</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Study Assistant</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {actions.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAction(a.value)}
                    className={`p-3 rounded-md text-left transition-all text-sm ${
                      action === a.value
                        ? "bg-india-green-500/20 ring-2 ring-india-green-500"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    data-testid={`button-action-${a.value}`}
                  >
                    <a.icon className="w-4 h-4 mb-1" />
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Grade</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>Class {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger data-testid="select-subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Topic / Question</label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    action === "math-solve" 
                      ? "Enter your math problem (e.g., Solve: 2x + 5 = 15)"
                      : action === "mcq-generate"
                      ? "Enter topic for MCQs (e.g., Photosynthesis)"
                      : "Enter your question or topic..."
                  }
                  rows={6}
                  data-testid="input-topic"
                />
              </div>

              <Button
                onClick={() => studyMutation.mutate()}
                disabled={!topic.trim() || studyMutation.isPending}
                className="w-full bg-gradient-to-r from-india-green-500 to-saffron-500 hover:from-india-green-600 hover:to-saffron-600"
                data-testid="button-study"
              >
                {studyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Get Answer
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Solution</h2>
            {result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Your solution will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
