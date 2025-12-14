import { useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Music as MusicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useMusic } from "@/lib/music-context";
import { cn } from "@/lib/utils";

export default function Music() {
  const [, navigate] = useLocation();
  const {
    isPlaying,
    volume,
    loop,
    currentTrack,
    duration,
    currentTime,
    play,
    pause,
    toggle,
    setVolume,
    setLoop,
    loadTrack,
    seek,
  } = useMusic();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "audio/mpeg" || file.type === "audio/ogg" || file.type === "audio/mp3")) {
      loadTrack(file);
    }
  }, [loadTrack]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <ParticleBackground />
      
      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SwadeshLogo size="sm" animated={false} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4 relative z-10">
        <Card className="w-full max-w-md p-8 glassmorphism border-0">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full tricolor-gradient-animated flex items-center justify-center">
              <div className={cn(
                "w-28 h-28 rounded-full bg-background/90 flex items-center justify-center",
                isPlaying && "animate-spin-slow"
              )} style={{ animationDuration: "3s" }}>
                <MusicIcon className="w-12 h-12 text-saffron-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gradient-tricolor">Music Control</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTrack || "No track loaded"}
            </p>
          </div>

          {!currentTrack ? (
            <div className="text-center">
              <label htmlFor="music-upload" className="cursor-pointer">
                <Card className="p-8 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    Upload your background music
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Supports MP3 and OGG formats
                  </p>
                </Card>
                <input
                  id="music-upload"
                  type="file"
                  accept=".mp3,.ogg,audio/mpeg,audio/ogg"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-music-upload"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <Slider
                  value={[currentTime]}
                  onValueChange={([val]) => seek(val)}
                  max={duration || 100}
                  step={1}
                  className="w-full"
                  data-testid="slider-seek"
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seek(0)}
                  data-testid="button-restart"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-saffron-500 to-india-green-500 hover:from-saffron-600 hover:to-india-green-600"
                  onClick={toggle}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seek(duration)}
                  data-testid="button-skip"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={([val]) => setVolume(val)}
                    max={1}
                    step={0.05}
                    className="w-full"
                    data-testid="slider-volume"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                    <Label>Loop</Label>
                  </div>
                  <Switch
                    checked={loop}
                    onCheckedChange={setLoop}
                    data-testid="switch-loop"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <label htmlFor="music-upload-change" className="cursor-pointer">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Change Track
                    </span>
                  </Button>
                  <input
                    id="music-upload-change"
                    type="file"
                    accept=".mp3,.ogg,audio/mpeg,audio/ogg"
                    className="hidden"
                    onChange={handleFileUpload}
                    data-testid="input-music-change"
                  />
                </label>
              </div>
            </div>
          )}
        </Card>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground">
        <p>Swadesh AI • Music auto-pauses during voice responses</p>
      </footer>
    </div>
  );
}
