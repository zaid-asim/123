import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, UtensilsCrossed, Loader2, Copy, CheckCircle, ChefHat } from "lucide-react";
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

const popularDishes = [
    "Butter Chicken", "Biryani", "Palak Paneer", "Dal Makhani",
    "Chole Bhature", "Masala Dosa", "Gulab Jamun", "Samosa",
    "Rajma Chawal", "Pav Bhaji", "Khichdi", "Aloo Paratha",
];

export default function RecipePage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [query, setQuery] = useState("");
    const [dietary, setDietary] = useState("any");
    const [cuisine, setCuisine] = useState("Indian");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const recipeMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/recipe", { query, dietary, cuisine });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Failed to generate recipe. Try again.", variant: "destructive" }),
    });

    const copyRecipe = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">AI Recipe Chef</h1>
                        <p className="text-sm text-muted-foreground">Get detailed recipes with ingredients, steps & nutrition info</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Search Panel */}
                    <div className="space-y-4">
                        <Card className="p-5 glassmorphism border-0 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Dish or Ingredient</label>
                                <Input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && query.trim() && recipeMutation.mutate()}
                                    placeholder="e.g. Butter Chicken, Paneer..."
                                    className="bg-background/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Dietary Preference</label>
                                <Select value={dietary} onValueChange={setDietary}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">🍽️ Any</SelectItem>
                                        <SelectItem value="vegetarian">🥦 Vegetarian</SelectItem>
                                        <SelectItem value="vegan">🌱 Vegan</SelectItem>
                                        <SelectItem value="non-vegetarian">🍗 Non-Vegetarian</SelectItem>
                                        <SelectItem value="jain">🙏 Jain (No root veggies)</SelectItem>
                                        <SelectItem value="diabetic-friendly">💊 Diabetic Friendly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cuisine</label>
                                <Select value={cuisine} onValueChange={setCuisine}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Indian">🇮🇳 Indian</SelectItem>
                                        <SelectItem value="North Indian">🏔️ North Indian</SelectItem>
                                        <SelectItem value="South Indian">🌴 South Indian</SelectItem>
                                        <SelectItem value="Bengali">🐟 Bengali</SelectItem>
                                        <SelectItem value="Gujarati">🫙 Gujarati</SelectItem>
                                        <SelectItem value="Mughlai">👑 Mughlai</SelectItem>
                                        <SelectItem value="Chinese">🥢 Chinese (Desi Style)</SelectItem>
                                        <SelectItem value="Street Food">🛺 Street Food</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={() => recipeMutation.mutate()}
                                disabled={!query.trim() || recipeMutation.isPending}
                                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 font-semibold"
                            >
                                {recipeMutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cooking up recipe...</>
                                    : <><ChefHat className="h-4 w-4 mr-2" />Get Recipe</>}
                            </Button>
                        </Card>

                        {/* Popular Dishes */}
                        <Card className="p-4 glassmorphism border-0">
                            <p className="text-xs font-semibold text-orange-500 mb-3">🔥 Popular Dishes</p>
                            <div className="flex flex-wrap gap-2">
                                {popularDishes.map(dish => (
                                    <Badge
                                        key={dish}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-orange-500/10 hover:border-orange-500 transition-all text-xs"
                                        onClick={() => { setQuery(dish); }}
                                    >
                                        {dish}
                                    </Badge>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Recipe Result */}
                    <div className="lg:col-span-2">
                        {recipeMutation.isPending ? (
                            <Card className="p-10 glassmorphism border-0 min-h-[500px] flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <ChefHat className="h-10 w-10 text-white animate-bounce" />
                                </div>
                                <p className="text-muted-foreground">Preparing your recipe...</p>
                                <p className="text-xs text-muted-foreground">🌶️ Adding spices and flavors...</p>
                            </Card>
                        ) : result ? (
                            <Card className="p-6 glassmorphism border-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="h-5 w-5 text-orange-500" />
                                        <h3 className="font-semibold">Your Recipe</h3>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={copyRecipe} className="gap-1 text-xs">
                                        {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        {copied ? "Copied!" : "Copy Recipe"}
                                    </Button>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-sm overflow-auto max-h-[600px]">
                                    {result}
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-10 glassmorphism border-0 min-h-[500px] flex flex-col items-center justify-center text-muted-foreground text-center">
                                <UtensilsCrossed className="h-16 w-16 mb-4 opacity-20" />
                                <p className="font-medium">Enter a dish name or ingredient</p>
                                <p className="text-sm mt-1">AI Chef will create a complete recipe with ingredients, steps & nutrition</p>
                                <p className="text-xs mt-3 text-saffron-500">🍛 Specializes in Indian cuisine</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
