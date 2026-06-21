import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogoFull } from "@/components/swadesh-logo";
import { ArrowRight, Plus, X, Brain, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const [, navigate] = useLocation();
  const [memories, setMemories] = useState<string[]>([""]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMemoryMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/memories", { content, category: "general" });
    },
  });

  const completeSetupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/setup", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    },
  });

  const addMemoryField = () => {
    setMemories([...memories, ""]);
  };

  const removeMemoryField = (index: number) => {
    if (memories.length > 1) {
      setMemories(memories.filter((_, i) => i !== index));
    }
  };

  const updateMemory = (index: number, value: string) => {
    const updated = [...memories];
    updated[index] = value;
    setMemories(updated);
  };

  const handleComplete = async () => {
    const validMemories = memories.filter(m => m.trim());
    
    try {
      for (const memory of validMemories) {
        await saveMemoryMutation.mutateAsync(memory.trim());
      }
      await completeSetupMutation.mutateAsync();
      toast({
        title: "Setup Complete",
        description: "Your memories have been saved. Welcome to Swadesh AI!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async () => {
    try {
      await completeSetupMutation.mutateAsync();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <ParticleBackground />
      
      <Card className="w-full max-w-2xl relative z-10 border-saffron-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <SwadeshLogoFull />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-saffron-500" />
            Welcome to Swadesh AI
          </CardTitle>
          <CardDescription className="text-base">
            Let me get to know you better! Add some things you'd like me to remember about you.
            This helps me give you more personalized responses.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Things for me to remember (e.g., "My name is...", "I work as...", "I prefer...")</span>
            </div>
            
            {memories.map((memory, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={memory}
                  onChange={(e) => updateMemory(index, e.target.value)}
                  placeholder={`Memory ${index + 1}: e.g., "I am a student studying Computer Science"`}
                  className="min-h-[80px] resize-none"
                  data-testid={`input-memory-${index}`}
                />
                {memories.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemoryField(index)}
                    className="shrink-0"
                    data-testid={`button-remove-memory-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addMemoryField}
              className="w-full gap-2"
              data-testid="button-add-memory"
            >
              <Plus className="h-4 w-4" />
              Add Another Memory
            </Button>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
              disabled={completeSetupMutation.isPending}
              data-testid="button-skip-setup"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 gap-2 bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
              disabled={saveMemoryMutation.isPending || completeSetupMutation.isPending}
              data-testid="button-complete-setup"
            >
              {saveMemoryMutation.isPending || completeSetupMutation.isPending ? "Saving..." : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
