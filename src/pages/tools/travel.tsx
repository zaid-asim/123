import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Loader2, Copy, CheckCircle, Plane, Mountain, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const popularDests = [
    { name: "Goa", emoji: "🏖️" }, { name: "Rajasthan", emoji: "🏰" },
    { name: "Kerala", emoji: "🌴" }, { name: "Kashmir", emoji: "🏔️" },
    { name: "Himachal Pradesh", emoji: "⛰️" }, { name: "Varanasi", emoji: "🛕" },
    { name: "Andaman Islands", emoji: "🐠" }, { name: "Ladakh", emoji: "🦁" },
    { name: "Agra (Taj Mahal)", emoji: "🕌" }, { name: "Munnar", emoji: "🍃" },
    { name: "Rann of Kutch", emoji: "🌅" }, { name: "Darjeeling", emoji: "🍵" },
];

export default function TravelPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [destination, setDestination] = useState("");
    const [duration, setDuration] = useState("3 days");
    const [budget, setBudget] = useState("moderate");
    const [interests, setInterests] = useState("culture, food, sightseeing");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const travelMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/travel", { destination, duration, budget, interests });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Failed to plan trip. Try again.", variant: "destructive" }),
    });

    const copyItinerary = () => {
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                        <Plane className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">AI Travel Planner</h1>
                        <p className="text-sm text-muted-foreground">Complete itineraries for any destination in India & worldwide</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="space-y-4">
                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Destination</label>
                                <Input
                                    value={destination}
                                    onChange={e => setDestination(e.target.value)}
                                    placeholder="e.g. Goa, Kashmir, Paris..."
                                    className="bg-background/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Duration</label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["1 day", "2 days", "3 days", "5 days", "7 days", "10 days", "2 weeks", "1 month"].map(d => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Budget</label>
                                <Select value={budget} onValueChange={setBudget}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="budget">💰 Budget (₹1,000–3,000/day)</SelectItem>
                                        <SelectItem value="moderate">💳 Moderate (₹3,000–8,000/day)</SelectItem>
                                        <SelectItem value="luxury">💎 Luxury (₹8,000+/day)</SelectItem>
                                        <SelectItem value="backpacker">🎒 Backpacker (Under ₹1,000)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Interests</label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {["Culture", "Food", "Adventure", "Nature", "History", "Shopping", "Spiritual", "Beach", "Trekking"].map(i => (
                                        <Badge
                                            key={i}
                                            variant={interests.toLowerCase().includes(i.toLowerCase()) ? "default" : "outline"}
                                            className="cursor-pointer text-xs hover:bg-saffron-500/20"
                                            onClick={() => {
                                                const list = interests.split(",").map(s => s.trim()).filter(Boolean);
                                                const idx = list.findIndex(l => l.toLowerCase() === i.toLowerCase());
                                                if (idx > -1) { list.splice(idx, 1); setInterests(list.join(", ")); }
                                                else { setInterests([...list, i].join(", ")); }
                                            }}
                                        >
                                            {i}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Button
                                onClick={() => travelMutation.mutate()}
                                disabled={!destination.trim() || travelMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 font-semibold"
                            >
                                {travelMutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Planning your trip...</>
                                    : <><Plane className="h-4 w-4 mr-2" />Plan My Trip</>}
                            </Button>
                        </Card>

                        {/* Popular destinations */}
                        <Card className="p-4 glassmorphism border-0">
                            <p className="text-xs font-semibold text-sky-500 mb-3 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Popular in India
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {popularDests.map(d => (
                                    <button
                                        key={d.name}
                                        className="p-2 rounded-lg text-xs text-left hover:bg-muted/50 transition-colors border border-border/30 hover:border-sky-500/50"
                                        onClick={() => setDestination(d.name)}
                                    >
                                        {d.emoji} {d.name}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-2">
                        {travelMutation.isPending ? (
                            <Card className="p-10 glassmorphism border-0 min-h-[500px] flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <Plane className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground">Planning your perfect trip to {destination}...</p>
                                <p className="text-xs text-muted-foreground">✈️ Finding hidden gems and local experiences</p>
                            </Card>
                        ) : result ? (
                            <Card className="p-6 glassmorphism border-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-sky-500" />
                                        <h3 className="font-semibold">Your Itinerary</h3>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={copyItinerary} className="gap-1 text-xs">
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
                                <Mountain className="h-16 w-16 mb-4 opacity-20" />
                                <p className="font-medium">Choose your destination</p>
                                <p className="text-sm mt-1">AI will create a complete day-by-day itinerary with local tips, food, accommodation & hidden gems</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
