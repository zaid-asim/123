import { createContext, useContext, useState, useEffect } from "react";
import type { Settings } from "@shared/schema";

const defaultSettings: Settings = {
  theme: "dark",
  personality: "friendly",
  ttsSpeed: 1,
  ttsPitch: 1,
  ttsEnabled: true,
  ttsVoiceName: "",
  musicVolume: 0.5,
  musicLoop: true,
  musicAutoPlay: false,
  language: "en",
  wallpaper: "gradient",
  dcModeAuto: true,
  mustReadMemory: "",
  fontSize: "base",
  glassBlur: "medium",
  animationSpeed: "normal",
  borderRadius: "lg",
  soundEffectsEnabled: true,
  aiCreativity: "balanced",
  aiResponseLength: "standard",
  aiReasoningDepth: "standard",
  enterToSend: true,
  autoScroll: true,
  showTimestamps: true,
  useCustomApiKey: false,
  customApiKey: "",
  geminiModel: "gemini-3.5-flash",
  useGroq: false,
  groqApiKey: "",
  groqModel: "llama-4-scout-17b-16e-instruct",
  useOpenRouter: false,
  openRouterApiKey: "",
  openRouterModel: "google/gemini-3.5-flash",
  useOpenAI: false,
  openAiApiKey: "",
  openAiModel: "gpt-5.5",
  useGrok: false,
  grokApiKey: "",
  grokModel: "grok-4.3",
  useDeepSeek: false,
  deepseekApiKey: "",
  deepseekModel: "deepseek-chat",
  useAnthropic: false,
  anthropicApiKey: "",
  anthropicModel: "claude-3-5-sonnet-latest",
  useReasoningPipeline: true,
  showConfidence: true,
  showSources: true,
  showReasoningTrace: false,
  criticStrictness: "standard",
};

type SettingsContextType = {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("swadesh-ai-settings");
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("swadesh-ai-settings", JSON.stringify(settings));
    
    // Inject CSS variables
    const root = document.documentElement;
    
    // Font size
    const fontSizes: Record<string, string> = { sm: "14px", base: "16px", lg: "18px", xl: "20px" };
    root.style.setProperty("--font-size-base", fontSizes[settings.fontSize] || "16px");
    
    // Glass blur
    const blurs: Record<string, string> = { low: "8px", medium: "16px", high: "24px", ultra: "40px" };
    root.style.setProperty("--glass-blur", blurs[settings.glassBlur] || "16px");
    
    // Animation speed
    const speeds: Record<string, string> = { slow: "0.6s", normal: "0.3s", fast: "0.15s", off: "0s" };
    root.style.setProperty("--animation-speed", speeds[settings.animationSpeed] || "0.3s");
    
    // Border radius
    const radiuses: Record<string, string> = { sharp: "0px", sm: "4px", md: "8px", lg: "16px", pill: "9999px" };
    root.style.setProperty("--radius", radiuses[settings.borderRadius] || "16px");

    // Wallpaper background colors/gradients
    const wallpaperGradients: Record<string, { from: string; via?: string; to: string }> = {
      gradient: { from: "rgba(255, 103, 31, 0.04)", via: "rgba(255, 255, 255, 0.01)", to: "rgba(18, 136, 37, 0.04)" },
      peacock: { from: "rgba(0, 40, 150, 0.06)", via: "rgba(0, 0, 0, 0)", to: "rgba(0, 200, 80, 0.06)" },
      lotus: { from: "rgba(255, 100, 150, 0.06)", via: "rgba(0, 0, 0, 0)", to: "rgba(255, 20, 147, 0.06)" },
      tricolor: { from: "rgba(255, 103, 31, 0.06)", via: "rgba(255, 255, 255, 0.02)", to: "rgba(18, 136, 37, 0.06)" },
      mandala: { from: "rgba(139, 0, 139, 0.06)", via: "rgba(0, 0, 0, 0)", to: "rgba(255, 140, 0, 0.06)" }
    };
    const wp = wallpaperGradients[settings.wallpaper] || wallpaperGradients.gradient;
    root.style.setProperty("--wp-from", wp.from);
    root.style.setProperty("--wp-via", wp.via || "rgba(0,0,0,0)");
    root.style.setProperty("--wp-to", wp.to);

  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export interface EngineDetails {
  name: string;
  provider: string;
  colorClass: string;
  bgClass: string;
  desc: string;
}

export function getEngineDetails(settings: Settings): EngineDetails {
  if (settings.useOpenAI) {
    return {
      name: settings.openAiModel || "gpt-5.5",
      provider: "OpenAI",
      colorClass: "bg-emerald-500",
      bgClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      desc: `Routing queries through OpenAI API using model: ${settings.openAiModel}. Offers industry-standard frontier intelligence.`
    };
  } else if (settings.useGrok) {
    return {
      name: settings.grokModel || "grok-4.3",
      provider: "Grok",
      colorClass: "bg-violet-500",
      bgClass: "bg-violet-500/10 text-violet-500 border-violet-500/30",
      desc: `Routing queries through xAI Grok API using model: ${settings.grokModel}. Provides real-time information access and witty responses.`
    };
  } else if (settings.useOpenRouter) {
    return {
      name: settings.openRouterModel.split('/').pop() || "OpenRouter Model",
      provider: "OpenRouter",
      colorClass: "bg-purple-500",
      bgClass: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      desc: `Routing queries through OpenRouter API using model: ${settings.openRouterModel}. This enables accessing state-of-the-art models like Llama 3.3, Claude 3.5 Sonnet, or DeepSeek R1.`
    };
  } else if (settings.useGroq) {
    return {
      name: settings.groqModel || "Llama 4 Scout",
      provider: "Groq",
      colorClass: "bg-blue-500",
      bgClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      desc: `Routing queries through Groq API using model: ${settings.groqModel}. Offers ultra-fast token generation speed.`
    };
  } else if (settings.useDeepSeek) {
    return {
      name: settings.deepseekModel || "DeepSeek Chat",
      provider: "DeepSeek",
      colorClass: "bg-cyan-500",
      bgClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
      desc: `Routing queries through DeepSeek API using model: ${settings.deepseekModel}. Offers state-of-the-art cost-effective inference.`
    };
  } else if (settings.useAnthropic) {
    return {
      name: settings.anthropicModel || "Claude 3.5 Sonnet",
      provider: "Anthropic",
      colorClass: "bg-orange-500",
      bgClass: "bg-orange-500/10 text-orange-500 border-orange-500/30",
      desc: `Routing queries through Anthropic API using model: ${settings.anthropicModel}. Provides advanced reasoning, coding, and comprehension.`
    };
  } else {
    return {
      name: settings.geminiModel || "Gemini 3.5 Flash",
      provider: "Gemini",
      colorClass: "bg-saffron-500",
      bgClass: "bg-saffron-500/10 text-saffron-500 border-saffron-500/30",
      desc: `Routing queries through Google Gemini API using model: ${settings.geminiModel || "gemini-3.5-flash"}. Offers rich reasoning capabilities, multimodality, and grounded context processing.`
    };
  }
}
