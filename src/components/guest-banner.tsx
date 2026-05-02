import { useLocation } from "wouter";
import { useGuestMode } from "@/lib/guest-context";
import { Button } from "@/components/ui/button";
import { UserCircle, LogIn, X } from "lucide-react";
import { useState } from "react";

export function GuestBanner() {
    const [, navigate] = useLocation();
    const { disableGuest } = useGuestMode();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleSignIn = () => {
        disableGuest();
        window.location.href = "/api/login";
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-gradient-to-r from-saffron-500/90 to-india-green-500/90 backdrop-blur-sm border-t border-white/10">
            <div className="container mx-auto flex items-center justify-between gap-3 max-w-4xl">
                <div className="flex items-center gap-2 min-w-0">
                    <UserCircle className="h-4 w-4 text-white shrink-0" />
                    <p className="text-white text-sm font-medium truncate">
                        <span className="hidden sm:inline">You're in Guest Mode — </span>
                        Sign in to save memories &amp; sync across devices
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        className="h-8 bg-white text-saffron-600 hover:bg-white/90 font-semibold gap-1.5 text-xs"
                        onClick={handleSignIn}
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        Sign In
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={() => setDismissed(true)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
