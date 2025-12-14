import { useLocation } from "wouter";
import { ArrowLeft, Moon, Sun, Volume2, Languages, Palette, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useSettings } from "@/lib/settings-context";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

const personalities = [
  { value: "formal", label: "Formal", description: "Professional and polished responses" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational tone" },
  { value: "professional", label: "Professional", description: "Business-focused responses" },
  { value: "teacher", label: "Teacher", description: "Educational and explanatory style" },
  { value: "dc-mode", label: "DC Mode", description: "Government-grade formal responses" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
];

const wallpapers = [
  { value: "gradient", label: "Gradient", color: "from-saffron-500 via-white to-india-green-500" },
  { value: "peacock", label: "Peacock", color: "from-india-blue-500 to-india-green-500" },
  { value: "lotus", label: "Lotus", color: "from-pink-400 to-pink-600" },
  { value: "tricolor", label: "Tricolor", color: "from-saffron-500 via-white to-india-green-500" },
  { value: "mandala", label: "Mandala", color: "from-purple-500 to-saffron-500" },
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background relative">
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

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl relative z-10">
        <h1 className="text-3xl font-bold mb-8 text-gradient-tricolor">Settings</h1>

        <div className="space-y-6">
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              {theme === "dark" ? <Moon className="w-5 h-5 text-india-blue-500" /> : <Sun className="w-5 h-5 text-saffron-500" />}
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  data-testid="switch-dark-mode"
                />
              </div>

              <div>
                <Label className="mb-2 block">Wallpaper Theme</Label>
                <div className="grid grid-cols-5 gap-2">
                  {wallpapers.map((wp) => (
                    <button
                      key={wp.value}
                      onClick={() => updateSettings({ wallpaper: wp.value as any })}
                      className={cn(
                        "h-12 rounded-md bg-gradient-to-br transition-all",
                        wp.color,
                        settings.wallpaper === wp.value && "ring-2 ring-primary ring-offset-2"
                      )}
                      data-testid={`button-wallpaper-${wp.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-india-green-500" />
              <h2 className="text-lg font-semibold">Voice & Audio</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Text-to-Speech</Label>
                  <p className="text-sm text-muted-foreground">Enable voice reading of responses</p>
                </div>
                <Switch
                  checked={settings.ttsEnabled}
                  onCheckedChange={(checked) => updateSettings({ ttsEnabled: checked })}
                  data-testid="switch-tts"
                />
              </div>

              <div>
                <Label className="mb-2 block">Speech Speed: {settings.ttsSpeed.toFixed(1)}x</Label>
                <Slider
                  value={[settings.ttsSpeed]}
                  onValueChange={([val]) => updateSettings({ ttsSpeed: val })}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-tts-speed"
                />
              </div>

              <div>
                <Label className="mb-2 block">Music Volume: {Math.round(settings.musicVolume * 100)}%</Label>
                <Slider
                  value={[settings.musicVolume]}
                  onValueChange={([val]) => updateSettings({ musicVolume: val })}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                  data-testid="slider-music-volume"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Loop Music</Label>
                  <p className="text-sm text-muted-foreground">Repeat music continuously</p>
                </div>
                <Switch
                  checked={settings.musicLoop}
                  onCheckedChange={(checked) => updateSettings({ musicLoop: checked })}
                  data-testid="switch-music-loop"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-saffron-500" />
              <h2 className="text-lg font-semibold">AI Personality</h2>
            </div>
            
            <div className="space-y-3">
              {personalities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateSettings({ personality: p.value as any })}
                  className={cn(
                    "w-full p-4 rounded-md text-left transition-all",
                    "bg-muted/50 hover:bg-muted",
                    settings.personality === p.value && "ring-2 ring-primary bg-primary/10"
                  )}
                  data-testid={`button-personality-${p.value}`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Languages className="w-5 h-5 text-india-blue-500" />
              <h2 className="text-lg font-semibold">Language</h2>
            </div>
            
            <Select
              value={settings.language}
              onValueChange={(val) => updateSettings({ language: val as any })}
            >
              <SelectTrigger data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-india-green-500" />
              <h2 className="text-lg font-semibold">DC Mode</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Activate DC Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically detect and enable formal mode for government officials
                </p>
              </div>
              <Switch
                checked={settings.dcModeAuto}
                onCheckedChange={(checked) => updateSettings({ dcModeAuto: checked })}
                data-testid="switch-dc-mode"
              />
            </div>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="text-destructive hover:text-destructive"
              data-testid="button-reset-settings"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
