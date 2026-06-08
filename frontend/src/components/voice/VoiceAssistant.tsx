// src/components/voice/VoiceAssistant.tsx

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useVoice, Language } from "../../context/VoiceContext";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";
import { t, getRecognitionLang } from "../../utils/voiceTranslations";
import { updateLanguage as updateLanguageAPI } from "../../services/api";

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

const VoiceAssistant: React.FC = () => {
  const location = useLocation();
  const {
    voicePromptDone,
    setVoicePromptDone,
    enableVoice,
    speak,
    isFirstVisit,
    setIsFirstVisit,
    language,
    setLanguage,
    languageLoaded,
  } = useVoice();

  const { isBrowserSupported } = useVoiceAssistant();
  const promptStarted = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const isCitizenDashboard = location.pathname === "/citizen";

  useEffect(() => {
  if (!isCitizenDashboard) return;
  if (!isBrowserSupported) return;
  if (!languageLoaded) return;
  if (promptStarted.current) return;

  // Check token — only run if logged in
  const token = localStorage.getItem("token");
  if (!token) return;

  // Check if already done for this user
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const key = `voicePromptDone_${user.id || user._id || user.email}`;
      if (localStorage.getItem(key) === "true") return;
    } catch {}
  }

  // Check context state
  if (voicePromptDone) return;

  // All checks passed — start voice prompt
  promptStarted.current = true;
  retryCount.current = 0;

  const start = async () => {
    await new Promise((r) => setTimeout(r, 2500));
    if (!language) {
      askLanguage();
    } else {
      askVoicePrompt(language);
    }
  };

  start();
}, [isCitizenDashboard, languageLoaded, voicePromptDone, language]);

  // ── Step 1: Language Selection ─────────────────────
  const askLanguage = async () => {
    window.speechSynthesis.cancel();

    await speak(
      "Welcome to LegalMind! Please choose your language. " +
      "For English, say English. " +
      "For Hindi, say Hindi. " +
      "For Telugu, say Telugu.",
      "english"
    );

    await new Promise((r) => setTimeout(r, 600));
    listenForLanguage();
  };

  const listenForLanguage = () => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        recognition.stop();
        askLanguage();
      }
    }, 10000);

    recognition.onresult = async (event: any) => {
      responded = true;
      clearTimeout(timeout);

      const answer = event.results[0][0].transcript.toLowerCase().trim();

      let chosenLang: Language = "english";

      if (
        answer.includes("telugu") ||
        answer.includes("telug") ||
        answer.includes("telgu") ||
        answer.includes("తెలుగు")
      ) {
        chosenLang = "telugu";
      } else if (
        answer.includes("hindi") ||
        answer.includes("हिंदी") ||
        answer.includes("हिन्दी")
      ) {
        chosenLang = "hindi";
      } else if (
        answer.includes("english") ||
        answer.includes("అంగ్లం")
      ) {
        chosenLang = "english";
      } else {
        await speak(t("language_not_understood", null), "english");
        await new Promise((r) => setTimeout(r, 400));
        listenForLanguage();
        return;
      }

      setLanguage(chosenLang);
      setIsFirstVisit(false);

      try {
        await updateLanguageAPI(chosenLang);
      } catch (e) {
        console.error("Failed to save language:", e);
      }

      await speak(t("language_selected", chosenLang), chosenLang);
      await new Promise((r) => setTimeout(r, 400));
      askVoicePrompt(chosenLang);
    };

    recognition.onerror = (event: any) => {
      responded = true;
      clearTimeout(timeout);
      if (event.error === "no-speech") askLanguage();
      else if (event.error === "not-allowed") setVoicePromptDone(true);
    };

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(timeout);
    }
  };

  // ── Step 2: Yes/No Voice Prompt ────────────────────
  const askVoicePrompt = async (lang?: Language) => {
    const currentLang = lang || language || "english";

    if (retryCount.current >= MAX_RETRIES) {
      await speak(t("no_response_detected", currentLang), currentLang);
      setVoicePromptDone(true);
      return;
    }

    retryCount.current += 1;

    if (retryCount.current === 1) {
      const key = isFirstVisit
        ? "welcome_voice_prompt"
        : "returning_voice_prompt";
      await speak(t(key, currentLang), currentLang);
    } else {
      await speak(t("did_not_understand_yes_no", currentLang), currentLang);
    }

    await new Promise((r) => setTimeout(r, 400));
    listenForYesNo(currentLang);
  };

  const listenForYesNo = (lang: Language) => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        recognition.stop();
        askVoicePrompt(lang);
      }
    }, 8000);

    recognition.onresult = async (event: any) => {
      responded = true;
      clearTimeout(timeout);

      const answer = event.results[0][0].transcript.toLowerCase().trim();

      const yesWords = [
        "yes", "yeah", "sure", "ok", "okay", "yep",
        "haan", "ha", "ji", "हां", "हाँ", "जी",
        "avunu", "అవును",
      ];

      const noWords = [
        "no", "nah", "nope", "cancel",
        "nahi", "na", "नहीं", "ना",
        "kadu", "వద్దు",
      ];

      const isYes = yesWords.some((w) => answer.includes(w));
      const isNo = noWords.some((w) => answer.includes(w));

      if (isYes) {
        setVoicePromptDone(true);
        enableVoice();
        await speak(t("yes_response", lang), lang);
        await new Promise((r) => setTimeout(r, 300));
        await speak(t("main_menu", lang), lang);
      } else if (isNo) {
        setVoicePromptDone(true);
        await speak(t("no_response", lang), lang);
      } else {
        await speak(t("did_not_understand_yes_no", lang), lang);
        await new Promise((r) => setTimeout(r, 400));
        askVoicePrompt(lang);
      }
    };

    recognition.onerror = (event: any) => {
      responded = true;
      clearTimeout(timeout);
      if (event.error === "no-speech") askVoicePrompt(lang);
      else if (event.error === "not-allowed") setVoicePromptDone(true);
    };

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(timeout);
    }
  };

  return null;
};

export default VoiceAssistant;