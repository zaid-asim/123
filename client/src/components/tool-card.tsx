import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient?: "saffron" | "green" | "blue" | "purple";
  testId?: string;
}

export function ToolCard({ title, description, icon: Icon, onClick, gradient = "saffron", testId }: ToolCardProps) {
  const gradientClasses = {
    saffron: "from-saffron-500/10 to-saffron-600/5 hover:from-saffron-500/20 hover:to-saffron-600/10 border-saffron-500/20",
    green: "from-india-green-500/10 to-india-green-600/5 hover:from-india-green-500/20 hover:to-india-green-600/10 border-india-green-500/20",
    blue: "from-india-blue-500/10 to-india-blue-600/5 hover:from-india-blue-500/20 hover:to-india-blue-600/10 border-india-blue-500/20",
    purple: "from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 border-purple-500/20",
  };

  const iconColors = {
    saffron: "text-saffron-500",
    green: "text-india-green-500",
    blue: "text-india-blue-500",
    purple: "text-purple-500",
  };

  const glowClasses = {
    saffron: "neon-glow-saffron",
    green: "neon-glow-green",
    blue: "neon-glow-blue",
    purple: "shadow-[0_0_20px_hsl(280,65%,55%/0.3)]",
  };

  return (
    <div
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "relative cursor-pointer transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:-translate-y-1",
        "group overflow-visible"
      )}
    >
      {/* Outer neon glow shadow (visible outside card boundary) */}
      <div className={cn(
        "absolute inset-0.5 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-md pointer-events-none z-0",
        glowClasses[gradient]
      )} />

      {/* Inner card with overflow-hidden to clip the shining sweep animation */}
      <Card className={cn(
        "relative z-10 w-full h-full overflow-hidden p-6 border bg-gradient-to-br shining-hover transition-colors duration-300",
        gradientClasses[gradient]
      )}>
        <div className="relative z-20 flex flex-col gap-3">
          <div className={cn(
            "w-12 h-12 rounded-md flex items-center justify-center",
            "bg-background/50 dark:bg-background/30",
            "transition-transform duration-300 group-hover:scale-110"
          )}>
            <Icon className={cn("w-6 h-6", iconColors[gradient])} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
