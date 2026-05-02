import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowLeft, Calculator, Loader2, Delete, Equal, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const calcButtons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
];

// Safe math evaluator — no eval() needed
function safeEval(expr: string): number {
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g) || [];
    let pos = 0;

    function parseNum(): number {
        if (tokens[pos] === "(") {
            pos++; const val = parseAdd();
            pos++; return val; // consume ")"
        }
        return parseFloat(tokens[pos++] ?? "0");
    }
    function parseMul(): number {
        let val = parseNum();
        while (tokens[pos] === "*" || tokens[pos] === "/") {
            const op = tokens[pos++];
            val = op === "*" ? val * parseNum() : val / parseNum();
        }
        return val;
    }
    function parseAdd(): number {
        let val = parseMul();
        while (tokens[pos] === "+" || tokens[pos] === "-") {
            const op = tokens[pos++];
            val = op === "+" ? val + parseMul() : val - parseMul();
        }
        return val;
    }
    return parseAdd();
}

export default function CalculatorPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [display, setDisplay] = useState("0");
    const [expression, setExpression] = useState("");
    const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
    const [aiExplanation, setAiExplanation] = useState("");

    const explainMutation = useMutation({
        mutationFn: async (expr: string) => {
            const res = await apiRequest("POST", "/api/chat", {
                message: `Explain this math calculation step by step in a simple way: ${expr}. Be concise (3-4 lines max).`,
                personality: "teacher",
            });
            const data = await res.json();
            return data.response as string;
        },
        onSuccess: (data) => setAiExplanation(data),
        onError: () => toast({ title: "Could not get AI explanation", variant: "destructive" }),
    });

    const handleButton = (btn: string) => {
        if (btn === "C") { setDisplay("0"); setExpression(""); setAiExplanation(""); return; }
        if (btn === "⌫") {
            const nd = display.slice(0, -1) || "0";
            setDisplay(nd); setExpression(expression.slice(0, -1)); return;
        }
        if (btn === "±") { setDisplay(String(parseFloat(display) * -1)); return; }
        if (btn === "%") { setDisplay(String(parseFloat(display) / 100)); return; }
        if (btn === "=") {
            try {
                // Safe math evaluator — no eval()
                const expr = expression
                    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
                const result = String(safeEval(expr));
                setHistory(h => [{ expr: expression, result }, ...h.slice(0, 9)]);
                setDisplay(result);
                setExpression(result);
                setAiExplanation("");
                return;
            } catch { toast({ title: "Invalid expression", variant: "destructive" }); return; }
        }
        const op = { "×": "×", "÷": "÷", "+": "+", "−": "−" }[btn];
        if (op || !isNaN(Number(btn)) || btn === ".") {
            const newExpr = expression + btn;
            setExpression(newExpr);
            setDisplay(newExpr);
        }
    };


    const btnClass = (btn: string) => {
        if (btn === "=") return "bg-gradient-to-br from-saffron-500 to-india-green-500 text-white hover:opacity-90 font-bold text-xl";
        if (["÷", "×", "−", "+"].includes(btn)) return "bg-saffron-500/20 text-saffron-500 hover:bg-saffron-500/30 font-semibold";
        if (["C", "±", "%", "⌫"].includes(btn)) return "bg-muted/70 text-foreground hover:bg-muted";
        return "bg-muted/40 hover:bg-muted/60 text-foreground font-medium text-lg";
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

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-500 to-india-green-500 flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">AI Calculator</h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Calculator */}
                    <div className="space-y-4">
                        <Card className="p-5 glassmorphism border-0">
                            <div className="bg-muted/30 rounded-xl p-4 mb-4 text-right min-h-[80px] flex flex-col justify-end">
                                <div className="text-sm text-muted-foreground truncate">{expression || " "}</div>
                                <div className="text-4xl font-bold truncate">{display}</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {calcButtons.flat().map((btn, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleButton(btn)}
                                        className={`p-4 rounded-xl transition-all active:scale-95 ${btnClass(btn)} ${btn === "0" ? "" : ""}`}
                                    >
                                        {btn}
                                    </button>
                                ))}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => expression && explainMutation.mutate(expression)}
                                disabled={!expression || explainMutation.isPending}
                                className="mt-3 w-full gap-2 text-xs text-muted-foreground hover:text-saffron-500"
                            >
                                {explainMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                ✨ Explain this with AI
                            </Button>
                        </Card>

                        {/* AI Explanation */}
                        {aiExplanation && (
                            <Card className="p-4 glassmorphism border-0 border-l-4 border-l-saffron-500">
                                <p className="text-xs text-saffron-500 font-semibold mb-1">🤖 Swadesh AI Explains</p>
                                <p className="text-sm leading-relaxed">{aiExplanation}</p>
                            </Card>
                        )}
                    </div>

                    {/* History */}
                    <Card className="p-5 glassmorphism border-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">History</h2>
                            {history.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="h-7 text-xs gap-1 text-muted-foreground">
                                    <RotateCcw className="h-3 w-3" /> Clear
                                </Button>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <Calculator className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm">No calculations yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history.map((h, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                        onClick={() => { setDisplay(h.result); setExpression(h.result); }}>
                                        <span className="text-sm text-muted-foreground truncate">{h.expr}</span>
                                        <span className="text-sm font-bold text-saffron-500 ml-2">= {h.result}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
