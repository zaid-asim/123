import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Heart, Loader2, Copy, CheckCircle, Leaf, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const modes = [
    { id: "symptoms", label: "🩺 Symptom Checker", desc: "Causes, remedies, when to see a doctor" },
    { id: "ayurveda", label: "🌿 Ayurvedic Remedies", desc: "Traditional Indian medicine & herbs" },
    { id: "yoga", label: "🧘 Yoga & Breathing", desc: "Poses & pranayama for wellness" },
    { id: "diet", label: "🥗 Indian Diet Plan", desc: "Healthy meal plan with Indian foods" },
];

const quickSymptoms = ["Headache", "Back pain", "Stress & anxiety", "Poor sleep", "Indigestion", "Cold & cough", "Low energy", "Diabetes management"];

export default function HealthPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [symptom, setSymptom] = useState("");
    const [age, setAge] = useState("adult");
    const [mode, setMode] = useState("symptoms");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const healthMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/health", { symptom, age, type: mode });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Failed to get health advice. Try again.", variant: "destructive" }),
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
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">Health & Wellness AI</h1>
                        <p className="text-sm text-muted-foreground">Ayurveda, Yoga, Diet & Symptom guidance — the Indian way</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ <strong>Important:</strong> This is general wellness information only. Always consult a qualified doctor for medical diagnosis and treatment.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="space-y-4">
                        {/* Mode selector */}
                        <div className="space-y-2">
                            {modes.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`w-full p-3 rounded-xl text-left transition-all border ${mode === m.id ? "border-rose-500 bg-rose-500/10" : "border-border/40 hover:border-rose-500/40 bg-muted/20"}`}
                                >
                                    <div className="text-sm font-medium">{m.label}</div>
                                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                                </button>
                            ))}
                        </div>

                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {mode === "diet" ? "Specific goal or condition" : "Symptom or concern"}
                                </label>
                                <Input
                                    value={symptom}
                                    onChange={e => setSymptom(e.target.value)}
                                    placeholder={mode === "diet" ? "e.g. weight loss, diabetes..." : "e.g. headache, back pain..."}
                                    className="bg-background/50"
                                />
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {quickSymptoms.map(s => (
                                        <Badge
                                            key={s} variant="outline"
                                            className="cursor-pointer text-xs hover:bg-rose-500/10 hover:border-rose-500"
                                            onClick={() => setSymptom(s)}
                                        >
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Age Group</label>
                                <Select value={age} onValueChange={setAge}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="child">👶 Child (0–12)</SelectItem>
                                        <SelectItem value="teenager">🧒 Teenager (13–19)</SelectItem>
                                        <SelectItem value="adult">🧑 Adult (20–45)</SelectItem>
                                        <SelectItem value="middle-aged">👨 Middle-aged (46–60)</SelectItem>
                                        <SelectItem value="senior">👴 Senior (60+)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={() => healthMutation.mutate()}
                                disabled={healthMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 font-semibold"
                            >
                                {healthMutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Getting advice...</>
                                    : <><Heart className="h-4 w-4 mr-2" />Get Health Advice</>}
                            </Button>
                        </Card>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-2">
                        {healthMutation.isPending ? (
                            <Card className="p-10 glassmorphism border-0 min-h-[500px] flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <Heart className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground">Gathering wellness wisdom...</p>
                                <p className="text-xs text-muted-foreground">🌿 Combining modern & Ayurvedic knowledge</p>
                            </Card>
                        ) : result ? (
                            <Card className="p-6 glassmorphism border-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {mode === "ayurveda" ? <Leaf className="h-5 w-5 text-india-green-500" /> :
                                            mode === "yoga" ? <Dumbbell className="h-5 w-5 text-saffron-500" /> :
                                                <Heart className="h-5 w-5 text-rose-500" />}
                                        <h3 className="font-semibold">Health Guidance</h3>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={copyResult} className="gap-1 text-xs">
                                        {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        {copied ? "Copied!" : "Copy"}
                                    </Button>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-sm overflow-auto max-h-[600px]">
                                    {result}
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-10 glassmorphism border-0 min-h-[500px] flex flex-col items-center justify-center text-muted-foreground text-center">
                                <Heart className="h-16 w-16 mb-4 opacity-20" />
                                <p className="font-medium">Choose a mode and describe your concern</p>
                                <div className="grid grid-cols-2 gap-3 mt-6 text-xs">
                                    {[
                                        { icon: "🩺", text: "Symptom analysis with home remedies" },
                                        { icon: "🌿", text: "Ayurvedic herbs & traditional remedies" },
                                        { icon: "🧘", text: "Yoga poses & breathing exercises" },
                                        { icon: "🥗", text: "Healthy Indian diet & meal plans" },
                                    ].map(f => (
                                        <div key={f.text} className="p-3 rounded-lg bg-muted/30 text-left">
                                            <p className="text-base mb-1">{f.icon}</p>
                                            <p>{f.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
