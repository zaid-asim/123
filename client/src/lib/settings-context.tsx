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
  useGroq: false,
  groqApiKey: "",
  groqModel: "llama3-8b-8192",
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
