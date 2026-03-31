// backend/controllers/voiceController.js

import Groq from "groq-sdk";
import UserAnalytics from "../models/UserAnalytics.js";
import ChatMessage from "../models/ChatMessage.js";

const LEGAL_SYSTEM_PROMPT = `You are LegalMind AI, a helpful legal assistant for Indian citizens. Your role is to:

1. Explain legal concepts in simple, easy-to-understand language
2. Help citizens understand their legal rights
3. Explain legal procedures (filing cases, court processes, etc.)
4. Clarify legal notices and documents
5. Provide general legal guidance about Indian law

Important rules:
- Always clarify that you provide general legal information, NOT legal advice
- Recommend consulting a qualified lawyer for specific legal matters
- Be empathetic and patient with users who may be stressed about legal issues
- Use simple language, avoid excessive legal jargon
- When explaining legal terms, provide the meaning in plain English
- Focus on Indian law and legal system
- Keep responses concise but thorough (especially for voice - max 200 words)
- If you don't know something, say so honestly

You must NOT:
- Provide specific legal advice for individual cases
- Guarantee outcomes of legal proceedings
- Encourage any illegal activities
- Provide information about how to evade law`;

// ═══════════════════════════════════════════════════
// VOICE CHAT (Text input → AI response optimized for voice)
// ═══════════════════════════════════════════════════

export const voiceChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        message: "Message is required",
        audioResponse: "I didn't hear anything. Please try again."
      });
    }

    // Track voice usage
    try {
      let analytics = await UserAnalytics.findOne({ user: req.user.id });
      if (!analytics) {
        analytics = await UserAnalytics.create({ user: req.user.id });
      }
      analytics.featureUsage.voiceInput = (analytics.featureUsage.voiceInput || 0) + 1;
      analytics.totalMessages += 1;
      analytics.lastActive = new Date();
      analytics.lastFeatureUsed = "voiceInput";
      await analytics.save();
    } catch (trackError) {
      console.error("Tracking error:", trackError);
    }

    const session = sessionId || `voice_${req.user.id}_${Date.now()}`;

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
      .limit(6); // Limit for voice (shorter context)

    const chronological = history.reverse();

    const messages = [
      { 
        role: "system", 
        content: LEGAL_SYSTEM_PROMPT + "\n\nIMPORTANT: Keep your response SHORT and CONCISE for voice output. Maximum 150 words. Use simple sentences."
      },
      ...chronological.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.message,
      })),
    ];

    // Get AI response
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 300, // Shorter for voice
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    // Save AI response
    await ChatMessage.create({
      user: req.user.id,
      role: "assistant",
      message: reply,
      sessionId: session,
    });

    res.json({ 
      reply,
      audioResponse: reply, // Same text, will be converted to speech on frontend
      sessionId: session 
    });

  } catch (error) {
    console.error("VOICE CHAT ERROR:", error);
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I encountered an error. Please try again.",
      audioResponse: "Sorry, I encountered an error. Please try speaking again."
    });
  }
};