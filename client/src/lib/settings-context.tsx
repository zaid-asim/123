import { createContext, useContext, useState, useEffect } from "react";
import type { Settings } from "@shared/schema";

const defaultSettings: Settings = {
  theme: "dark",
  personality: "friendly",
  ttsSpeed: 1,
  ttsEnabled: true,
  musicVolume: 0.5,
  musicLoop: true,
  musicAutoPlay: false,
  language: "en",
  wallpaper: "gradient",
  dcModeAuto: true,
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
