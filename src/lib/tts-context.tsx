import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useMusic } from "./music-context";
import { useSettings } from "./settings-context";

export type VoiceCategory = "indian" | "female" | "male" | "other";

export interface CategorizedVoice {
  voice: SpeechSynthesisVoice;
  category: VoiceCategory;
}

function categorizeVoice(voice: SpeechSynthesisVoice): VoiceCategory {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (lang.startsWith("hi") || lang.startsWith("ta") || lang.startsWith("te") || lang.startsWith("bn") || lang.includes("in")) {
    return "indian";
  }
  if (
    name.includes("female") || name.includes("woman") ||
    name.includes("samantha") || name.includes("victoria") ||
    name.includes("karen") || name.includes("moira") ||
    name.includes("fiona") || name.includes("veena") ||
    name.includes("tessa") || name.includes("allison") ||
    name.includes("ava") || name.includes("susan") ||
    name.includes("zira") || name.includes("hazel") ||
    name.includes("google uk english female") || name.includes("google us english")
  ) {
    return "female";
  }
  if (
    name.includes("male") || name.includes("man") ||
    name.includes("daniel") || name.includes("alex") ||
    name.includes("fred") || name.includes("lee") ||
    name.includes("tom") || name.includes("rishi") ||
    name.includes("google uk english male")
  ) {
    return "male";
  }
  return "other";
}

type TTSContextType = {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  voices: SpeechSynthesisVoice[];
  categorizedVoices: CategorizedVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  previewVoice: (voice: SpeechSynthesisVoice) => void;
  voicePitch: number;
  setVoicePitch: (pitch: number) => void;
};

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [categorizedVoices, setCategorizedVoices] = useState<CategorizedVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePitch, setVoicePitchState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("swadesh-tts-pitch");
      return stored ? parseFloat(stored) : 1;
    }
    return 1;
  });
  const { dimForSpeech, restoreFromSpeech } = useMusic();
  const { settings, updateSettings } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      const categorized = availableVoices.map(v => ({ voice: v, category: categorizeVoice(v) }));
      // Sort: Indian first, then female, male, other
      const order: VoiceCategory[] = ["indian", "female", "male", "other"];
      categorized.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
      setCategorizedVoices(categorized);

      // Restore persisted voice by name
      const savedVoiceName = settings.ttsVoiceName || localStorage.getItem("swadesh-tts-voice");
      if (savedVoiceName) {
        const found = availableVoices.find(v => v.name === savedVoiceName);
        if (found) {
          setSelectedVoiceState(found);
          return;
        }
      }

      // Default: prefer Indian female, then any Indian, then any female, fallback first
      const indianFemale = categorized.find(c => c.category === "indian");
      const female = categorized.find(c => c.category === "female");
      const defaultVoice = (indianFemale || female || categorized[0])?.voice || null;
      if (defaultVoice && !selectedVoice) {
        setSelectedVoiceState(defaultVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoiceState(voice);
    localStorage.setItem("swadesh-tts-voice", voice.name);
    updateSettings({ ttsVoiceName: voice.name });
  }, [updateSettings]);

  const setVoicePitch = useCallback((pitch: number) => {
    setVoicePitchState(pitch);
    localStorage.setItem("swadesh-tts-pitch", pitch.toString());
  }, []);

  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled) return;
    speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.ttsSpeed;
    utterance.pitch = voicePitch;
    utterance.volume = 1;

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => { setIsSpeaking(true); dimForSpeech(); };
    utterance.onend = () => { setIsSpeaking(false); restoreFromSpeech(); };
    utterance.onerror = () => { setIsSpeaking(false); restoreFromSpeech(); };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [settings.ttsEnabled, settings.ttsSpeed, voicePitch, selectedVoice, dimForSpeech, restoreFromSpeech]);

  const previewVoice = useCallback((voice: SpeechSynthesisVoice) => {
    speechSynthesis.cancel();
    const sample = "Namaste! I am Swadesh AI, your intelligent Indian assistant.";
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.voice = voice;
    utterance.rate = settings.ttsSpeed;
    utterance.pitch = voicePitch;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }, [settings.ttsSpeed, voicePitch]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    restoreFromSpeech();
  }, [restoreFromSpeech]);

  return (
    <TTSContext.Provider value={{
      isSpeaking, speak, stop,
      voices, categorizedVoices,
      selectedVoice, setSelectedVoice,
      previewVoice,
      voicePitch, setVoicePitch,
    }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) throw new Error("useTTS must be used within a TTSProvider");
  return context;
}
