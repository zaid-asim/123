import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

type MusicContextType = {
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  currentTrack: string | null;
  duration: number;
  currentTime: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (vol: number) => void;
  setLoop: (loop: boolean) => void;
  loadTrack: (file: File) => void;
  seek: (time: number) => void;
  dimForSpeech: () => void;
  restoreFromSpeech: () => void;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [loop, setLoopState] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const previousVolume = useRef(0.5);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.loop = loop;
    
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener("ended", () => {
      if (!loop) setIsPlaying(false);
    });
    
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  const play = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
  }, []);

  const setLoop = useCallback((l: boolean) => {
    setLoopState(l);
  }, []);

  const loadTrack = useCallback((file: File) => {
    if (audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setCurrentTrack(file.name);
      audioRef.current.load();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const dimForSpeech = useCallback(() => {
    previousVolume.current = volume;
    setVolume(volume * 0.2);
  }, [volume, setVolume]);

  const restoreFromSpeech = useCallback(() => {
    setVolume(previousVolume.current);
  }, [setVolume]);

  return (
    <MusicContext.Provider
      value={{
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
        dimForSpeech,
        restoreFromSpeech,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
