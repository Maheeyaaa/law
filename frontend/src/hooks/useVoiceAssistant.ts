// src/hooks/useVoiceAssistant.ts

import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVoice, Language } from "../context/VoiceContext";
import { matchCommand } from "../utils/voiceCommands";
import { t } from "../utils/voiceTranslations";

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

export const useVoiceAssistant = () => {
  const navigate = useNavigate();
  const {
    isVoiceEnabled,
    setIsListening,
    setTranscript,
    speak,
    disableVoice,
    lastSpoken,
    language,
  } = useVoice();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const postSpeechCooldownRef = useRef(false);
  const voiceEnabledRef = useRef(isVoiceEnabled);
  const languageRef = useRef(language);
  const isBrowserSupported = !!SpeechRecognition;

  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // ── Safe speak ─────────────────────────────────────
  const safeSpeak = useCallback(
    async (text: string, lang: Language) => {
      isSpeakingRef.current = true;
      postSpeechCooldownRef.current = true;
      try {
        await speak(text, lang);
      } finally {
        isSpeakingRef.current = false;
        setTimeout(() => {
          postSpeechCooldownRef.current = false;
        }, 1000);
      }
    },
    [speak]
  );

  // ── Stop listening ─────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, [setIsListening]);

  const startListeningRef = useRef<() => void>(() => {});

  const canListen = useCallback(() => {
    return (
      voiceEnabledRef.current &&
      !isListeningRef.current &&
      !isSpeakingRef.current &&
      !isProcessingRef.current &&
      !postSpeechCooldownRef.current
    );
  }, []);

  // ── Process command ────────────────────────────────
  const processAction = useCallback(
    async (action: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const l = languageRef.current || "english";
      stopListening();

      try {
        switch (action) {
          case "SHOW_MENU":
            isProcessingRef.current = false;
            await safeSpeak(t("main_menu", l), l);
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
            return;

          case "HOME":
            await safeSpeak(t("opening_home", l), l);
            navigate("/citizen");
            break;

          case "NOTICE":
            await safeSpeak(t("guide_notice", l), l);
            navigate("/citizen/ai-assistant");
            break;

          case "LAWYER":
            await safeSpeak(t("opening_lawyers", l), l);
            navigate("/citizen/find-lawyer");
            break;

          case "CASE":
            await safeSpeak(t("opening_tracker", l), l);
            navigate("/citizen/track");
            break;

          case "QUESTION":
            await safeSpeak(t("opening_ai", l), l);
            navigate("/citizen/ai-assistant");
            break;

          case "SCAM":
            await safeSpeak(t("opening_ai", l), l);
            navigate("/citizen/ai-assistant");
            break;

          case "DOCUMENTS":
            await safeSpeak(t("opening_documents", l), l);
            navigate("/citizen/documents");
            break;

          case "NOTIFICATIONS":
            await safeSpeak(t("opening_notifications", l), l);
            navigate("/citizen/notifications");
            break;

          case "HELP":
            await safeSpeak(t("opening_help", l), l);
            navigate("/citizen/help");
            break;

          case "ACCOUNT":
            await safeSpeak(t("opening_account", l), l);
            navigate("/citizen/account");
            break;

          case "CASES":
            await safeSpeak(t("opening_cases", l), l);
            navigate("/citizen/cases");
            break;

          case "REPEAT":
            if (lastSpoken) {
              await safeSpeak(lastSpoken, l);
            } else {
              await safeSpeak(t("repeat_nothing", l), l);
            }
            isProcessingRef.current = false;
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
            return;

          case "EXIT_VOICE":
            await safeSpeak(t("voice_disabled", l), l);
            disableVoice();
            isProcessingRef.current = false;
            return;

          case "LOGOUT":
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
            isProcessingRef.current = false;
            return;

          default:
            break;
        }
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [safeSpeak, navigate, disableVoice, lastSpoken, stopListening, canListen]
  );

  // ── Start listening ────────────────────────────────
  const startListening = useCallback(() => {
    if (!isBrowserSupported) return;
    if (!canListen()) return;

    const recognition = new SpeechRecognition();

    // 🆕 ALWAYS en-IN — handles Hinglish, Tenglish naturally
    // TTS uses the user's language, but mic always listens in en-IN
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5; // 🆕 more alternatives = better chance of match

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      console.log("🎤 Listening...");
    };

    recognition.onresult = async (event: any) => {
      // Try all alternatives
      const alternatives = Array.from(event.results[0]).map(
        (r: any) => r.transcript
      );
      console.log("✅ Heard alternatives:", alternatives);

      isListeningRef.current = false;
      setIsListening(false);

      let matchedCommand = null;
      let matchedTranscript = alternatives[0] as string;

      for (const alt of alternatives) {
        const cmd = matchCommand(alt as string);
        if (cmd) {
          matchedCommand = cmd;
          matchedTranscript = alt as string;
          break;
        }
      }

      setTranscript(matchedTranscript);
      await new Promise((r) => setTimeout(r, 300));

      const l = languageRef.current || "english";

      if (matchedCommand) {
        await processAction(matchedCommand.action || "");
      } else {
        // Not understood — say sorry + read menu + listen again
        await safeSpeak(t("not_understood", l), l);
        await safeSpeak(t("main_menu", l), l);
        setTimeout(() => {
          if (canListen()) startListeningRef.current();
        }, 1200);
      }
    };

    recognition.onerror = (event: any) => {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      console.warn("⚠️ Error:", event.error);
      // On any error just stop — user taps mic again
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Start error:", e);
      isListeningRef.current = false;
    }
  }, [
    isBrowserSupported,
    canListen,
    safeSpeak,
    setIsListening,
    setTranscript,
    processAction,
  ]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isVoiceEnabled) stopListening();
  }, [isVoiceEnabled, stopListening]);

  return { startListening, stopListening, isBrowserSupported };
};