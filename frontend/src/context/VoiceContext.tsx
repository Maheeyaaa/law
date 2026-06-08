// src/context/VoiceContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getLanguage } from "../services/api";
import { rvSpeak, rvCancel } from "../utils/responsiveVoice";

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

// ── Helper: get user-specific localStorage key ──
// So if user A and user B login on same device, each gets their own prompt state
function getPromptDoneKey(): string | null {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return `voicePromptDone_${user.id || user._id || user.email}`;
  } catch {
    return null;
  }
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── voicePromptDone: load from localStorage on init ──
  const [voicePromptDone, setVoicePromptDoneState] = useState<boolean>(() => {
    const key = getPromptDoneKey();
    if (!key) return false;
    return localStorage.getItem(key) === "true";
  });

  // ── Wrapper that persists to localStorage too ──
  const setVoicePromptDone = useCallback((val: boolean) => {
    setVoicePromptDoneState(val);
    const key = getPromptDoneKey();
    if (!key) return;
    if (val) {
      localStorage.setItem(key, "true");
    } else {
      localStorage.removeItem(key);
    }
  }, []);

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
      return new Promise(async (resolve) => {
        const speechLang = lang || language || "english";

        // Cancel any browser TTS first
        window.speechSynthesis.cancel();

        setIsSpeaking(true);

        try {
          // Use ResponsiveVoice for all languages
          await rvSpeak(text, speechLang);
          setLastSpoken(text);
        } catch (e) {
          console.error("Speech error:", e);
        } finally {
          setIsSpeaking(false);
          resolve();
        }
      });
    },
    [language]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel(); // cancel browser TTS
    rvCancel();                       // cancel ResponsiveVoice
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
    rvCancel();
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