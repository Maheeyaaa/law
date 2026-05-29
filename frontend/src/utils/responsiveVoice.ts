// src/utils/responsiveVoice.ts

import { Language } from "../context/VoiceContext";

// Language code map for gTTS
const LANG_MAP: Record<Language, string> = {
  english: "english",
  hindi: "hindi",
  telugu: "telugu",
};

// Speed for each language
const RATE_MAP: Record<Language, number> = {
  english: 1.0,
  hindi: 0.95,
  telugu: 0.95,
};

// Currently playing audio
let currentAudio: HTMLAudioElement | null = null;

// Cancel any ongoing speech
export const rvCancel = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
};

// Main speak function using backend gTTS
export const rvSpeak = async (
  text: string,
  lang: Language
): Promise<void> => {
  return new Promise(async (resolve) => {
    try {
      // Cancel any ongoing speech
      rvCancel();

      // Call backend TTS endpoint
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language: LANG_MAP[lang],
        }),
      });

      if (!response.ok) {
        console.error("❌ TTS API error:", response.status);
        resolve();
        return;
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      // Set playback rate
      audio.playbackRate = RATE_MAP[lang];

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setTimeout(resolve, 500); // small gap after speaking
      };

      audio.onerror = (e) => {
        console.error("❌ Audio playback error:", e);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };

      await audio.play();

    } catch (e) {
      console.error("❌ TTS error:", e);
      currentAudio = null;
      resolve();
    }
  });
};

// Keep for compatibility — not needed with gTTS
export const waitForRV = (): Promise<void> => {
  return Promise.resolve();
};