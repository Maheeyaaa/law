// src/components/voice/VoiceAssistant.tsx

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useVoice } from "../../context/VoiceContext";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

// Guided welcome message - like a knowledgeable person
const WELCOME_MESSAGE = `Welcome to LegalMind! I am your legal guide. 
I can help you with your legal matters in simple steps.
Would you like me to guide you? Say yes or no.`;

const YES_RESPONSE = `Great! I am here to help you. 
Here is what I can do for you.

One. If you received a legal notice and want to understand it, tap the microphone and say, I got a notice.

Two. If you need to find a lawyer near you, say, Find me a lawyer.

Three. If you already have a case and want to check its progress, say, Track my case.

Four. If you have any legal question, say, I have a question.

Five. If you think something might be a scam, say, Check this scam.

Whenever you need me, just tap the blue microphone button at the bottom of the screen and speak. I am always here to help you.`;

const NO_RESPONSE = `No problem at all. 
You can see the blue microphone button at the bottom right of your screen. 
Tap it anytime you need help or have a question. 
I am always here for you.`;

const VoiceAssistant: React.FC = () => {
  const location = useLocation();
  const {
    voicePromptDone,
    setVoicePromptDone,
    enableVoice,
    speak,
    isFirstVisit,
    setIsFirstVisit,
  } = useVoice();

  const { isBrowserSupported } = useVoiceAssistant();
  const promptStarted = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  // Only trigger on /citizen dashboard
  const isCitizenDashboard = location.pathname === "/citizen";

  useEffect(() => {
    if (!isCitizenDashboard) return;
    if (voicePromptDone || promptStarted.current) return;
    if (!isBrowserSupported) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    promptStarted.current = true;
    retryCount.current = 0;

    const start = async () => {
      // Wait for page to fully load
      await new Promise((r) => setTimeout(r, 2500));
      askAndListen();
    };

    start();
  }, [isCitizenDashboard]);

  const askAndListen = async () => {
    if (retryCount.current >= MAX_RETRIES) {
      await speak(
        "No response detected. You can tap the blue microphone button at the bottom of your screen anytime you need help."
      );
      setVoicePromptDone(true);
      return;
    }

    retryCount.current += 1;

    // First time - full welcome, retry - shorter
    if (retryCount.current === 1) {
      await speak(WELCOME_MESSAGE);
    } else {
      await speak("Would you like voice guidance? Please say yes or no.");
    }

    await new Promise((r) => setTimeout(r, 400));
    listenForResponse();
  };

  const listenForResponse = () => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    let responded = false;

    // 8 second timeout
    const timeout = setTimeout(() => {
      if (!responded) {
        recognition.stop();
        askAndListen();
      }
    }, 8000);

    recognition.onresult = async (event: any) => {
      responded = true;
      clearTimeout(timeout);

      const answer = event.results[0][0].transcript.toLowerCase().trim();
      console.log("User answered:", answer);

      const isYes =
        answer.includes("yes") ||
        answer.includes("yeah") ||
        answer.includes("sure") ||
        answer.includes("ok") ||
        answer.includes("okay") ||
        answer.includes("please") ||
        answer.includes("yep") ||
        answer.includes("haan") || // Hindi yes
        answer.includes("ha") ||
        answer.includes("avunu"); // Telugu yes

      const isNo =
        answer.includes("no") ||
        answer.includes("nah") ||
        answer.includes("nope") ||
        answer.includes("cancel") ||
        answer.includes("nahi") || // Hindi no
        answer.includes("kadu"); // Telugu no

      if (isYes) {
        setVoicePromptDone(true);
        setIsFirstVisit(false);
        enableVoice();
        await speak(YES_RESPONSE);
      } else if (isNo) {
        setVoicePromptDone(true);
        setIsFirstVisit(false);
        await speak(NO_RESPONSE);
      } else {
        // Didn't understand
        await speak(
          "Sorry, I did not understand. Please say yes if you want my help, or no if you want to use the app on your own."
        );
        await new Promise((r) => setTimeout(r, 400));
        askAndListen();
      }
    };

    recognition.onerror = (event: any) => {
      responded = true;
      clearTimeout(timeout);

      if (event.error === "no-speech") {
        // Re-ask silently
        askAndListen();
      } else if (event.error === "not-allowed") {
        console.log("Microphone blocked by browser");
        setVoicePromptDone(true);
      } else {
        askAndListen();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(timeout);
      askAndListen();
    }
  };

  // Renders nothing - purely voice driven
  return null;
};

export default VoiceAssistant;