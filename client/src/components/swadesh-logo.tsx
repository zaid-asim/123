import { cn } from "@/lib/utils";

interface SwadeshLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

export function SwadeshLogo({ size = "md", animated = true, className }: SwadeshLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className={cn(
          "relative rounded-full flex items-center justify-center",
          sizeClasses[size],
          animated && "animate-pulse-glow"
        )}
      >
        <div className="absolute inset-0 rounded-full tricolor-gradient-animated opacity-80" />
        <div className="absolute inset-1 rounded-full bg-background/90 dark:bg-background/80 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className={cn("w-3/4 h-3/4", animated && "animate-spin-slow")}
            style={{ animationDuration: "20s" }}
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(24, 95%, 55%)" />
                <stop offset="50%" stopColor="hsl(220, 70%, 55%)" />
                <stop offset="100%" stopColor="hsl(145, 63%, 45%)" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="url(#logoGradient)"
              strokeWidth="3"
              strokeDasharray="10 5"
            />
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="url(#logoGradient)"
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="8" fill="url(#logoGradient)" />
            <path
              d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z"
              fill="url(#logoGradient)"
              opacity="0.3"
            />
          </svg>
        </div>
        {animated && (
          <>
            <div className="absolute -inset-1 rounded-full bg-saffron/20 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute -inset-2 rounded-full bg-india-green/10 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
          </>
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn(
          "font-bold text-gradient-tricolor",
          textSizeClasses[size]
        )}>
          SWADESH AI
        </span>
        <span className="text-[10px] text-muted-foreground tracking-wider">
          BUILT IN INDIA
        </span>
      </div>
    </div>
  );
}

export function SwadeshLogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full tricolor-gradient-animated animate-pulse-glow" />
        <div className="absolute inset-2 rounded-full bg-background/95 dark:bg-background/90 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4 animate-spin-slow"
            style={{ animationDuration: "30s" }}
          >
            <defs>
              <linearGradient id="logoGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(24, 95%, 55%)" />
                <stop offset="33%" stopColor="hsl(0, 0%, 100%)" />
                <stop offset="66%" stopColor="hsl(145, 63%, 45%)" />
                <stop offset="100%" stopColor="hsl(220, 70%, 55%)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#logoGradientFull)"
              strokeWidth="2"
              strokeDasharray="15 8"
              filter="url(#glow)"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="url(#logoGradientFull)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke="url(#logoGradientFull)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <circle cx="50" cy="50" r="10" fill="url(#logoGradientFull)" filter="url(#glow)" />
            <g>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <circle
                  key={i}
                  cx={50 + 35 * Math.cos((angle * Math.PI) / 180)}
                  cy={50 + 35 * Math.sin((angle * Math.PI) / 180)}
                  r="3"
                  fill={i % 3 === 0 ? "hsl(24, 95%, 55%)" : i % 3 === 1 ? "hsl(0, 0%, 100%)" : "hsl(145, 63%, 45%)"}
                />
              ))}
            </g>
          </svg>
        </div>
        <div className="absolute -inset-4 rounded-full border border-saffron/30 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute -inset-8 rounded-full border border-india-green/20 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient-tricolor tracking-tight">
          SWADESH AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1 tracking-widest">
          BUILT IN INDIA • FOR THE WORLD
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Created by Zaid Asim
        </p>
      </div>
    </div>
  );
}
