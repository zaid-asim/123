import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useMusic } from "./music-context";
import { useSettings } from "./settings-context";

type TTSContextType = {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
};

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const { dimForSpeech, restoreFromSpeech } = useMusic();
  const { settings } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      const femaleIndianVoice = availableVoices.find(
        v => (v.lang.includes("en-IN") || v.lang.includes("hi-IN")) && 
             (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google"))
      );
      const femaleVoice = availableVoices.find(
        v => v.name.toLowerCase().includes("female") || 
             v.name.toLowerCase().includes("samantha") ||
             v.name.toLowerCase().includes("google uk english female")
      );
      const defaultVoice = femaleIndianVoice || femaleVoice || availableVoices[0];
      
      if (defaultVoice && !selectedVoice) {
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled) return;
    
    speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#_`]/g, "").replace(/\n+/g, ". ");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.ttsSpeed;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      dimForSpeech();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      restoreFromSpeech();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      restoreFromSpeech();
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [settings.ttsEnabled, settings.ttsSpeed, selectedVoice, dimForSpeech, restoreFromSpeech]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    restoreFromSpeech();
  }, [restoreFromSpeech]);

  return (
    <TTSContext.Provider
      value={{
        isSpeaking,
        speak,
        stop,
        voices,
        selectedVoice,
        setSelectedVoice,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
}
