import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Video, Youtube, Loader2, Copy, CheckCircle, List, FileText, HelpCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const videoActions = [
    { value: "summarize", label: "Summarize", icon: FileText, description: "Get a concise summary" },
    { value: "key-points", label: "Key Points", icon: List, description: "Extract bullet-point highlights" },
    { value: "qa", label: "Q&A", icon: HelpCircle, description: "Generate questions & answers" },
    { value: "chapters", label: "Chapters", icon: BookOpen, description: "Break into chapter sections" },
];

export default function VideoBrain() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [videoText, setVideoText] = useState("");
    const [action, setAction] = useState("summarize");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const analyzeMutation = useMutation({
        mutationFn: async () => {
            const actionPrompts: Record<string, string> = {
                "summarize": `Provide a comprehensive yet concise summary of this video content:\n\n${videoText}`,
                "key-points": `Extract and list the key points, insights, and takeaways from this video content:\n\n${videoText}`,
                "qa": `Generate 5 thoughtful questions and detailed answers based on this video content:\n\n${videoText}`,
                "chapters": `Break this video content into logical chapter sections with timestamps (if available) and brief descriptions:\n\n${videoText}`,
            };
            const res = await apiRequest("POST", "/api/tools/document", {
                content: actionPrompts[action],
                action: "explain",
            });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Analysis failed", description: "Please try again", variant: "destructive" }),
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Copied to clipboard!" });
    };

    const exampleDescriptions = [
        "A video about the history of ancient Indian civilization, covering the Indus Valley, Vedic period, and Maurya Empire.",
        "Tutorial on React hooks: useState, useEffect, useMemo explained with code examples.",
        "Documentary on India's space program ISRO, covering Chandrayaan, Mangalyaan, and future missions.",
    ];

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
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">Video Brain</h1>
                </div>
                <p className="text-muted-foreground mb-8">
                    Paste a video transcript, description, or summary — and let Swadesh AI analyze it for you.
                </p>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        <Card className="p-5 glassmorphism border-0">
                            <h2 className="font-semibold mb-3 flex items-center gap-2">
                                <Youtube className="h-4 w-4 text-red-500" />
                                Video Content / Transcript
                            </h2>
                            <Textarea
                                value={videoText}
                                onChange={(e) => setVideoText(e.target.value)}
                                placeholder="Paste video description, transcript, or captions here..."
                                className="min-h-[200px] resize-none bg-background/50"
                                data-testid="input-video-text"
                            />
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
                                <div className="space-y-1">
                                    {exampleDescriptions.map((ex, i) => (
                                        <button
                                            key={i}
                                            className="w-full text-left text-xs text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted/50 transition-colors line-clamp-1"
                                            onClick={() => setVideoText(ex)}
                                        >
                                            ▸ {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 glassmorphism border-0">
                            <h2 className="font-semibold mb-3">Analysis Type</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {videoActions.map((a) => (
                                    <button
                                        key={a.value}
                                        onClick={() => setAction(a.value)}
                                        className={`p-3 rounded-lg text-left transition-all border ${action === a.value
                                                ? "bg-saffron-500/10 border-saffron-500/50 text-saffron-600 dark:text-saffron-400"
                                                : "border-border/50 hover:bg-muted/50"
                                            }`}
                                        data-testid={`button-action-${a.value}`}
                                    >
                                        <a.icon className="h-4 w-4 mb-1" />
                                        <div className="font-medium text-sm">{a.label}</div>
                                        <div className="text-xs text-muted-foreground">{a.description}</div>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Button
                            onClick={() => analyzeMutation.mutate()}
                            disabled={!videoText.trim() || analyzeMutation.isPending}
                            className="w-full h-11 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
                            data-testid="button-analyze"
                        >
                            {analyzeMutation.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                            ) : (
                                <><Video className="h-4 w-4 mr-2" /> Analyze Video</>
                            )}
                        </Button>
                    </div>

                    <Card className="p-5 glassmorphism border-0 min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Analysis Result</h2>
                            {result && (
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-7">
                                    {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            )}
                        </div>
                        {analyzeMutation.isPending ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <div className="w-12 h-12 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                </div>
                                <p className="text-muted-foreground text-sm">Swadesh AI is analyzing...</p>
                            </div>
                        ) : result ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                {result}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                                <Video className="h-12 w-12 mb-3 opacity-30" />
                                <p>Paste video content on the left and click Analyze</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
