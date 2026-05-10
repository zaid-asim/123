import { useLocation } from "wouter";
import {
  ArrowLeft, Moon, Sun, Volume2, Languages, Palette, Shield,
  User, Brain, ChevronRight, PlayCircle, Zap, MessageSquare, LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { useSettings } from "@/lib/settings-context";
import { useTheme } from "@/lib/theme-provider";
import { useTTS, type VoiceCategory } from "@/lib/tts-context";
import { cn } from "@/lib/utils";

const personalities = [
  { value: "formal", label: "Formal", description: "Professional and polished responses" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational tone" },
  { value: "professional", label: "Professional", description: "Business-focused responses" },
  { value: "teacher", label: "Teacher", description: "Educational and explanatory style" },
  { value: "dc-mode", label: "DC Mode", description: "Government-grade formal responses" },
];

const languages = [
  { value: "en", label: "English 🇬🇧" },
  { value: "hi", label: "Hindi 🇮🇳" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
  { value: "or", label: "Odia" },
  { value: "as", label: "Assamese" },
  { value: "ur", label: "Urdu" },
  { value: "ne", label: "Nepali" },
  { value: "sa", label: "Sanskrit" },
  { value: "kok", label: "Konkani" },
];

const wallpapers = [
  { value: "gradient", label: "Gradient", color: "from-saffron-500 via-white to-india-green-500" },
  { value: "peacock", label: "Peacock", color: "from-india-blue-500 to-india-green-500" },
  { value: "lotus", label: "Lotus", color: "from-pink-400 to-pink-600" },
  { value: "tricolor", label: "Tricolor", color: "from-saffron-500 via-white to-india-green-500" },
  { value: "mandala", label: "Mandala", color: "from-purple-500 to-saffron-500" },
];

const categoryLabels: Record<VoiceCategory, string> = {
  indian: "🇮🇳 Indian",
  female: "👩 Female",
  male: "👨 Male",
  other: "🌍 Other",
};

const categoryOrder: VoiceCategory[] = ["indian", "female", "male", "other"];

export default function Settings() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { categorizedVoices, selectedVoice, setSelectedVoice, previewVoice, voicePitch, setVoicePitch } = useTTS();

  const grouped = categoryOrder.reduce<Record<VoiceCategory, typeof categorizedVoices>>((acc, cat) => {
    acc[cat] = categorizedVoices.filter(cv => cv.category === cat);
    return acc;
  }, { indian: [], female: [], male: [], other: [] });

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
        <h1 className="text-3xl font-bold mb-8 text-gradient-tricolor">Advanced Control Center</h1>

        <div className="space-y-6">
          {/* Account */}
          <Card className="glassmorphism border-0 overflow-hidden">
            <button
              className="flex items-center gap-4 w-full p-5 hover:bg-muted/30 transition-colors"
              onClick={() => navigate("/account")}
              data-testid="button-account"
            >
              <div className="w-9 h-9 rounded-full bg-saffron-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-saffron-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Account</div>
                <div className="text-sm text-muted-foreground">Profile, switch account, sign out</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          {/* Swadesh AI Engine */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-saffron-500" />
              <h2 className="text-lg font-semibold">Swadesh AI Engine</h2>
            </div>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">AI Creativity</Label>
                <Select value={settings.aiCreativity} onValueChange={(v) => updateSettings({ aiCreativity: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precise">Precise & Factual</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="creative">Highly Creative</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Controls the randomness and imagination of responses.</p>
              </div>

              <div>
                <Label className="mb-2 block">Reasoning Depth</Label>
                <Select value={settings.aiReasoningDepth} onValueChange={(v) => updateSettings({ aiReasoningDepth: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick (Brief analysis)</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep (Extensive step-by-step)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Response Length</Label>
                <Select value={settings.aiResponseLength} onValueChange={(v) => updateSettings({ aiResponseLength: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Highly Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>Use Custom API Key (Gemini)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Override the default environment key.</p>
                  </div>
                  <Switch checked={settings.useCustomApiKey} onCheckedChange={c => updateSettings({ useCustomApiKey: c })} />
                </div>
                {settings.useCustomApiKey && (
                  <div className="animate-fade-in space-y-2 mb-4">
                    <Label>Gemini API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="AIzaSy..." 
                      value={settings.customApiKey}
                      onChange={(e) => updateSettings({ customApiKey: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">Your key is stored locally and sent securely.</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4 mt-6">
                  <div>
                    <Label>Use Groq Engine</Label>
                    <p className="text-xs text-muted-foreground mt-1">Switch from Gemini to Groq for ultra-fast generation.</p>
                  </div>
                  <Switch checked={settings.useGroq} onCheckedChange={c => updateSettings({ useGroq: c })} />
                </div>
                {settings.useGroq && (
                  <div className="animate-fade-in space-y-4">
                    <div>
                      <Label>Groq API Key</Label>
                      <Input 
                        type="password" 
                        placeholder="gsk_..." 
                        value={settings.groqApiKey}
                        onChange={(e) => updateSettings({ groqApiKey: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Groq Model</Label>
                      <Select value={settings.groqModel || "llama3-8b-8192"} onValueChange={(v) => updateSettings({ groqModel: v })}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                          <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                          <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                          <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Groq replaces Gemini for text generation when enabled.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* AI Personality */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-saffron-500" />
              <h2 className="text-lg font-semibold">AI Personality</h2>
            </div>
            <div className="space-y-3">
              {personalities.map(p => (
                <button
                  key={p.value}
                  onClick={() => updateSettings({ personality: p.value as any })}
                  className={cn("w-full p-4 rounded-md text-left transition-all bg-muted/50 hover:bg-muted", settings.personality === p.value && "ring-2 ring-primary bg-primary/10")}
                  data-testid={`button-personality-${p.value}`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Appearance */}
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
                <Switch checked={theme === "dark"} onCheckedChange={c => setTheme(c ? "dark" : "light")} data-testid="switch-dark-mode" />
              </div>
              
              <div>
                <Label className="mb-2 block">Wallpaper Theme</Label>
                <div className="grid grid-cols-5 gap-2">
                  {wallpapers.map(wp => (
                    <button
                      key={wp.value}
                      onClick={() => updateSettings({ wallpaper: wp.value as any })}
                      className={cn("h-12 rounded-md bg-gradient-to-br transition-all", wp.color, settings.wallpaper === wp.value && "ring-2 ring-primary ring-offset-2")}
                      title={wp.label}
                      data-testid={`button-wallpaper-${wp.value}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* UI Controls */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <LayoutTemplate className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold">UI Customization</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Font Size</Label>
                <Select value={settings.fontSize} onValueChange={(v) => updateSettings({ fontSize: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="base">Standard</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Glass Blur Intensity</Label>
                <Select value={settings.glassBlur} onValueChange={(v) => updateSettings({ glassBlur: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Blur</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High Blur</SelectItem>
                    <SelectItem value="ultra">Ultra Blur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Corner Rounding</Label>
                <Select value={settings.borderRadius} onValueChange={(v) => updateSettings({ borderRadius: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharp">Sharp Edges</SelectItem>
                    <SelectItem value="sm">Slightly Rounded</SelectItem>
                    <SelectItem value="md">Rounded</SelectItem>
                    <SelectItem value="lg">Extra Rounded</SelectItem>
                    <SelectItem value="pill">Pill</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Animation Speed</Label>
                <Select value={settings.animationSpeed} onValueChange={(v) => updateSettings({ animationSpeed: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Relaxed</SelectItem>
                    <SelectItem value="normal">Standard</SelectItem>
                    <SelectItem value="fast">Snappy</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Chat & Interaction */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Chat Behavior</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Press Enter to Send</Label>
                </div>
                <Switch checked={settings.enterToSend} onCheckedChange={c => updateSettings({ enterToSend: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-scroll to bottom</Label>
                </div>
                <Switch checked={settings.autoScroll} onCheckedChange={c => updateSettings({ autoScroll: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Timestamps</Label>
                </div>
                <Switch checked={settings.showTimestamps} onCheckedChange={c => updateSettings({ showTimestamps: c })} />
              </div>
            </div>
          </Card>

          {/* Voice & Audio */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-india-green-500" />
              <h2 className="text-lg font-semibold">Voice & Audio</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Text-to-Speech</Label>
                  <p className="text-sm text-muted-foreground">Enable voice reading of responses</p>
                </div>
                <Switch checked={settings.ttsEnabled} onCheckedChange={c => updateSettings({ ttsEnabled: c })} data-testid="switch-tts" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">UI interaction sounds</p>
                </div>
                <Switch checked={settings.soundEffectsEnabled} onCheckedChange={c => updateSettings({ soundEffectsEnabled: c })} />
              </div>

              <div>
                <Label className="mb-2 block">Speech Speed: {settings.ttsSpeed.toFixed(1)}x</Label>
                <Slider value={[settings.ttsSpeed]} onValueChange={([v]) => updateSettings({ ttsSpeed: v })} min={0.5} max={2} step={0.1} className="w-full" data-testid="slider-tts-speed" />
              </div>

              <div>
                <Label className="mb-2 block">Voice Pitch: {voicePitch.toFixed(1)}</Label>
                <Slider value={[voicePitch]} onValueChange={([v]) => setVoicePitch(v)} min={0.5} max={2} step={0.1} className="w-full" data-testid="slider-tts-pitch" />
              </div>

              {/* Voice Browser */}
              <div>
                <Label className="mb-3 block">Voice Selection</Label>
                {selectedVoice && (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedVoice.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedVoice.lang}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => previewVoice(selectedVoice)}>
                      <PlayCircle className="h-3.5 w-3.5 text-india-green-500" /> Preview
                    </Button>
                  </div>
                )}
                <ScrollArea className="h-52 rounded-md border border-border/50">
                  <div className="p-2 space-y-3">
                    {categoryOrder.map(cat => grouped[cat].length > 0 && (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{categoryLabels[cat]}</p>
                        {grouped[cat].map(({ voice }) => (
                          <div
                            key={voice.name}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                              selectedVoice?.name === voice.name && "bg-saffron-500/10 ring-1 ring-saffron-500/30"
                            )}
                            onClick={() => setSelectedVoice(voice)}
                            data-testid={`button-voice-${voice.name}`}
                          >
                            <div>
                              <p className="text-sm font-medium leading-tight">{voice.name}</p>
                              <p className="text-xs text-muted-foreground">{voice.lang}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs shrink-0" onClick={(e) => { e.stopPropagation(); previewVoice(voice); }}>
                              <PlayCircle className="h-3.5 w-3.5" /> Try
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                    {categorizedVoices.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-6">No voices available. Try a different browser.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label className="mb-2 block">Music Volume: {Math.round(settings.musicVolume * 100)}%</Label>
                <Slider value={[settings.musicVolume]} onValueChange={([v]) => updateSettings({ musicVolume: v })} min={0} max={1} step={0.05} className="w-full" data-testid="slider-music-volume" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Loop Music</Label>
                  <p className="text-sm text-muted-foreground">Repeat music continuously</p>
                </div>
                <Switch checked={settings.musicLoop} onCheckedChange={c => updateSettings({ musicLoop: c })} data-testid="switch-music-loop" />
              </div>
            </div>
          </Card>

          {/* Language */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Languages className="w-5 h-5 text-india-blue-500" />
              <h2 className="text-lg font-semibold">Language</h2>
            </div>
            <Select value={settings.language} onValueChange={v => updateSettings({ language: v as any })}>
              <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Card>

          {/* DC Mode */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-india-green-500" />
              <h2 className="text-lg font-semibold">DC Mode</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Activate DC Mode</Label>
                <p className="text-sm text-muted-foreground">Formally respond to government officials</p>
              </div>
              <Switch checked={settings.dcModeAuto} onCheckedChange={c => updateSettings({ dcModeAuto: c })} data-testid="switch-dc-mode" />
            </div>
          </Card>

          {/* Must Read Memory */}
          <Card className="p-6 glassmorphism border-0">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-saffron-500" />
              <h2 className="text-lg font-semibold">Must Read Memory</h2>
            </div>
            <div>
              <Label className="mb-2 block">Core Instructions</Label>
              <p className="text-sm text-muted-foreground mb-4">This context will be injected into every AI request to vastly improve memory.</p>
              <textarea 
                className="w-full p-3 rounded-md bg-background border border-border/50 text-sm"
                rows={4}
                value={settings.mustReadMemory || ""}
                onChange={(e) => updateSettings({ mustReadMemory: e.target.value })}
                placeholder="E.g., I am learning React. Explain things simply."
              />
            </div>
          </Card>

          {/* Memory Quick Link */}
          <Card className="glassmorphism border-0 overflow-hidden">
            <button
              className="flex items-center gap-4 w-full p-5 hover:bg-muted/30 transition-colors"
              onClick={() => navigate("/memory")}
              data-testid="button-goto-memory"
            >
              <div className="w-9 h-9 rounded-full bg-india-green-500/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-india-green-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Memory Manager</div>
                <div className="text-sm text-muted-foreground">Manage Swadesh AI's memory about you</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={resetSettings} className="text-destructive hover:text-destructive" data-testid="button-reset-settings">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
