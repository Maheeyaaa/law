// backend/controllers/voiceController.js

import Groq from "groq-sdk";
import UserAnalytics from "../models/UserAnalytics.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

const getSystemPrompt = (language) => {
  const langInstructions = {
    english: "Respond in simple English. Use short sentences.",
    telugu: "Respond in Telugu (తెలుగు). Use Telugu script. Keep sentences short and simple. If you don't know a Telugu word, use the English word.",
    hindi: "Respond in Hindi (हिंदी). Use Hindi/Devanagari script. Keep sentences short and simple. If you don't know a Hindi word, use the English word.",
  };

  return `You are LegalMind AI, a friendly legal guide for Indian citizens.

Language: ${langInstructions[language] || langInstructions.english}

Your job:
- Explain legal concepts in very simple language
- Help citizens understand their rights
- Explain legal notices and documents
- Guide through legal procedures
- Help identify possible scams
- Be warm, patient, and reassuring

Important rules:
- Provide general legal information only
- Never claim to provide legal advice
- Recommend consulting a lawyer when needed
- Keep responses under 150 words
- Use short, conversational sentences
- Speak naturally as if talking to a friend
- If the user seems worried, reassure them
- Focus on Indian law

Voice rules (responses will be spoken aloud):
- Use short sentences
- Avoid bullet points and numbered lists
- Speak conversationally
- Don't use special characters or markdown`;
};

// ======================
// Voice Chat
// ======================

export const voiceChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        reply: "I didn't hear anything.",
        audioResponse: "I didn't hear anything. Please try again.",
      });
    }

    // Get user's preferred language
    const user = await User.findById(req.user.id).select("preferredLanguage");
    const language = user?.preferredLanguage || "english";

    // Analytics
    try {
      let analytics = await UserAnalytics.findOne({ user: req.user.id });
      if (!analytics) {
        analytics = await UserAnalytics.create({ user: req.user.id });
      }
      analytics.featureUsage.voiceInput =
        (analytics.featureUsage.voiceInput || 0) + 1;
      analytics.totalMessages += 1;
      analytics.lastActive = new Date();
      analytics.lastFeatureUsed = "voice";
      await analytics.save();
    } catch (e) {
      console.error(e);
    }

    const session =
      sessionId || `voice_${req.user.id}_${Date.now()}`;

    // Save user message
    await ChatMessage.create({
      user: req.user.id,
      role: "user",
      message: message.trim(),
      sessionId: session,
    });

    // Get conversation history
    const history = await ChatMessage.find({
      user: req.user.id,
      sessionId: session,
    })
      .sort({ createdAt: -1 })
      .limit(6);

    const messages = [
      {
        role: "system",
        content: getSystemPrompt(language),
      },
      ...history.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.message,
      })),
    ];

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 250,
      temperature: 0.5,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      (language === "telugu"
        ? "క్షమించండి, నేను ప్రతిస్పందన రూపొందించలేకపోయాను."
        : language === "hindi"
        ? "क्षमा करें, मैं जवाब नहीं दे पाया।"
        : "Sorry, I couldn't generate a response.");

    // Save AI response
    await ChatMessage.create({
      user: req.user.id,
      role: "assistant",
      message: reply,
      sessionId: session,
    });

    res.json({
      reply,
      audioResponse: reply,
      sessionId: session,
      language,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      reply: "Something went wrong.",
      audioResponse: "Something went wrong. Please try again.",
    });
  }
};

// ======================
// Get Voice History
// ======================

export const getVoiceHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const history = await ChatMessage.find({
      user: req.user.id,
      sessionId: sessionId,
    })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({
      success: true,
      history,
      sessionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get history",
    });
  }
};

// ======================
// Clear Voice Session
// ======================

export const clearVoiceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await ChatMessage.deleteMany({
      user: req.user.id,
      sessionId: sessionId,
    });

    res.json({
      success: true,
      message: "Session cleared",
      newSessionId: `voice_${req.user.id}_${Date.now()}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to clear session",
    });
  }
};