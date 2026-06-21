import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Moon, Sun, Volume2, Languages, Palette, Shield,
  User, Brain, ChevronRight, PlayCircle, Zap, MessageSquare, LayoutTemplate,
  Eye, EyeOff, Loader2
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
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/queryClient";

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
  const { toast } = useToast();

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const [geminiInputKey, setGeminiInputKey] = useState(settings.customApiKey || "");
  const [groqInputKey, setGroqInputKey] = useState(settings.groqApiKey || "");
  const [openRouterInputKey, setOpenRouterInputKey] = useState(settings.openRouterApiKey || "");
  const [openAiInputKey, setOpenAiInputKey] = useState(settings.openAiApiKey || "");
  const [grokInputKey, setGrokInputKey] = useState(settings.grokApiKey || "");
  const [deepseekInputKey, setDeepseekInputKey] = useState(settings.deepseekApiKey || "");
  const [anthropicInputKey, setAnthropicInputKey] = useState(settings.anthropicApiKey || "");

  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isValidatingGroq, setIsValidatingGroq] = useState(false);
  const [isValidatingOpenRouter, setIsValidatingOpenRouter] = useState(false);
  const [isValidatingOpenAi, setIsValidatingOpenAi] = useState(false);
  const [isValidatingGrok, setIsValidatingGrok] = useState(false);
  const [isValidatingDeepseek, setIsValidatingDeepseek] = useState(false);
  const [isValidatingAnthropic, setIsValidatingAnthropic] = useState(false);

  const testAndSaveKey = async (opts: {
    endpoint: string;
    headerKey: string;
    headerModel?: string;
    inputKey: string;
    model: string;
    settingsKey: string;
    setValidating: (b: boolean) => void;
    providerName: string;
  }) => {
    const { endpoint, headerKey, headerModel, inputKey, model,
            settingsKey, setValidating, providerName } = opts;

    if (!inputKey.trim()) {
      toast({
        title: "Missing Key",
        description: `Please enter your ${providerName} API key first.`,
        variant: "destructive"
      });
      return;
    }
    setValidating(true);
    try {
      const headers: Record<string, string> = { [headerKey]: inputKey.trim() };
      if (headerModel) headers[headerModel] = model;
      const res = await fetch(getApiUrl(endpoint), { method: "POST", headers });
      const data = await res.json();
      if (res.ok && data.valid) {
        updateSettings({ [settingsKey]: inputKey.trim() } as any);
        toast({
          title: `✅ ${providerName} Key Saved`,
          description: "Key is valid and saved to your settings."
        });
      } else {
        toast({
          title: `❌ ${providerName} Validation Failed`,
          description: data.error || "Invalid key. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Network Error",
        description: err.message || "Could not reach validation server.",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

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

              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reasoning Engine Pipeline</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Route queries through a 7-pass verified reasoning loop to eliminate hallucinations and improve depth.
                    </p>
                  </div>
                  <Switch
                    checked={settings.useReasoningPipeline}
                    onCheckedChange={(c) => updateSettings({ useReasoningPipeline: c })}
                  />
                </div>

                {settings.useReasoningPipeline && (
                  <div className="pl-4 border-l border-primary/20 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show Confidence Badges</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Display computed trust indicators on AI responses.</p>
                      </div>
                      <Switch
                        checked={settings.showConfidence}
                        onCheckedChange={(c) => updateSettings({ showConfidence: c })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show Grounded Sources</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Show web links and source chips used for grounding.</p>
                      </div>
                      <Switch
                        checked={settings.showSources}
                        onCheckedChange={(c) => updateSettings({ showSources: c })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show Reasoning Traces</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Expose timeline breakdowns and critique audits.</p>
                      </div>
                      <Switch
                        checked={settings.showReasoningTrace}
                        onCheckedChange={(c) => updateSettings({ showReasoningTrace: c })}
                      />
                    </div>

                    <div>
                      <Label className="text-sm mb-1.5 block">Critic Strictness</Label>
                      <Select
                        value={settings.criticStrictness}
                        onValueChange={(v) => updateSettings({ criticStrictness: v as any })}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lenient">Lenient (Catch major errors)</SelectItem>
                          <SelectItem value="standard">Standard (Catch bias & logic leaps)</SelectItem>
                          <SelectItem value="strict">Strict (High-stakes precision review)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                {/* Gemini Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  (!settings.useGroq && !settings.useOpenRouter && !settings.useOpenAI && !settings.useGrok && !settings.useDeepSeek && !settings.useAnthropic)
                    ? "border-l-4 border-l-saffron-500 border-border bg-saffron-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">Google Gemini Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Use Google's multimodal models. Custom key is optional.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground mr-1">Custom Key:</span>
                      <Switch checked={settings.useCustomApiKey} onCheckedChange={c => updateSettings({ useCustomApiKey: c })} />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/20">
                    <Label className="text-xs">Gemini Model</Label>
                    <Select value={settings.geminiModel || "gemini-3.5-flash"} onValueChange={(v) => updateSettings({ geminiModel: v })}>
                      <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended)</SelectItem>
                        <SelectItem value="gemini-3.5-pro">Gemini 3.5 Pro (Reasoning)</SelectItem>
                        <SelectItem value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</SelectItem>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.useCustomApiKey && (
                    <div className="animate-fade-in space-y-3 pt-2 border-t border-border/20">
                      <Label htmlFor="gemini-api-key" className="text-xs">Gemini API Key</Label>
                      <div className="relative flex items-center">
                        <Input 
                          id="gemini-api-key"
                          type={showGeminiKey ? "text" : "password"} 
                          placeholder="AIzaSy..." 
                          value={geminiInputKey}
                          onChange={(e) => setGeminiInputKey(e.target.value)}
                          className="pr-10 h-9 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          title={showGeminiKey ? "Hide API key" : "Show API key"}
                        >
                          {showGeminiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!geminiInputKey.trim()) {
                              toast({
                                title: "Validation Error",
                                description: "Please enter a Gemini API key first.",
                                variant: "destructive",
                              });
                              return;
                            }
                            setIsValidatingKey(true);
                            try {
                              const res = await fetch("/api/test-key", {
                                method: "POST",
                                headers: {
                                  "x-gemini-api-key": geminiInputKey.trim()
                                }
                              });
                              if (res.ok) {
                                updateSettings({ customApiKey: geminiInputKey.trim() });
                                toast({
                                  title: "Key Validation Success",
                                  description: "Your Gemini API key is valid and has been saved.",
                                });
                              } else {
                                const errData = await res.json();
                                toast({
                                  title: "Key Validation Failed",
                                  description: errData.error || "The key could not be validated. Please check it and try again.",
                                  variant: "destructive",
                                });
                              }
                            } catch (err: any) {
                              toast({
                                title: "Network Error",
                                description: err.message || "Failed to contact the validation server.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsValidatingKey(false);
                            }
                          }}
                          disabled={isValidatingKey}
                          size="sm"
                          className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-medium flex items-center justify-center gap-1.5 h-8 text-xs"
                        >
                          {isValidatingKey ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            "Save & Test Key"
                          )}
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Stored locally in your browser context.</p>
                    </div>
                  )}
                </div>

                {/* Groq Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useGroq
                    ? "border-l-4 border-l-blue-500 border-border bg-blue-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">Groq Speed Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Ultra-fast token inference for instant responses.</p>
                    </div>
                    <Switch checked={settings.useGroq} onCheckedChange={c => updateSettings({ useGroq: c, useOpenRouter: false, useOpenAI: false, useGrok: false, useDeepSeek: false, useAnthropic: false })} />
                  </div>
                  {settings.useGroq && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="groq-api-key" className="text-xs">Groq API Key</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input 
                            id="groq-api-key"
                            type={showGroqKey ? "text" : "password"} 
                            placeholder="gsk_..." 
                            value={groqInputKey}
                            onChange={(e) => setGroqInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGroqKey(!showGroqKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            title={showGroqKey ? "Hide API key" : "Show API key"}
                          >
                            {showGroqKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Groq Model</Label>
                        <Select value={settings.groqModel || "llama-4-scout-17b-16e-instruct"} onValueChange={(v) => updateSettings({ groqModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="llama-4-scout-17b-16e-instruct">Llama 4 Scout (Recommended)</SelectItem>
                            <SelectItem value="llama-4-maverick-17b-128e-instruct">Llama 4 Maverick</SelectItem>
                            <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                            <SelectItem value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill Llama 70B</SelectItem>
                            <SelectItem value="compound">Compound (Agentic)</SelectItem>
                            <SelectItem value="llama3-8b-8192">Llama 3 8B (Legacy)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/groq",
                          headerKey: "x-groq-api-key",
                          headerModel: "x-groq-model",
                          inputKey: groqInputKey,
                          model: settings.groqModel || "llama-4-scout-17b-16e-instruct",
                          settingsKey: "groqApiKey",
                          setValidating: setIsValidatingGroq,
                          providerName: "Groq"
                        })}
                        disabled={isValidatingGroq}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 h-8 text-xs"
                      >
                        {isValidatingGroq ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</>
                        ) : (
                          "Save & Test Key"
                        )}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally in your browser context.</p>
                    </div>
                  )}
                </div>

                {/* OpenRouter Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useOpenRouter
                    ? "border-l-4 border-l-purple-500 border-border bg-purple-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">OpenRouter Universal Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Route to Claude, DeepSeek, Llama, and more.</p>
                    </div>
                    <Switch checked={settings.useOpenRouter} onCheckedChange={c => updateSettings({ useOpenRouter: c, useGroq: false, useOpenAI: false, useGrok: false, useDeepSeek: false, useAnthropic: false })} />
                  </div>
                  {settings.useOpenRouter && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="openrouter-api-key" className="text-xs">OpenRouter API Key</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input 
                            id="openrouter-api-key"
                            type={showOpenRouterKey ? "text" : "password"} 
                            placeholder="sk-or-v1-..." 
                            value={openRouterInputKey}
                            onChange={(e) => setOpenRouterInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            title={showOpenRouterKey ? "Hide API key" : "Show API key"}
                          >
                            {showOpenRouterKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">OpenRouter Model</Label>
                        <Select value={settings.openRouterModel || "google/gemini-3.5-flash"} onValueChange={(v) => updateSettings({ openRouterModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google/gemini-3.5-flash">Gemini 3.5 Flash (Recommended)</SelectItem>
                            <SelectItem value="google/gemini-3.5-pro">Gemini 3.5 Pro</SelectItem>
                            <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                            <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                            <SelectItem value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct</SelectItem>
                            <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                            <SelectItem value="deepseek/deepseek-chat">DeepSeek V3 (Chat)</SelectItem>
                            <SelectItem value="deepseek/deepseek-r1">DeepSeek R1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/openrouter",
                          headerKey: "x-openrouter-api-key",
                          headerModel: "x-openrouter-model",
                          inputKey: openRouterInputKey,
                          model: settings.openRouterModel || "google/gemini-2.5-flash",
                          settingsKey: "openRouterApiKey",
                          setValidating: setIsValidatingOpenRouter,
                          providerName: "OpenRouter"
                        })}
                        disabled={isValidatingOpenRouter}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center justify-center gap-1.5 h-8 text-xs"
                      >
                        {isValidatingOpenRouter ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</>
                        ) : (
                          "Save & Test Key"
                        )}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally in your browser context.</p>
                    </div>
                  )}
                </div>

                {/* OpenAI Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useOpenAI
                    ? "border-l-4 border-l-emerald-500 border-border bg-emerald-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">OpenAI Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        GPT-4o, GPT-4o-mini, o1, o3-mini and more.
                      </p>
                    </div>
                    <Switch
                      checked={settings.useOpenAI}
                      onCheckedChange={c => updateSettings({
                        useOpenAI: c, useGroq: false, useOpenRouter: false, useGrok: false, useDeepSeek: false, useAnthropic: false
                      })}
                    />
                  </div>
                  {settings.useOpenAI && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="openai-api-key" className="text-xs">OpenAI API Key</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input
                            id="openai-api-key"
                            type={showOpenAiKey ? "text" : "password"}
                            placeholder="sk-..."
                            value={openAiInputKey}
                            onChange={e => setOpenAiInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button type="button" onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showOpenAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">OpenAI Model</Label>
                        <Select value={settings.openAiModel || "gpt-5.5"} onValueChange={v => updateSettings({ openAiModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-5.5">GPT-5.5 (Flagship)</SelectItem>
                            <SelectItem value="gpt-5.4-thinking">GPT-5.4 Thinking (Reasoning)</SelectItem>
                            <SelectItem value="gpt-5.4-pro">GPT-5.4 Pro</SelectItem>
                            <SelectItem value="gpt-5.4-mini">GPT-5.4 Mini</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Legacy)</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="o1-mini">o1 Mini</SelectItem>
                            <SelectItem value="o3-mini">o3 Mini</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8 text-xs flex items-center justify-center gap-1.5"
                        disabled={isValidatingOpenAi}
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/openai",
                          headerKey: "x-openai-api-key",
                          headerModel: "x-openai-model",
                          inputKey: openAiInputKey,
                          model: settings.openAiModel || "gpt-5.5",
                          settingsKey: "openAiApiKey",
                          setValidating: setIsValidatingOpenAi,
                          providerName: "OpenAI"
                        })}
                      >
                        {isValidatingOpenAi ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</> : "Save & Test Key"}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally. Never sent to Swadesh servers.</p>
                    </div>
                  )}
                </div>

                {/* Grok (xAI) Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useGrok
                    ? "border-l-4 border-l-violet-500 border-border bg-violet-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">Grok Engine <span className="text-[10px] text-violet-400 ml-1">by xAI</span></Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Elon Musk's xAI — Grok-2, Grok-3, Grok Vision.
                      </p>
                    </div>
                    <Switch
                      checked={settings.useGrok}
                      onCheckedChange={c => updateSettings({
                        useGrok: c, useGroq: false, useOpenRouter: false, useOpenAI: false, useDeepSeek: false, useAnthropic: false
                      })}
                    />
                  </div>
                  {settings.useGrok && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="grok-api-key" className="text-xs">Grok API Key (xAI)</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input
                            id="grok-api-key"
                            type={showGrokKey ? "text" : "password"}
                            placeholder="xai-..."
                            value={grokInputKey}
                            onChange={e => setGrokInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button type="button" onClick={() => setShowGrokKey(!showGrokKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showGrokKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Grok Model</Label>
                        <Select value={settings.grokModel || "grok-4.3"} onValueChange={v => updateSettings({ grokModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grok-4.3">Grok-4.3 (Recommended)</SelectItem>
                            <SelectItem value="grok-4.20">Grok-4.20</SelectItem>
                            <SelectItem value="grok-2-1212">Grok-2</SelectItem>
                            <SelectItem value="grok-3-beta">Grok-3 Beta</SelectItem>
                            <SelectItem value="grok-3-mini-beta">Grok-3 Mini Beta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" size="sm"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium h-8 text-xs flex items-center justify-center gap-1.5"
                        disabled={isValidatingGrok}
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/grok",
                          headerKey: "x-grok-api-key",
                          headerModel: "x-grok-model",
                          inputKey: grokInputKey,
                          model: settings.grokModel || "grok-4.3",
                          settingsKey: "grokApiKey",
                          setValidating: setIsValidatingGrok,
                          providerName: "Grok (xAI)"
                        })}
                      >
                        {isValidatingGrok ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</> : "Save & Test Key"}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally. Never sent to Swadesh servers.</p>
                    </div>
                  )}
                </div>

                {/* DeepSeek Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useDeepSeek
                    ? "border-l-4 border-l-cyan-500 border-border bg-cyan-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">DeepSeek Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        State-of-the-art cost-effective models (DeepSeek V3 / R1).
                      </p>
                    </div>
                    <Switch
                      checked={settings.useDeepSeek}
                      onCheckedChange={c => updateSettings({
                        useDeepSeek: c, useGroq: false, useOpenRouter: false, useOpenAI: false, useGrok: false, useAnthropic: false
                      })}
                    />
                  </div>
                  {settings.useDeepSeek && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="deepseek-api-key" className="text-xs">DeepSeek API Key</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input
                            id="deepseek-api-key"
                            type={showDeepseekKey ? "text" : "password"}
                            placeholder="sk-..."
                            value={deepseekInputKey}
                            onChange={e => setDeepseekInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button type="button" onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showDeepseekKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">DeepSeek Model</Label>
                        <Select value={settings.deepseekModel || "deepseek-chat"} onValueChange={v => updateSettings({ deepseekModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deepseek-chat">DeepSeek Chat (V3 - Flagship)</SelectItem>
                            <SelectItem value="deepseek-reasoner">DeepSeek Reasoner (R1 - Reasoning)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" size="sm"
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium h-8 text-xs flex items-center justify-center gap-1.5"
                        disabled={isValidatingDeepseek}
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/deepseek",
                          headerKey: "x-deepseek-api-key",
                          headerModel: "x-deepseek-model",
                          inputKey: deepseekInputKey,
                          model: settings.deepseekModel || "deepseek-chat",
                          settingsKey: "deepseekApiKey",
                          setValidating: setIsValidatingDeepseek,
                          providerName: "DeepSeek"
                        })}
                      >
                        {isValidatingDeepseek ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</> : "Save & Test Key"}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally. Never sent to Swadesh servers.</p>
                    </div>
                  )}
                </div>

                {/* Anthropic Engine Block */}
                <div className={cn(
                  "p-4 rounded-lg border transition-all duration-300 bg-card/25 space-y-4",
                  settings.useAnthropic
                    ? "border-l-4 border-l-orange-500 border-border bg-orange-500/[0.02] shadow-sm"
                    : "border-border/40 opacity-70"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">Anthropic Engine</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Claude 3.5 Sonnet, Claude 3.5 Haiku, and more.
                      </p>
                    </div>
                    <Switch
                      checked={settings.useAnthropic}
                      onCheckedChange={c => updateSettings({
                        useAnthropic: c, useGroq: false, useOpenRouter: false, useOpenAI: false, useGrok: false, useDeepSeek: false
                      })}
                    />
                  </div>
                  {settings.useAnthropic && (
                    <div className="animate-fade-in space-y-4 pt-2 border-t border-border/20">
                      <div>
                        <Label htmlFor="anthropic-api-key" className="text-xs">Anthropic API Key</Label>
                        <div className="relative flex items-center mt-1.5">
                          <Input
                            id="anthropic-api-key"
                            type={showAnthropicKey ? "text" : "password"}
                            placeholder="sk-ant-..."
                            value={anthropicInputKey}
                            onChange={e => setAnthropicInputKey(e.target.value)}
                            className="pr-10 h-9 text-xs"
                          />
                          <button type="button" onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Anthropic Model</Label>
                        <Select value={settings.anthropicModel || "claude-3-5-sonnet-latest"} onValueChange={v => updateSettings({ anthropicModel: v })}>
                          <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Recommended)</SelectItem>
                            <SelectItem value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Fast)</SelectItem>
                            <SelectItem value="claude-3-5-opus-latest">Claude 3.5 Opus (Frontier)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-8 text-xs flex items-center justify-center gap-1.5"
                        disabled={isValidatingAnthropic}
                        onClick={() => testAndSaveKey({
                          endpoint: "/api/test-key/anthropic",
                          headerKey: "x-anthropic-api-key",
                          headerModel: "x-anthropic-model",
                          inputKey: anthropicInputKey,
                          model: settings.anthropicModel || "claude-3-5-sonnet-latest",
                          settingsKey: "anthropicApiKey",
                          setValidating: setIsValidatingAnthropic,
                          providerName: "Anthropic"
                        })}
                      >
                        {isValidatingAnthropic ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating...</> : "Save & Test Key"}
                      </Button>
                      <p className="text-[9px] text-muted-foreground">Stored locally. Never sent to Swadesh servers.</p>
                    </div>
                  )}
                </div>
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
