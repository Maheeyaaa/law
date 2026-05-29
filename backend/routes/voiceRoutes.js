// backend/routes/voiceRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import https from "https";
import {
  voiceChat,
  getVoiceHistory,
  clearVoiceSession,
} from "../controllers/voiceController.js";

const router = express.Router();

const LANG_MAP = {
  english: "en",
  hindi: "hi",
  telugu: "te",
};

// 🆕 Split text into chunks of max 200 chars
// Split at sentence boundaries to sound natural
const splitText = (text, maxLength = 190) => {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  // Split by . or । or , 
  const sentences = text.split(/(?<=[.।,?!])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += (current ? " " : "") + sentence;
    } else {
      if (current) chunks.push(current.trim());
      // If single sentence is too long, split by words
      if (sentence.length > maxLength) {
        const words = sentence.split(" ");
        current = "";
        for (const word of words) {
          if ((current + " " + word).length <= maxLength) {
            current += (current ? " " : "") + word;
          } else {
            if (current) chunks.push(current.trim());
            current = word;
          }
        }
      } else {
        current = sentence;
      }
    }
  }

  if (current) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
};

// 🆕 Fetch audio for a single chunk
const fetchAudioChunk = (text, langCode) => {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://translate.google.com/",
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Google TTS error: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      }
    );

    request.on("error", reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error("TTS request timeout"));
    });
  });
};

// ── TTS endpoint ───────────────────────────────────
router.post("/tts", async (req, res) => {
  const { text, language } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const langCode = LANG_MAP[language] || "en";

  try {
    // Split text into chunks
    const chunks = splitText(text);

    // Fetch audio for each chunk
    const audioBuffers = await Promise.all(
      chunks.map(chunk => fetchAudioChunk(chunk, langCode))
    );

    // Combine all audio buffers
    const combinedAudio = Buffer.concat(audioBuffers);

    // Send combined audio
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": combinedAudio.length,
    });

    res.send(combinedAudio);

  } catch (err) {
    console.error("❌ TTS error:", err.message);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

// ── Protected routes ───────────────────────────────
router.use(protect);

router.post("/chat", voiceChat);
router.get("/history/:sessionId", getVoiceHistory);
router.delete("/session/:sessionId", clearVoiceSession);

export default router;