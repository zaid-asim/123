import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CloudSun, Search, Loader2, MapPin, Thermometer, Wind, Droplets, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ToolActionFooter } from "@/components/tool-action-footer";

const indianCities = [
    { name: "New Delhi", state: "Delhi", emoji: "🏛️" },
    { name: "Mumbai", state: "Maharashtra", emoji: "🌊" },
    { name: "Bengaluru", state: "Karnataka", emoji: "💻" },
    { name: "Chennai", state: "Tamil Nadu", emoji: "🌴" },
    { name: "Kolkata", state: "West Bengal", emoji: "🎭" },
    { name: "Hyderabad", state: "Telangana", emoji: "🕌" },
    { name: "Jaipur", state: "Rajasthan", emoji: "🏰" },
    { name: "Ahmedabad", state: "Gujarat", emoji: "🏭" },
];

export default function WeatherTool() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [city, setCity] = useState("");
    const [result, setResult] = useState("");

    const weatherMutation = useMutation({
        mutationFn: async (cityName: string) => {
            const res = await apiRequest("POST", "/api/chat", {
                message: `Give me detailed weather information and climate insight for ${cityName}, India. Include: current season (it's February 2026), typical temperature range, what to wear, best activities, and any weather alerts. Format with clear sections using emoji icons. Be informative and helpful.`,
                personality: "friendly",
            });
            const data = await res.json();
            return data.response as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Failed to fetch weather info", variant: "destructive" }),
    });

    const handleSearch = (cityName: string) => {
        const searchCity = cityName || city.trim();
        if (!searchCity) return;
        setCity(searchCity);
        setResult("");
        weatherMutation.mutate(searchCity);
    };

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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                        <CloudSun className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient-tricolor">Weather AI</h1>
                </div>
                <p className="text-muted-foreground mb-8">
                    AI-powered weather insights and climate information for Indian cities.
                </p>

                {/* Search Bar */}
                <Card className="p-5 glassmorphism border-0 mb-6">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch(city)}
                                placeholder="Enter city name (e.g., Mumbai, Delhi, Bangalore)..."
                                className="pl-9 bg-background/50"
                                data-testid="input-city"
                            />
                        </div>
                        <Button
                            onClick={() => handleSearch(city)}
                            disabled={!city.trim() || weatherMutation.isPending}
                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                            data-testid="button-search-weather"
                        >
                            {weatherMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Quick City Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {indianCities.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => handleSearch(c.name)}
                            className={`p-3 rounded-lg glassmorphism border-0 text-left hover:bg-muted/50 transition-all group ${city === c.name ? "ring-2 ring-saffron-500" : ""
                                }`}
                            data-testid={`button-city-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                        >
                            <div className="text-xl mb-1">{c.emoji}</div>
                            <div className="font-medium text-sm group-hover:text-saffron-500 transition-colors">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.state}</div>
                        </button>
                    ))}
                </div>

                {/* Result Area */}
                {weatherMutation.isPending ? (
                    <Card className="p-10 glassmorphism border-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full tricolor-gradient-animated flex items-center justify-center">
                            <CloudSun className="h-7 w-7 text-white animate-pulse" />
                        </div>
                        <p className="text-muted-foreground">Fetching weather insights for {city}...</p>
                    </Card>
                ) : result ? (
                    <Card className="p-6 glassmorphism border-0">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-saffron-500" />
                            <h2 className="font-semibold">{city} — Weather & Climate</h2>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                            {result}
                        </div>
                        <ToolActionFooter content={result} title={`Weather in ${city}`} />
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-start gap-2">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Weather insights are AI-generated based on seasonal patterns and historical data. For real-time weather, please check IMD (India Meteorological Department) or a weather app.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-10 glassmorphism border-0 text-center text-muted-foreground">
                        <CloudSun className="h-14 w-14 mx-auto mb-4 opacity-30" />
                        <p>Select a city above or type any city to get AI-powered weather insights</p>
                    </Card>
                )}
            </main>
        </div>
    );
}
