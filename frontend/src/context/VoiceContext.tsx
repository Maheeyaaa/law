// src/context/VoiceContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getLanguage } from "../services/api";

export type Language = "english" | "telugu" | "hindi";

export interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
}

interface VoiceContextType {
  // State
  isVoiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  voicePromptDone: boolean;
  transcript: string;
  sessionId: string | null;
  messages: Message[];
  lastSpoken: string;
  isFirstVisit: boolean;
  language: Language | null;
  languageLoaded: boolean;

  // Actions
  enableVoice: () => void;
  disableVoice: () => void;
  setIsListening: (val: boolean) => void;
  setTranscript: (val: string) => void;
  setVoicePromptDone: (val: boolean) => void;
  setSessionId: (val: string) => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setIsFirstVisit: (val: boolean) => void;
  setLanguage: (lang: Language) => void;
  speak: (text: string, lang?: Language) => Promise<void>;
  stopSpeaking: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

// Speech language codes
const SPEECH_LANG_MAP: Record<Language, string> = {
  english: "en-IN",
  telugu: "te-IN",
  hindi: "hi-IN",
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicePromptDone, setVoicePromptDone] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSpoken, setLastSpoken] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [language, setLanguageState] = useState<Language | null>(null);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  // Load language from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLanguageLoaded(true);
      return;
    }

    const loadLanguage = async () => {
      try {
        const res = await getLanguage();
        if (res.data.language) {
          setLanguageState(res.data.language);
          setIsFirstVisit(false);
        }
      } catch (err) {
        // No language set yet - first time user
        console.log("No language preference found - first time user");
      } finally {
        setLanguageLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const speak = useCallback(
    (text: string, lang?: Language): Promise<void> => {
      return new Promise((resolve) => {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        // 🆕 Small gap after cancel before starting new utterance
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          const speechLang = lang || language || "english";
          utterance.lang = SPEECH_LANG_MAP[speechLang];
          utterance.rate = speechLang === "english" ? 0.88 : 0.85;
          utterance.pitch = 1;
          utterance.volume = 1;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            setLastSpoken(text);
            // 🆕 Extra delay after speech ends before resolving
            // This ensures mic doesn't catch the tail end of audio
            setTimeout(resolve, 800);
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            setTimeout(resolve, 800);
          };

          window.speechSynthesis.speak(utterance);
        }, 100);
      });
    },
    [language]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const enableVoice = useCallback(() => {
    setIsVoiceEnabled(true);
  }, []);

  const disableVoice = useCallback(() => {
    setIsVoiceEnabled(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript("");
    window.speechSynthesis.cancel();
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isVoiceEnabled,
        isListening,
        isSpeaking,
        voicePromptDone,
        transcript,
        sessionId,
        messages,
        lastSpoken,
        isFirstVisit,
        language,
        languageLoaded,
        enableVoice,
        disableVoice,
        setIsListening,
        setTranscript,
        setVoicePromptDone,
        setSessionId,
        addMessage,
        clearMessages,
        setIsFirstVisit,
        setLanguage,
        speak,
        stopSpeaking,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used inside VoiceProvider");
  }
  return context;
};