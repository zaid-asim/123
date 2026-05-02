import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, User, Mail, LogOut, RefreshCw, Brain,
    Settings, Shield, ChevronRight, Loader2, Clock, Star, Sparkles, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/lib/guest-context";
import type { User as UserType } from "@shared/schema";

interface ProfileData {
    user: UserType;
    memoriesCount: number;
}

export default function AccountPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [memberSince, setMemberSince] = useState("");
    const { isGuest } = useAuth();
    const { disableGuest } = useGuestMode();

    const { data: profile, isLoading } = useQuery<ProfileData>({
        queryKey: ["/api/auth/profile"],
        retry: false,
        enabled: !isGuest,
    });

    useEffect(() => {
        if (profile?.user?.createdAt) {
            const date = new Date(profile.user.createdAt);
            setMemberSince(date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
        }
    }, [profile]);

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("GET", "/api/auth/logout");
        },
        onSuccess: () => {
            queryClient.clear();
            toast({ title: "Signed out successfully" });
            window.location.href = "/";
        },
        onError: () => {
            toast({ title: "Failed to sign out", variant: "destructive" });
        },
    });

    const user = profile?.user;
    const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "SA";
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Swadesh User";

    // ── Guest mode UI ─────────────────────────────────────
    if (isGuest) {
        return (
            <div className="min-h-screen bg-background relative">
                <ParticleBackground />
                <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
                            <SwadeshLogo size="sm" animated={false} />
                        </div>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl relative z-10">
                    <h1 className="text-3xl font-bold mb-8 text-gradient-tricolor">My Account</h1>
                    <Card className="p-8 glassmorphism border-0 text-center space-y-5">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-saffron-500 to-india-green-500 flex items-center justify-center mx-auto">
                            <User className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Guest User</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Using Swadesh AI in guest mode</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-left">
                            {[
                                "✅ All 23 AI tools available",
                                "✅ AI Chat & Voice",
                                "✅ OCR, Recipe, Travel, Health",
                                "✅ Resume & Grammar AI",
                                "❌ Memories not saved",
                                "❌ No sync across devices",
                            ].map(item => (
                                <div key={item} className="p-3 rounded-lg bg-muted/30">{item}</div>
                            ))}
                        </div>
                        <Button
                            className="w-full h-12 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:opacity-90 font-semibold gap-2"
                            onClick={() => { disableGuest(); window.location.href = "/api/login"; }}
                        >
                            <LogIn className="h-5 w-5" />
                            Sign In to Unlock Full Features
                        </Button>
                        <p className="text-xs text-muted-foreground">Free forever · Sign in with Google</p>
                    </Card>
                </main>
            </div>
        );
    }

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

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl relative z-10">
                <h1 className="text-3xl font-bold mb-8 text-gradient-tricolor">My Account</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-saffron-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <Card className="p-6 glassmorphism border-0">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                <Avatar className="h-20 w-20 ring-4 ring-saffron-500/30">
                                    <AvatarImage src={user?.profileImageUrl || ""} alt={fullName} />
                                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-saffron-500 to-india-green-500 text-white">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold">{fullName}</h2>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm">{user?.email || "No email on file"}</span>
                                    </div>
                                    {memberSince && (
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">Member since {memberSince}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                                        <Badge className="bg-saffron-500/20 text-saffron-600 dark:text-saffron-400 hover:bg-saffron-500/30">
                                            <Star className="h-3 w-3 mr-1" />
                                            Swadesh Member
                                        </Badge>
                                        <Badge variant="outline">Built in India</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-5 glassmorphism border-0 text-center">
                                <div className="text-3xl font-bold text-saffron-500">{profile?.memoriesCount ?? 0}</div>
                                <div className="text-sm text-muted-foreground mt-1">Memories Saved</div>
                            </Card>
                            <Card className="p-5 glassmorphism border-0 text-center">
                                <div className="text-3xl font-bold text-india-green-500">∞</div>
                                <div className="text-sm text-muted-foreground mt-1">AI Chats</div>
                            </Card>
                        </div>

                        {/* Quick Links */}
                        <Card className="glassmorphism border-0 divide-y divide-border/50">
                            <button
                                className="flex items-center gap-4 w-full p-4 hover:bg-muted/50 transition-colors"
                                onClick={() => navigate("/memory")}
                                data-testid="button-goto-memory"
                            >
                                <div className="w-9 h-9 rounded-full bg-saffron-500/10 flex items-center justify-center">
                                    <Brain className="h-5 w-5 text-saffron-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Memory Manager</div>
                                    <div className="text-sm text-muted-foreground">Manage what Swadesh AI remembers</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button
                                className="flex items-center gap-4 w-full p-4 hover:bg-muted/50 transition-colors"
                                onClick={() => navigate("/settings")}
                                data-testid="button-goto-settings"
                            >
                                <div className="w-9 h-9 rounded-full bg-india-green-500/10 flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-india-green-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Settings</div>
                                    <div className="text-sm text-muted-foreground">Themes, personality, voices and more</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </Card>

                        <Separator className="opacity-30" />

                        {/* Account Actions */}
                        <Card className="p-5 glassmorphism border-0 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-india-green-500" />
                                Account Actions
                            </h3>

                            <Button
                                variant="outline"
                                className="w-full gap-2 justify-start"
                                onClick={() => {
                                    queryClient.clear();
                                    window.location.href = "/api/login";
                                }}
                                data-testid="button-switch-account"
                            >
                                <RefreshCw className="h-4 w-4 text-saffron-500" />
                                Switch Account
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full gap-2 justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => logoutMutation.mutate()}
                                disabled={logoutMutation.isPending}
                                data-testid="button-sign-out"
                            >
                                {logoutMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="h-4 w-4" />
                                )}
                                Sign Out
                            </Button>
                        </Card>

                        <p className="text-center text-xs text-muted-foreground">
                            Swadesh AI • Created by Zaid Asim • Built in India 🇮🇳
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
