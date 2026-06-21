import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings, getEngineDetails } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface PageHeaderProps {
  showBack?: boolean;
  onBackClick?: () => void;
  title?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

export function PageHeader({ 
  showBack = true, 
  onBackClick, 
  title, 
  rightElement,
  leftElement 
}: PageHeaderProps) {
  const [, navigate] = useLocation();
  const { settings } = useSettings();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate("/");
    }
  };

  const engine = getEngineDetails(settings);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border/40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {leftElement}
          {showBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <SwadeshLogo size="sm" animated={false} />
          {title && (
            <span className="font-semibold text-sm text-foreground/80 hidden sm:inline border-l border-border/50 pl-3">
              {title}
            </span>
          )}

          {/* Model status indicator with animated pulsing dot and tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm transition-all cursor-pointer hover:bg-muted/40",
                engine.bgClass
              )}
              onClick={() => navigate("/settings")}
              >
                <span className="relative flex h-2 w-2">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", engine.colorClass)}></span>
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", engine.colorClass)}></span>
                </span>
                <span>{engine.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px] p-3 text-xs glassmorphism border-border/60">
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full", engine.colorClass)} />
                  {engine.provider} Engine Active
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {engine.desc}
                </p>
                <div className="text-[10px] text-primary/70 font-semibold pt-1">
                  Click to manage engines in settings
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {rightElement}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
