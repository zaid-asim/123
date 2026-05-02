import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, RefreshCw, Loader2, TrendingUp, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToolActionFooter } from "@/components/tool-action-footer";

const currencies = [
    { code: "INR", label: "🇮🇳 Indian Rupee (₹)" },
    { code: "USD", label: "🇺🇸 US Dollar ($)" },
    { code: "EUR", label: "🇪🇺 Euro (€)" },
    { code: "GBP", label: "🇬🇧 British Pound (£)" },
    { code: "JPY", label: "🇯🇵 Japanese Yen (¥)" },
    { code: "AED", label: "🇦🇪 UAE Dirham" },
    { code: "SAR", label: "🇸🇦 Saudi Riyal" },
    { code: "CAD", label: "🇨🇦 Canadian Dollar" },
    { code: "AUD", label: "🇦🇺 Australian Dollar" },
    { code: "CNY", label: "🇨🇳 Chinese Yuan" },
    { code: "SGD", label: "🇸🇬 Singapore Dollar" },
    { code: "BDT", label: "🇧🇩 Bangladeshi Taka" },
];

export default function CurrencyPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [amount, setAmount] = useState("1000");
    const [from, setFrom] = useState("INR");
    const [to, setTo] = useState("USD");
    const [result, setResult] = useState<string>("");

    const convertMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/chat", {
                message: `Convert ${amount} ${from} to ${to}. Provide: 1) The converted amount with current approximate exchange rate (as of early 2026), 2) Brief context about both currencies, 3) Tips for currency exchange from India. Format clearly and mention this is an approximate rate.`,
                personality: "friendly",
            });
            const data = await res.json();
            return data.response as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Conversion failed", variant: "destructive" }),
    });

    const swap = () => { const t = from; setFrom(to); setTo(t); setResult(""); };

    const quickConvert = [
        { label: "₹1,000 → USD", from: "INR", to: "USD", amount: "1000" },
        { label: "₹10,000 → EUR", from: "INR", to: "EUR", amount: "10000" },
        { label: "$100 → INR", from: "USD", to: "INR", amount: "100" },
        { label: "£50 → INR", from: "GBP", to: "INR", amount: "50" },
    ];

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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">Currency Converter</h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Card className="p-6 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Amount</label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="text-xl font-bold bg-background/50 h-12"
                                    placeholder="Enter amount..."
                                />
                            </div>
                            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">From</label>
                                    <Select value={from} onValueChange={v => { setFrom(v); setResult(""); }}>
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <Button variant="ghost" size="icon" onClick={swap} className="mt-5 h-11 w-11 rounded-full hover:bg-saffron-500/10">
                                    <ArrowRightLeft className="h-4 w-4 text-saffron-500" />
                                </Button>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">To</label>
                                    <Select value={to} onValueChange={v => { setTo(v); setResult(""); }}>
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                onClick={() => convertMutation.mutate()}
                                disabled={!amount || convertMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-india-green-500 hover:opacity-90"
                            >
                                {convertMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Converting...</> : <><RefreshCw className="h-4 w-4 mr-2" />Convert</>}
                            </Button>
                        </Card>

                        {/* Quick Convert */}
                        <Card className="p-5 glassmorphism border-0">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-saffron-500" /> Quick Convert
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {quickConvert.map(q => (
                                    <button key={q.label}
                                        className="p-3 rounded-lg bg-muted/40 hover:bg-muted/70 text-sm text-left transition-colors"
                                        onClick={() => { setFrom(q.from); setTo(q.to); setAmount(q.amount); setResult(""); convertMutation.mutate(); }}>
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Result */}
                    <Card className="p-6 glassmorphism border-0 min-h-[300px]">
                        {convertMutation.isPending ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <div className="w-12 h-12 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground">Fetching exchange rate...</p>
                            </div>
                        ) : result ? (
                            <div>
                                <h3 className="font-semibold mb-3 text-india-green-500">Conversion Result</h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                    {result}
                                </div>
                                <ToolActionFooter content={result} title={`Currency Conversion`} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                                <DollarSign className="h-12 w-12 mb-3 opacity-30" />
                                <p>Enter an amount and select currencies to convert</p>
                                <p className="text-xs mt-1">AI-powered with approximate exchange rates</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
