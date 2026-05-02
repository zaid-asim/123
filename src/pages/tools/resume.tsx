import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2, Download, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FormData {
    name: string; email: string; phone: string; role: string;
    experience: string; skills: string; education: string; achievements: string;
}

export default function ResumePage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [form, setForm] = useState<FormData>({
        name: "", email: "", phone: "", role: "",
        experience: "", skills: "", education: "", achievements: "",
    });
    const [result, setResult] = useState("");

    const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const resumeMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/resume", form);
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Resume generation failed. Try again.", variant: "destructive" }),
    });

    const downloadResume = () => {
        const blob = new Blob([result], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${form.name.replace(/\s+/g, "_")}_Resume.txt`;
        a.click();
    };

    const isValid = form.name.trim() && form.role.trim();

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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">AI Resume Builder</h1>
                        <p className="text-sm text-muted-foreground">ATS-optimized professional resume in seconds</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="space-y-4">
                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-teal-500" />
                                <h3 className="font-semibold text-sm">Personal Info</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Full Name *</label>
                                    <Input value={form.name} onChange={set("name")} placeholder="Rahul Sharma" className="bg-background/50" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Target Role *</label>
                                    <Input value={form.role} onChange={set("role")} placeholder="Software Engineer" className="bg-background/50" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Email</label>
                                    <Input value={form.email} onChange={set("email")} placeholder="rahul@email.com" className="bg-background/50" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Phone</label>
                                    <Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className="bg-background/50" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Work Experience</label>
                                <Textarea
                                    value={form.experience}
                                    onChange={set("experience")}
                                    placeholder={"e.g. 2 years at TCS as Frontend Developer\n- Built React dashboards for 50k+ users\n- Reduced load time by 40%"}
                                    className="min-h-[100px] bg-background/50 text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Skills</label>
                                <Input value={form.skills} onChange={set("skills")} placeholder="React, Node.js, Python, SQL, AWS..." className="bg-background/50" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Education</label>
                                <Input value={form.education} onChange={set("education")} placeholder="B.Tech CSE – VIT University, 2022" className="bg-background/50" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Key Achievements (optional)</label>
                                <Textarea
                                    value={form.achievements}
                                    onChange={set("achievements")}
                                    placeholder="Hackathon winner, Published paper, Open source contributor..."
                                    className="min-h-[70px] bg-background/50 text-sm resize-none"
                                />
                            </div>
                            <Button
                                onClick={() => resumeMutation.mutate()}
                                disabled={!isValid || resumeMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 font-semibold"
                            >
                                {resumeMutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Building Resume...</>
                                    : <><Sparkles className="h-4 w-4 mr-2" />Generate Resume</>}
                            </Button>
                        </Card>
                    </div>

                    {/* Result */}
                    <Card className="p-5 glassmorphism border-0 flex flex-col min-h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-teal-500" /> Generated Resume
                            </h3>
                            {result && (
                                <Button size="sm" variant="ghost" onClick={downloadResume} className="gap-1 text-xs">
                                    <Download className="h-3 w-3" /> Download .txt
                                </Button>
                            )}
                        </div>
                        {resumeMutation.isPending ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground text-sm">Crafting your professional resume...</p>
                                <p className="text-xs text-muted-foreground">✨ Optimizing for ATS & recruiters</p>
                            </div>
                        ) : result ? (
                            <div className="flex-1 overflow-auto">
                                <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">{result}</pre>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                                <FileText className="h-16 w-16 mb-4 opacity-20" />
                                <p className="font-medium">Fill in your details</p>
                                <p className="text-sm mt-1">AI will create a fully formatted, ATS-optimized resume</p>
                                <ul className="text-xs mt-3 space-y-1 text-left">
                                    {["Professional summary", "Impact-driven bullet points", "Skills section", "Education & achievements"].map(i => (
                                        <li key={i} className="flex items-center gap-2"><span className="text-teal-500">✓</span>{i}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
