import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowLeft, HelpCircle, Trophy, RotateCcw, CheckCircle, XCircle,
    Loader2, Sparkles, TimerIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

const topics = [
    "Indian History", "Indian Culture & Festivals", "Geography of India",
    "Indian Constitution", "Science & Technology", "Current Affairs India",
    "Mathematics", "General Knowledge", "Indian Art & Literature",
    "Sports & Games", "Indian Economy", "Space & ISRO"
];

export default function QuizPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [topic, setTopic] = useState("Indian History");
    const [difficulty, setDifficulty] = useState("medium");
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState<boolean[]>([]);

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/chat", {
                message: `Generate 5 ${difficulty} difficulty multiple choice quiz questions about "${topic}". 
For each question provide: question text, 4 options (A/B/C/D), the correct option number (0-indexed), and a brief explanation.
Respond ONLY with valid JSON array in this exact format:
[{"question":"...","options":["A...","B...","C...","D..."],"correct":0,"explanation":"..."}]
No markdown, no explanation outside JSON, just the array.`,
                personality: "teacher",
            });
            const data = await res.json();
            const jsonMatch = data.response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Invalid response format");
            return JSON.parse(jsonMatch[0]) as QuizQuestion[];
        },
        onSuccess: (data) => {
            setQuestions(data);
            setCurrent(0); setSelected(null); setShowAnswer(false);
            setScore(0); setFinished(false); setAnswers([]);
        },
        onError: () => toast({ title: "Failed to generate quiz. Try again.", variant: "destructive" }),
    });

    const handleSelect = (idx: number) => {
        if (showAnswer) return;
        setSelected(idx);
        setShowAnswer(true);
        const correct = idx === questions[current].correct;
        if (correct) setScore(s => s + 1);
        setAnswers(a => [...a, correct]);
    };

    const handleNext = () => {
        if (current + 1 >= questions.length) { setFinished(true); return; }
        setCurrent(c => c + 1);
        setSelected(null);
        setShowAnswer(false);
    };

    const reset = () => {
        setQuestions([]); setCurrent(0); setSelected(null);
        setShowAnswer(false); setScore(0); setFinished(false); setAnswers([]);
    };

    const q = questions[current];
    const percent = questions.length > 0 ? ((current + (showAnswer ? 1 : 0)) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-background relative">
            <ParticleBackground />
            <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
                        <SwadeshLogo size="sm" animated={false} />
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">AI Quiz Master</h1>
                </div>

                {questions.length === 0 ? (
                    <Card className="p-8 glassmorphism border-0 space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full tricolor-gradient-animated mx-auto mb-4 flex items-center justify-center">
                                <Trophy className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Test Your Knowledge!</h2>
                            <p className="text-muted-foreground">AI-generated quiz on any topic. 5 questions per round.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Topic</label>
                                <Select value={topic} onValueChange={setTopic}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">🟢 Easy</SelectItem>
                                        <SelectItem value="medium">🟡 Medium</SelectItem>
                                        <SelectItem value="hard">🔴 Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                            className="w-full h-12 bg-gradient-to-r from-saffron-500 to-india-green-500 text-white font-semibold"
                        >
                            {generateMutation.isPending ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Generating Quiz...</> : <><Sparkles className="h-5 w-5 mr-2" />Start Quiz</>}
                        </Button>
                    </Card>
                ) : finished ? (
                    <Card className="p-10 glassmorphism border-0 text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-saffron-500 to-india-green-500 mx-auto flex items-center justify-center">
                            <Trophy className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-1">{score}/{questions.length}</h2>
                            <p className="text-muted-foreground">
                                {score === questions.length ? "🎉 Perfect Score!" : score >= 3 ? "👏 Great job!" : "📚 Keep practicing!"}
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                            {answers.map((a, i) => a
                                ? <CheckCircle key={i} className="h-8 w-8 text-green-500" />
                                : <XCircle key={i} className="h-8 w-8 text-red-500" />
                            )}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={reset} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" />New Topic</Button>
                            <Button onClick={() => generateMutation.mutate()} className="gap-2 bg-saffron-500 hover:bg-saffron-600">
                                <Sparkles className="h-4 w-4" />Same Topic Again
                            </Button>
                        </div>
                    </Card>
                ) : q && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Question {current + 1} of {questions.length}</span>
                            <span className="text-sm font-medium text-saffron-500">Score: {score}</span>
                        </div>
                        <Progress value={percent} className="h-2 mb-4" />
                        <Card className="p-6 glassmorphism border-0">
                            <p className="text-lg font-semibold mb-6">{q.question}</p>
                            <div className="space-y-3">
                                {q.options.map((opt, idx) => {
                                    let cls = "w-full p-4 rounded-xl text-left transition-all border ";
                                    if (!showAnswer) cls += "border-border/50 hover:bg-muted/50 hover:border-saffron-500/50 cursor-pointer";
                                    else if (idx === q.correct) cls += "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400";
                                    else if (idx === selected && idx !== q.correct) cls += "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                                    else cls += "border-border/30 opacity-60";
                                    return (
                                        <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
                                            <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                                            {showAnswer && idx === q.correct && <CheckCircle className="inline h-4 w-4 ml-2 text-green-500" />}
                                            {showAnswer && idx === selected && idx !== q.correct && <XCircle className="inline h-4 w-4 ml-2 text-red-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                            {showAnswer && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                                    <p className="text-sm font-medium mb-1">💡 Explanation</p>
                                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                </div>
                            )}
                            {showAnswer && (
                                <Button onClick={handleNext} className="mt-4 w-full bg-gradient-to-r from-saffron-500 to-india-green-500">
                                    {current + 1 >= questions.length ? "See Results 🎉" : "Next Question →"}
                                </Button>
                            )}
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
