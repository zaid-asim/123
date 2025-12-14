import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useTTS } from "@/lib/tts-context";
import { useSettings } from "@/lib/settings-context";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function VoiceOperations() {
  const [, navigate] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const recognitionRef = useRef<any>(null);
  const { speak, stop, isSpeaking } = useTTS();
  const { settings } = useSettings();

  const voiceMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        message: text,
        personality: settings.personality,
        context: "voice",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data.response);
      if (settings.ttsEnabled) {
        speak(data.response);
      }
    },
  });

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = settings.language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      setTranscript(text);
      
      if (result.isFinal) {
        voiceMutation.mutate(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stop();
    };
  }, [stop]);

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
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

      <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4 relative z-10">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold text-gradient-tricolor mb-8">Voice Assistant</h1>

          <div className="relative mb-8">
            <div className={cn(
              "w-40 h-40 mx-auto rounded-full flex items-center justify-center transition-all duration-300",
              isListening 
                ? "tricolor-gradient-animated animate-pulse-glow scale-110" 
                : "bg-muted"
            )}>
              <div className={cn(
                "w-36 h-36 rounded-full bg-background flex items-center justify-center transition-all",
                isListening && "bg-background/90"
              )}>
                <Button
                  size="icon"
                  className={cn(
                    "w-24 h-24 rounded-full transition-all",
                    isListening 
                      ? "bg-destructive hover:bg-destructive/90" 
                      : "bg-gradient-to-br from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
                  )}
                  onClick={isListening ? stopListening : startListening}
                  data-testid="button-voice"
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </Button>
              </div>
            </div>
            
            {isListening && (
              <div className="absolute -inset-4 rounded-full border-2 border-saffron-500/50 animate-ping" />
            )}
          </div>

          <p className="text-muted-foreground mb-8">
            {isListening ? "Listening... Speak now" : "Tap the microphone to start"}
          </p>

          {transcript && (
            <Card className="p-4 glassmorphism border-0 mb-4 animate-slide-up">
              <p className="text-sm text-muted-foreground mb-1">You said:</p>
              <p className="text-lg">{transcript}</p>
            </Card>
          )}

          {voiceMutation.isPending && (
            <Card className="p-4 glassmorphism border-0 mb-4 animate-slide-up">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-saffron-500" />
                <span className="text-muted-foreground">Processing...</span>
              </div>
            </Card>
          )}

          {response && (
            <Card className="p-6 glassmorphism border-0 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full tricolor-gradient flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-muted-foreground mb-1">Swadesh AI:</p>
                  <p className="whitespace-pre-wrap">{response}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isSpeaking ? stop() : speak(response)}
                      className="gap-1"
                      data-testid="button-speak"
                    >
                      {isSpeaking ? (
                        <><VolumeX className="w-4 h-4" /> Stop</>
                      ) : (
                        <><Volume2 className="w-4 h-4" /> Listen</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {["What's the weather?", "Tell me a fact", "Set a reminder", "Translate to Hindi"].map((cmd) => (
              <Button
                key={cmd}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTranscript(cmd);
                  voiceMutation.mutate(cmd);
                }}
                className="text-xs"
                data-testid={`button-cmd-${cmd.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {cmd}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
