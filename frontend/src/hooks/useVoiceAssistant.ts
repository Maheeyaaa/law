// src/hooks/useVoiceAssistant.ts

import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVoice } from "../context/VoiceContext";
import { matchCommand } from "../utils/voiceCommands";
import { voiceChat } from "../services/api";

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

// Page context messages - assistant knows where user is
const PAGE_CONTEXT: Record<string, string> = {
  "/citizen": "You are on your home dashboard.",
  "/citizen/find-lawyer": "You are on the Find Lawyers page. You can see lawyers listed here.",
  "/citizen/track": "You are on the Case Tracking page. You can enter your case ID here to check progress.",
  "/citizen/cases": "You are on My Cases page. You can see all your registered cases here.",
  "/citizen/documents": "You are on the Documents page. You can upload and view your documents here.",
  "/citizen/notifications": "You are on your Notifications page.",
  "/citizen/help": "You are on the Help page. You can contact support from here.",
  "/citizen/account": "You are on your Account Settings page.",
  "/citizen/ai-assistant": "You are on the AI Legal Assistant page. You can ask any legal question here.",
};

// After navigation - guide user on new page
const PAGE_ARRIVAL_GUIDE: Record<string, string> = {
  "/citizen/find-lawyer":
    "I have opened the Find Lawyers page for you. You can see lawyers listed here. You can filter by specialization or district. Tap the microphone if you need help finding the right lawyer.",
  "/citizen/track":
    "I have opened the Case Tracking page. If you have a case ID, you can enter it here to check your case progress. Tap the microphone if you need help.",
  "/citizen/cases":
    "I have opened your cases page. You can see all your cases here. Tap the microphone if you want to know more about any case.",
  "/citizen/documents":
    "I have opened your documents page. You can upload important documents here like notices, agreements, or ID proofs. Tap the microphone if you need help.",
  "/citizen/ai-assistant":
    "I have opened the AI Legal Assistant. You can type or use the microphone to ask any legal question. I will explain it in simple language.",
  "/citizen/help":
    "I have opened the Help Center. You can contact our support team from here. Tap the microphone if you need me to help you write your message.",
  "/citizen/account":
    "I have opened your account settings. You can update your name, phone number, and other details here.",
};

export const useVoiceAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isVoiceEnabled,
    setIsListening,
    setTranscript,
    speak,
    disableVoice,
    sessionId,
    setSessionId,
    addMessage,
    lastSpoken,
  } = useVoice();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const voiceEnabledRef = useRef(isVoiceEnabled);
  const isBrowserSupported = !!SpeechRecognition;
  const prevPathRef = useRef(location.pathname);

  // Keep ref in sync
  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);

  // When page changes in voice mode - guide user
  useEffect(() => {
    if (!isVoiceEnabled) return;
    if (location.pathname === prevPathRef.current) return;

    prevPathRef.current = location.pathname;

    const guide = PAGE_ARRIVAL_GUIDE[location.pathname];
    if (guide) {
      setTimeout(async () => {
        await speak(guide);
        // Restart listening after guide
        setTimeout(() => {
          if (voiceEnabledRef.current) {
            startListening();
          }
        }, 500);
      }, 500);
    }
  }, [location.pathname, isVoiceEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, [setIsListening]);

  // Handle legal questions via AI
  const handleLegalQuestion = useCallback(
    async (text: string) => {
      try {
        addMessage({ role: "user", text });

        // Context aware thinking message
        await speak("Let me find that information for you. Please wait.");

        const res = await voiceChat({
          message: text,
          sessionId: sessionId || undefined,
        });

        const { reply, sessionId: newSessionId } = res.data;

        if (newSessionId && !sessionId) {
          setSessionId(newSessionId);
        }

        addMessage({ role: "assistant", text: reply });

        // Speak the reply
        await speak(reply);

        // After answering - ask if they need more help
        await speak(
          "I hope that helped. Tap the microphone if you have more questions or need help with something else."
        );
      } catch (error) {
        console.error("Voice chat error:", error);
        await speak(
          "Sorry, I had trouble getting that information. Please try again by tapping the microphone."
        );
      }
    },
    [sessionId, speak, addMessage, setSessionId]
  );

  // Handle special intents
  const handleIntent = useCallback(
    async (text: string) => {
      const lower = text.toLowerCase();

      // Repeat last response
      if (
        lower.includes("repeat") ||
        lower.includes("say again") ||
        lower.includes("what did you say") ||
        lower.includes("again") ||
        lower.includes("pardon")
      ) {
        if (lastSpoken) {
          await speak(lastSpoken);
        } else {
          await speak("I have not said anything yet. How can I help you?");
        }
        return true;
      }

      // User got a notice
      if (
        lower.includes("i got a notice") ||
        lower.includes("received a notice") ||
        lower.includes("got notice") ||
        lower.includes("legal notice") ||
        lower.includes("notice")
      ) {
        await speak(
          "I understand you received a legal notice. Do not worry, I can help you understand it. Please go to the AI Assistant page and either type the notice text or upload the notice document. I will explain what it means in simple language. Shall I take you there?"
        );
        return true;
      }

      // User needs a lawyer
      if (
        lower.includes("find me a lawyer") ||
        lower.includes("need a lawyer") ||
        lower.includes("want a lawyer") ||
        lower.includes("lawyer help")
      ) {
        await speak(
          "I will help you find a lawyer. Let me open the lawyer directory for you."
        );
        navigate("/citizen/find-lawyer");
        return true;
      }

      // Track case
      if (
        lower.includes("track my case") ||
        lower.includes("check my case") ||
        lower.includes("case progress") ||
        lower.includes("case status")
      ) {
        await speak(
          "Let me take you to the case tracking page. You will need your case ID to check the progress."
        );
        navigate("/citizen/track");
        return true;
      }

      // Check scam
      if (
        lower.includes("check scam") ||
        lower.includes("is this scam") ||
        lower.includes("scam") ||
        lower.includes("fraud")
      ) {
        await speak(
          "I can help you check if something is a scam. Let me take you to the AI Assistant where you can describe what you received."
        );
        navigate("/citizen/ai-assistant");
        return true;
      }

      // User has a question
      if (
        lower.includes("i have a question") ||
        lower.includes("want to ask") ||
        lower.includes("can you tell me") ||
        lower.includes("what is") ||
        lower.includes("how to") ||
        lower.includes("explain")
      ) {
        await handleLegalQuestion(text);
        return true;
      }

      return false;
    },
    [speak, navigate, lastSpoken, handleLegalQuestion]
  );

  const startListening = useCallback(() => {
    if (!isBrowserSupported) {
      speak("Sorry, your browser does not support voice recognition. Please try Chrome browser.");
      return;
    }

    if (isListeningRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const spokenText = event.results[0][0].transcript;
      console.log("Heard:", spokenText);
      setTranscript(spokenText);

      // 1. Check navigation commands first
      const command = matchCommand(spokenText);

      if (command) {
        await speak(command.response);

        if (command.action === "EXIT_VOICE") {
          await speak(
            "Voice assistance turned off. You can tap the microphone button anytime to get help."
          );
          disableVoice();
          return;
        } else if (command.action === "STOP_LISTENING") {
          stopListening();
          return;
        } else if (command.action === "HELP") {
          // Already spoke help
        } else if (command.action === "LOGOUT") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        } else if (command.route) {
          navigate(command.route);
        }
      } else {
        // 2. Check special intents
        const handled = await handleIntent(spokenText);

        // 3. If not handled - send to AI
        if (!handled) {
          await handleLegalQuestion(spokenText);
        }
      }

      // Restart listening after processing (voice enabled mode)
      setTimeout(() => {
        if (voiceEnabledRef.current && !isListeningRef.current) {
          startListening();
        }
      }, 1000);
    };

    recognition.onerror = (event: any) => {
      console.error("Voice error:", event.error);
      isListeningRef.current = false;
      setIsListening(false);

      if (event.error === "no-speech" || event.error === "aborted") {
        setTimeout(() => {
          if (voiceEnabledRef.current) {
            startListening();
          }
        }, 1500);
      } else if (event.error === "not-allowed") {
        speak(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again."
        );
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start failed:", e);
      setTimeout(() => {
        if (voiceEnabledRef.current) {
          startListening();
        }
      }, 1500);
    }
  }, [
    isBrowserSupported,
    speak,
    disableVoice,
    navigate,
    setIsListening,
    setTranscript,
    stopListening,
    handleLegalQuestion,
    handleIntent,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Stop when disabled
  useEffect(() => {
    if (!isVoiceEnabled) {
      stopListening();
    }
  }, [isVoiceEnabled, stopListening]);

  return {
    startListening,
    stopListening,
    isBrowserSupported,
  };
};