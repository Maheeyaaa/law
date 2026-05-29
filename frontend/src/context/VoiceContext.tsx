// src/context/VoiceContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

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
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

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

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.88; // Slightly slower for non-tech users
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setLastSpoken(text);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

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
    setMessages((prev) => [
      ...prev,
      { ...msg, timestamp: new Date() },
    ]);
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
        enableVoice,
        disableVoice,
        setIsListening,
        setTranscript,
        setVoicePromptDone,
        setSessionId,
        addMessage,
        clearMessages,
        setIsFirstVisit,
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