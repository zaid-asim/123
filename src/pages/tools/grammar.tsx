import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, PenLine, Loader2, Copy, CheckCircle, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const modes = [
    { id: "check", label: "🔍 Grammar Check", desc: "Find errors & corrections" },
    { id: "improve", label: "✨ Improve Writing", desc: "Make it clearer & better" },
    { id: "formal", label: "👔 Make Formal", desc: "Professional language" },
    { id: "casual", label: "😊 Make Casual", desc: "Friendly, conversational" },
    { id: "hindi", label: "🇮🇳 Hindi Check", desc: "Hindi grammar & quality" },
];

const samples = [
    "i went to market yesterday and buyed some vegetable and fruits for my family",
    "The project have been completed by our team with great success and we delivered it on time",
];

export default function GrammarPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [text, setText] = useState("");
    const [mode, setMode] = useState("check");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const grammarMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/grammar", { text, mode });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Analysis failed. Try again.", variant: "destructive" }),
    });

    const copyResult = () => {
        navigator.clipboard.writeText(result);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

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

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <PenLine className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">Grammar & Writing AI</h1>
                        <p className="text-sm text-muted-foreground">AI-powered writing assistant for English and Hindi</p>
                    </div>
                </div>

                {/* Mode selector */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {modes.map(m => (
                        <button key={m.id}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${mode === m.id ? "bg-saffron-500 text-white border-saffron-500" : "border-border/50 hover:border-saffron-500/50 bg-muted/30"}`}
                            onClick={() => setMode(m.id)}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Input */}
                    <Card className="p-5 glassmorphism border-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Your Text</label>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => { setText(""); setResult(""); }}>
                                <RotateCcw className="h-3 w-3" /> Clear
                            </Button>
                        </div>
                        <Textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Paste or type your text here... (English or Hindi)"
                            className="min-h-[280px] bg-background/50 resize-none font-mono text-sm"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{text.length} characters · {text.split(/\s+/).filter(Boolean).length} words</span>
                            <div className="flex gap-2">
                                {samples.map((s, i) => (
                                    <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => setText(s)}>
                                        Sample {i + 1}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={() => grammarMutation.mutate()}
                            disabled={!text.trim() || grammarMutation.isPending}
                            className="w-full h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 font-semibold"
                        >
                            {grammarMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze</>}
                        </Button>
                    </Card>

                    {/* Result */}
                    <Card className="p-5 glassmorphism border-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-blue-500">Result</h3>
                            {result && (
                                <Button size="sm" variant="ghost" onClick={copyResult} className="h-7 gap-1 text-xs">
                                    {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            )}
                        </div>
                        {grammarMutation.isPending ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <PenLine className="h-6 w-6 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground text-sm">Analyzing your text...</p>
                            </div>
                        ) : result ? (
                            <div className="flex-1 overflow-auto prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                {result}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <PenLine className="h-14 w-14 mb-3 opacity-20" />
                                <p>Enter text and select a mode</p>
                                <p className="text-xs mt-1">AI will check grammar, improve writing, or adjust tone</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
