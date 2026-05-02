import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Wand2, Loader2, Copy, CheckCircle, Sparkles, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const styles = [
    { id: "realistic", label: "📷 Realistic", desc: "Photorealistic, detailed" },
    { id: "artistic", label: "🎨 Artistic", desc: "Painterly, impressionist" },
    { id: "indian", label: "🪔 Indian Art", desc: "Madhubani, Warli folk" },
    { id: "cartoon", label: "🎭 Cartoon", desc: "Colorful, animated" },
    { id: "3d", label: "💎 3D / CGI", desc: "Modern, rendered" },
    { id: "sketch", label: "✏️ Sketch", desc: "Pencil/line art" },
];

const suggestions = [
    "A golden sunrise over the Taj Mahal with lotus flowers in the foreground",
    "Lord Ganesha in vibrant Madhubani art style with peacock motifs",
    "A futuristic Mumbai skyline with flying vehicles and neon lights",
    "A cozy Indian village hut in monsoon season surrounded by lush green fields",
    "A majestic Bengal tiger walking through a misty jungle",
    "A street vendor selling chai in old Delhi with colorful rickshaws",
];

export default function ImageGenPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("realistic");
    const [result, setResult] = useState<{ description: string; sdPrompt: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const genMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/image-gen", { prompt, style });
            const data = await res.json();
            const text = data.result as string;
            const promptIdx = text.indexOf("PROMPT:");
            return {
                description: promptIdx > -1 ? text.slice(0, promptIdx).trim() : text,
                sdPrompt: promptIdx > -1 ? text.slice(promptIdx + 7).trim() : "",
            };
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Generation failed. Try again.", variant: "destructive" }),
    });

    const copyPrompt = () => {
        if (result?.sdPrompt) { navigator.clipboard.writeText(result.sdPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                        <Wand2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">AI Image Studio</h1>
                        <p className="text-sm text-muted-foreground">Describe your vision — AI creates vivid images & optimized prompts</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Controls */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Your Prompt</label>
                                <Textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Describe what you want to see... (in English or Hindi)"
                                    className="min-h-[120px] bg-background/50 resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">{prompt.length} characters</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {styles.map(s => (
                                        <button key={s.id}
                                            className={`p-3 rounded-xl text-left text-xs transition-all border ${style === s.id ? "border-saffron-500 bg-saffron-500/10" : "border-border/40 hover:border-saffron-500/40 bg-muted/30"}`}
                                            onClick={() => setStyle(s.id)}
                                        >
                                            <div className="font-medium">{s.label}</div>
                                            <div className="text-muted-foreground">{s.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={() => genMutation.mutate()}
                                disabled={!prompt.trim() || genMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 font-semibold"
                            >
                                {genMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate</>}
                            </Button>
                        </Card>

                        {/* Suggestions */}
                        <Card className="p-4 glassmorphism border-0">
                            <p className="text-xs font-semibold text-pink-500 mb-2 flex items-center gap-1"><Palette className="h-3 w-3" /> Inspiration</p>
                            <div className="space-y-1">
                                {suggestions.map(s => (
                                    <button key={s} className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors" onClick={() => setPrompt(s)}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-3 space-y-4">
                        {genMutation.isPending ? (
                            <Card className="p-10 glassmorphism border-0 min-h-[400px] flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <Wand2 className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground">Creating your vision...</p>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                                </div>
                            </Card>
                        ) : result ? (
                            <>
                                {/* Visual description card — rich visual feedback */}
                                <Card className="p-6 glassmorphism border-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                            <Wand2 className="h-4 w-4 text-white" />
                                        </div>
                                        <h3 className="font-semibold">Generated Vision</h3>
                                        <Badge variant="outline" className="text-xs ml-auto capitalize">{style}</Badge>
                                    </div>
                                    {/* Decorative gradient border "image frame" */}
                                    <div className="w-full rounded-xl p-[2px] bg-gradient-to-br from-saffron-500 via-white to-india-green-500 mb-4">
                                        <div className="w-full rounded-xl bg-muted/80 p-8 text-center min-h-[180px] flex items-center justify-center">
                                            <div>
                                                <Wand2 className="h-12 w-12 text-saffron-500 mx-auto mb-3 opacity-60" />
                                                <p className="text-sm text-muted-foreground">AI-imagined artwork</p>
                                                <p className="text-xs text-muted-foreground mt-1">Copy the prompt below to use in DALL-E, Midjourney, or Stable Diffusion</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed">{result.description}</p>
                                </Card>

                                {/* Optimized prompt for image generators */}
                                {result.sdPrompt && (
                                    <Card className="p-5 glassmorphism border-0 border-l-4 border-l-saffron-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-saffron-500">🎯 Copy this prompt for DALL-E / Midjourney / Stable Diffusion</p>
                                            <Button size="sm" variant="ghost" onClick={copyPrompt} className="h-7 gap-1 text-xs">
                                                {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                {copied ? "Copied!" : "Copy"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg font-mono leading-relaxed">{result.sdPrompt}</p>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card className="p-10 glassmorphism border-0 min-h-[400px] flex flex-col items-center justify-center text-muted-foreground text-center">
                                <Wand2 className="h-16 w-16 mb-4 opacity-20" />
                                <p className="font-medium">Describe your image idea</p>
                                <p className="text-sm mt-1">AI will generate a vivid description and an optimized prompt</p>
                                <p className="text-xs mt-2 max-w-[300px]">Use the generated prompt in DALL-E 3, Midjourney, or Stable Diffusion to create actual images</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
