import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Search, Volume2, Loader2, Star, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useTTS } from "@/lib/tts-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToolActionFooter } from "@/components/tool-action-footer";

const wordOfDay = { word: "Swaraj", meaning: "Self-rule or self-governance; a concept central to Indian independence.", origin: "Sanskrit: swa (self) + raj (rule)", example: "Mahatma Gandhi's vision of Swaraj extended beyond political independence to inner freedom." };

export default function DictionaryPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [searchWord, setSearchWord] = useState("");
    const [result, setResult] = useState<any>(null);
    const { speak } = useTTS();

    const lookupMutation = useMutation({
        mutationFn: async (word: string) => {
            const res = await apiRequest("POST", "/api/chat", {
                message: `Provide a comprehensive dictionary entry for the word "${word}". Include: 1) Definition(s) with part of speech, 2) Etymology/origin, 3) 2-3 example sentences, 4) Synonyms, 5) Antonyms, 6) Hindi translation (if applicable). Format clearly with section headers.`,
                personality: "teacher",
            });
            const data = await res.json();
            return { word, definition: data.response };
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Word lookup failed", variant: "destructive" }),
    });

    const quickWords = ["Namaste", "Dharma", "Karma", "Jugaad", "Moksha", "Ahimsa"];

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

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">AI Dictionary</h1>
                </div>

                {/* Search */}
                <Card className="p-5 glassmorphism border-0 mb-6">
                    <div className="flex gap-3">
                        <Input
                            value={searchWord}
                            onChange={e => setSearchWord(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && searchWord.trim() && lookupMutation.mutate(searchWord.trim())}
                            placeholder="Search any word in English or Hindi..."
                            className="flex-1 bg-background/50"
                            data-testid="input-word-search"
                        />
                        <Button
                            onClick={() => searchWord.trim() && lookupMutation.mutate(searchWord.trim())}
                            disabled={!searchWord.trim() || lookupMutation.isPending}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90"
                        >
                            {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">Quick search:</span>
                        {quickWords.map(w => (
                            <Badge key={w} variant="outline" className="cursor-pointer hover:bg-muted transition-colors text-xs"
                                onClick={() => { setSearchWord(w); lookupMutation.mutate(w); }}>
                                {w}
                            </Badge>
                        ))}
                    </div>
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Result */}
                    <div className="lg:col-span-2">
                        {lookupMutation.isPending ? (
                            <Card className="p-10 glassmorphism border-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground">Looking up "{searchWord}"...</p>
                            </Card>
                        ) : result ? (
                            <Card className="p-6 glassmorphism border-0">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-3xl font-bold capitalize">{result.word}</h2>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => speak(result.word)} className="gap-1">
                                        <Volume2 className="h-4 w-4" /> Speak
                                    </Button>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                    {result.definition}
                                </div>
                                <ToolActionFooter content={result.definition} title={`Dictionary Definition: ${result.word}`} />
                            </Card>
                        ) : (
                            <Card className="p-10 glassmorphism border-0 text-center text-muted-foreground">
                                <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">Search any word to get its definition</p>
                                <p className="text-sm mt-1">Supports English, Hindi, and Indian vocabulary</p>
                            </Card>
                        )}
                    </div>

                    {/* Word of the Day */}
                    <div className="space-y-4">
                        <Card className="p-5 glassmorphism border-0">
                            <div className="flex items-center gap-2 mb-3">
                                <Star className="h-4 w-4 text-saffron-500" />
                                <h3 className="font-semibold text-sm">Word of the Day</h3>
                            </div>
                            <h4 className="text-xl font-bold text-saffron-500 mb-2">{wordOfDay.word}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{wordOfDay.meaning}</p>
                            <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                                <span className="font-medium">Origin:</span> {wordOfDay.origin}
                            </div>
                            <p className="text-xs mt-2 italic text-muted-foreground">{wordOfDay.example}</p>
                            <Button
                                size="sm" variant="ghost"
                                className="mt-2 w-full text-xs gap-1"
                                onClick={() => { setSearchWord(wordOfDay.word); lookupMutation.mutate(wordOfDay.word); }}
                            >
                                <Search className="h-3 w-3" /> Learn more
                            </Button>
                        </Card>

                        <Card className="p-5 glassmorphism border-0">
                            <div className="flex items-center gap-2 mb-3">
                                <Hash className="h-4 w-4 text-india-green-500" />
                                <h3 className="font-semibold text-sm">Indian Concepts</h3>
                            </div>
                            <div className="space-y-1">
                                {["Ahimsa", "Dharma", "Karma", "Moksha", "Jugaad", "Atma"].map(w => (
                                    <button key={w}
                                        className="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors"
                                        onClick={() => { setSearchWord(w); lookupMutation.mutate(w); }}>
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
