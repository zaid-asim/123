import { useState, useEffect } from "react";
import { SwadeshLogoFull } from "@/components/swadesh-logo";
import { cn } from "@/lib/utils";

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if we already showed the welcome screen in this session
    const hasSeenWelcome = sessionStorage.getItem("swadesh-welcome-seen");
    
    if (hasSeenWelcome) {
      setIsVisible(false);
      return;
    }

    sessionStorage.setItem("swadesh-welcome-seen", "true");

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Completely remove from DOM after 2.5 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="animate-slide-up flex flex-col items-center">
        <SwadeshLogoFull className="scale-125 mb-8" />
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-8">
          <div className="h-full bg-gradient-to-r from-saffron-500 via-white to-india-green-500 animate-loading-bar" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Initializing AI Models...</p>
      </div>
    </div>
  );
}
