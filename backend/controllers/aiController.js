// backend/controllers/aiController.js
import mongoose from "mongoose";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import ChatMessage from "../models/ChatMessage.js";
import Conversation from "../models/Conversation.js";
import { extractTextFromPDF } from "../utils/pdfExtractor.js";
import { ScamDetector } from "../utils/scamDetector.js";
import ScamReport from "../models/ScamReport.js";
import UserAnalytics from "../models/UserAnalytics.js";

// ══════════════════════════════════════════
// Analytics Helpers (unchanged)
// ══════════════════════════════════════════
const trackFeatureUsage = async (userId, featureName) => {
  try {
    let analytics = await UserAnalytics.findOne({ user: userId });
    if (!analytics) {
      analytics = await UserAnalytics.create({ user: userId });
    }
    const featureMap = {
      chatbot: "chatbot",
      explainNotice: "noticeExplanation",
      calculateDeadline: "deadlineCalculation",
      decodeLegalTerm: "termDecoder",
      filingGuidance: "filingGuidance",
      generateChecklist: "checklistGeneration",
      checkLegalAid: "legalAidCheck",
      detectScam: "scamDetection",
    };
    const field = featureMap[featureName];
    if (field) {
      analytics.featureUsage[field] += 1;
      analytics.totalMessages += 1;
      analytics.lastActive = new Date();
      analytics.lastFeatureUsed = featureName;
      await analytics.save();
    }
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
};

const trackPDFUpload = async (userId, isOCR = false) => {
  try {
    let analytics = await UserAnalytics.findOne({ user: userId });
    if (!analytics) {
      analytics = await UserAnalytics.create({ user: userId });
    }
    analytics.totalPDFsUploaded += 1;
    if (isOCR) analytics.totalOCRProcessed += 1;
    await analytics.save();
  } catch (error) {
    console.error("PDF tracking error:", error);
  }
};

const trackScamResult = async (userId, isScam, score) => {
  try {
    let analytics = await UserAnalytics.findOne({ user: userId });
    if (!analytics) {
      analytics = await UserAnalytics.create({ user: userId });
    }
    analytics.scamStats.totalScansPerformed += 1;
    if (score <= 3) analytics.scamStats.scamsDetected += 1;
    else if (score >= 8) analytics.scamStats.genuineNoticesVerified += 1;
    else analytics.scamStats.suspiciousNotices += 1;
    await analytics.save();
  } catch (error) {
    console.error("Scam tracking error:", error);
  }
};

// ══════════════════════════════════════════
// Groq Helper (unchanged)
// ══════════════════════════════════════════
const askGroq = async (systemPrompt, userMessage, maxTokens = 1024) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
};

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
- Keep responses concise but thorough
- If you don't know something, say so honestly

You must NOT:
- Provide specific legal advice for individual cases
- Guarantee outcomes of legal proceedings
- Encourage any illegal activities
- Provide information about how to evade law`;

// ══════════════════════════════════════════
// Conversation Helpers
// ══════════════════════════════════════════

/**
 * Auto-generate a conversation title from first user message
 */
const generateTitle = (message, featureType = "chatbot") => {
  const featureTitles = {
    explain_notice: "Notice Explanation",
    deadline: "Deadline Calculation",
    decode_term: "Legal Term",
    filing_guidance: "Filing Guidance",
    checklist: "Document Checklist",
    legal_aid: "Legal Aid Check",
    scam_detection: "Scam Detection",
  };

  if (featureType !== "chatbot" && featureTitles[featureType]) {
    return `${featureTitles[featureType]} - ${new Date().toLocaleDateString("en-IN")}`;
  }

  // For chatbot, use first 60 chars of message
  const cleaned = message.replace(/\[.*?\]/g, "").trim();
  return cleaned.length > 60 ? cleaned.substring(0, 60) + "..." : cleaned;
};

/**
 * Create or retrieve a Conversation document
 * Returns { conversation, isNew }
 */
const getOrCreateConversation = async (
  userId,
  sessionId,
  featureType = "chatbot",
  firstMessage = ""
) => {
  // Try finding existing conversation by sessionId
  let conversation = await Conversation.findOne({
    user: userId,
    // We store sessionId as the _id string pattern or match by messages
    // Instead, we'll use a different lookup approach
  });

  // Better: find conversation that has messages with this sessionId
  const existingMessage = await ChatMessage.findOne({
    user: userId,
    sessionId: sessionId,
    conversation: { $exists: true, $ne: null },
  });

  if (existingMessage) {
    conversation = await Conversation.findById(existingMessage.conversation);
    if (conversation && !conversation.isDeleted) {
      return { conversation, isNew: false };
    }
  }

  // Create new conversation
  const title = generateTitle(firstMessage, featureType);
  conversation = await Conversation.create({
    user: userId,
    title,
    type: featureType,
    lastMessage: firstMessage.substring(0, 200),
    messageCount: 0,
    lastActivityAt: new Date(),
  });

  return { conversation, isNew: true };
};

/**
 * Update conversation metadata after new message
 */
const updateConversationMeta = async (conversationId, lastMessage) => {
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: lastMessage.substring(0, 200),
    lastActivityAt: new Date(),
    $inc: { messageCount: 1 },
  });
};

/**
 * Save message pair to history and update conversation
 */
const saveToHistory = async (
  userId,
  sessionId,
  userMsg,
  assistantMsg,
  featureType = "chatbot",
  conversationId = null
) => {
  let convId = conversationId;

  if (!convId) {
    const { conversation } = await getOrCreateConversation(
      userId,
      sessionId,
      featureType,
      userMsg
    );
    convId = conversation._id;
  }

  await ChatMessage.create({
    user: userId,
    conversation: convId,
    role: "user",
    message: userMsg,
    sessionId,
    featureType,
  });

  await ChatMessage.create({
    user: userId,
    conversation: convId,
    role: "assistant",
    message: assistantMsg,
    sessionId,
    featureType,
  });

  // Update conversation metadata
  await updateConversationMeta(convId, assistantMsg);

  return convId;
};

// ══════════════════════════════════════════
// File extraction helper (unchanged)
// ══════════════════════════════════════════
const extractTextFromFile = async (file) => {
  const filePath = path.join(process.cwd(), "uploads", file.filename);
  const ext = path.extname(file.originalname).toLowerCase();
  let text = "";
  let error = null;
  let isOCR = false;

  if (ext === ".pdf") {
    try {
      text = await extractTextFromPDF(filePath);
      if (text.includes("--- Page")) isOCR = true;
    } catch {
      error = "Could not read this PDF file. Please try pasting the text instead.";
    }
  } else if (ext === ".txt") {
    text = fs.readFileSync(filePath, "utf-8");
  } else {
    error = "Unsupported file type. Please upload a PDF or TXT file.";
  }

  try {
    fs.unlinkSync(filePath);
  } catch {}

  if (!error && (!text || text.trim().length < 10)) {
    error =
      "Could not extract readable text from this PDF.\n\n" +
      "Please try:\n" +
      "• Pasting the text directly\n" +
      "• Uploading a clearer scan\n" +
      "• Typing the content directly";
  }

  return { text: text.trim(), error, isOCR };
};

// ══════════════════════════════════════════
// CONVERSATION CRUD APIs
// ══════════════════════════════════════════

/**
 * GET /api/ai/conversations
 * List all conversations for the logged-in user
 */
export const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      user: req.user.id,
      isDeleted: false,
    };

    if (type) filter.type = type;

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ isPinned: -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    res.json({
      conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ai/conversations
 * Create a new empty conversation
 */
export const createConversation = async (req, res) => {
  try {
    const { title, type = "chatbot" } = req.body;

    const conversation = await Conversation.create({
      user: req.user.id,
      title: title || "New Conversation",
      type,
      lastMessage: "",
      messageCount: 0,
      lastActivityAt: new Date(),
    });

    // Generate a sessionId for this conversation
    const sessionId = `conv_${conversation._id}_${Date.now()}`;

    res.status(201).json({
      message: "Conversation created",
      conversation,
      sessionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/ai/conversations/:conversationId
 * Get a single conversation with its messages
 */
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
      isDeleted: false,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const [messages, totalMessages] = await Promise.all([
      ChatMessage.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ChatMessage.countDocuments({ conversation: conversationId }),
    ]);

    res.json({
      conversation,
      messages,
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        pages: Math.ceil(totalMessages / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/ai/conversations/:conversationId
 * Rename a conversation or toggle pin
 */
export const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, isPinned } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
      isDeleted: false,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (title !== undefined) conversation.title = title.trim().substring(0, 120);
    if (isPinned !== undefined) conversation.isPinned = isPinned;

    await conversation.save();

    res.json({ message: "Conversation updated", conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/ai/conversations/:conversationId
 * Soft delete a conversation
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Soft delete conversation
    conversation.isDeleted = true;
    await conversation.save();

    // Hard delete all messages in this conversation
    await ChatMessage.deleteMany({ conversation: conversationId });

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/ai/conversations
 * Delete ALL conversations for this user
 */
export const deleteAllConversations = async (req, res) => {
  try {
    // Get all conversation IDs for this user
    const conversations = await Conversation.find({
      user: req.user.id,
      isDeleted: false,
    }).select("_id");

    const ids = conversations.map((c) => c._id);

    // Delete all messages
    await ChatMessage.deleteMany({
      user: req.user.id,
      conversation: { $in: ids },
    });

    // Soft delete all conversations
    await Conversation.updateMany(
      { user: req.user.id },
      { isDeleted: true }
    );

    res.json({ message: "All conversations deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════
// FEATURE 0: General Chatbot (UPDATED)
// ══════════════════════════════════════════
export const chatbot = async (req, res) => {
  try {
    const { message, sessionId, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    await trackFeatureUsage(req.user.id, "chatbot");

    // Determine session
    const session = sessionId || `session_${req.user.id}_${Date.now()}`;

    // Find or create conversation
    let conversation = null;
    let isFirstMessage = false;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user.id,
        isDeleted: false,
      });

      // Check if this is the first real message in this conversation
      if (conversation && conversation.messageCount === 0) {
        isFirstMessage = true;
      }

      // Also update title if it's still "New Conversation"
      if (conversation && conversation.title === "New Conversation") {
        isFirstMessage = true;
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({
        user: req.user.id,
        title: generateTitle(message.trim(), "chatbot"),
        type: "chatbot",
        lastMessage: message.trim().substring(0, 200),
        messageCount: 0,
        lastActivityAt: new Date(),
      });
    } else if (isFirstMessage) {
      // Update the title from "New Conversation" to actual first message
      conversation.title = generateTitle(message.trim(), "chatbot");
      await conversation.save();
    }

    // Save user message
    await ChatMessage.create({
      user: req.user.id,
      conversation: conversation._id,
      role: "user",
      message: message.trim(),
      sessionId: session,
      featureType: "chatbot",
    });

    // Get conversation history (last 10 messages for context)
    const history = await ChatMessage.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const chronological = history.reverse();

    // Build conversation context
    const conversationContext = chronological
      .slice(0, -1)
      .map((msg) =>
        `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`
      )
      .join("\n");

    const userPrompt =
      conversationContext.length > 0
        ? `Previous conversation:\n${conversationContext}\n\nUser: ${message.trim()}`
        : message.trim();

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, userPrompt, 1024);

    // Save assistant reply
    await ChatMessage.create({
      user: req.user.id,
      conversation: conversation._id,
      role: "assistant",
      message: reply,
      sessionId: session,
      featureType: "chatbot",
    });

    // Update conversation metadata
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: reply.substring(0, 200),
      lastActivityAt: new Date(),
      $inc: { messageCount: 2 },
    });

    res.json({
      reply,
      sessionId: session,
      conversationId: conversation._id,
      conversationTitle: conversation.title,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I encountered an error. Please try again.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 1: Explain Notice (UPDATED)
// ══════════════════════════════════════════
export const explainNotice = async (req, res) => {
  try {
    let noticeText = req.body.notice || "";
    let isOCR = false;

    await trackFeatureUsage(req.user.id, "explainNotice");

    if (req.file) {
      const { text, error, isOCR: ocrUsed } = await extractTextFromFile(req.file);
      if (error) return res.status(400).json({ message: error });
      noticeText = text;
      isOCR = ocrUsed;
    }

    if (!noticeText || !noticeText.trim()) {
      return res.status(400).json({
        message: "Notice text is required.",
      });
    }

    const prompt = `A citizen has received the following legal notice and needs help understanding it. 
Please explain this notice in simple, plain language. Break down:

1. **What this notice is about** - Summary in 1-2 sentences
2. **Who sent it and why** - Identify the sender and their intention
3. **What the citizen needs to do** - Clear action items
4. **Important deadlines mentioned** - List all dates and timeframes
5. **Potential consequences of not responding** - What happens if ignored
6. **Recommended next steps** - What should the citizen do right now
7. **Key legal terms used** - Explain any legal jargon in simple words

${isOCR ? "Note: This text was extracted via OCR from a scanned document.\n\n" : ""}Legal Notice:
${noticeText.trim()}`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `notice_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Notice Explanation Request]\n${noticeText.trim().substring(0, 500)}...`,
      reply,
      "explain_notice"
    );

    res.json({
      reply: isOCR
        ? `📸 *Scanned document — text extracted via OCR.*\n\n${reply}`
        : reply,
      sessionId: session,
    });
  } catch (error) {
    console.error("NOTICE ERROR:", error);
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not analyze this notice.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 2: Deadline Calculator (UPDATED)
// ══════════════════════════════════════════
export const calculateDeadline = async (req, res) => {
  try {
    const { noticeType, receivedDate, noticeText } = req.body;

    await trackFeatureUsage(req.user.id, "calculateDeadline");

    if (!noticeType && !noticeText) {
      return res.status(400).json({
        message: "Please provide either the notice type or the notice text.",
      });
    }

    const dateStr = receivedDate || new Date().toISOString().split("T")[0];

    const prompt = `You are a legal deadline calculator for Indian law.

${noticeText ? `The citizen received this notice:\n"${noticeText.trim()}"\n` : ""}
${noticeType ? `Notice type: ${noticeType}\n` : ""}
Date received: ${dateStr}

Please calculate and provide:
1. **Response deadline** - The exact date by which the citizen must respond
2. **How the deadline is calculated** - The law/rule that determines this
3. **What happens on the deadline**
4. **Intermediate deadlines**
5. **Tips to not miss the deadline**
6. **Can the deadline be extended?**

Format dates clearly as DD Month YYYY.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1024);

    const session = `deadline_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Deadline Calculation] Type: ${noticeType || "N/A"}, Date: ${dateStr}`,
      reply,
      "deadline"
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not calculate the deadline.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 3: Legal Term Decoder (UPDATED)
// ══════════════════════════════════════════
export const decodeLegalTerm = async (req, res) => {
  try {
    const { term, context } = req.body;

    await trackFeatureUsage(req.user.id, "decodeLegalTerm");

    if (!term || !term.trim()) {
      return res.status(400).json({ message: "Legal term is required." });
    }

    const prompt = `A citizen encountered the legal term "${term.trim()}" ${
      context ? `in this context: "${context.trim()}"` : ""
    } and needs help understanding it.

Please explain:
1. **Simple meaning** - Plain everyday language
2. **Legal definition** - Formal legal meaning
3. **Example** - Real-world example
4. **Related terms** - Commonly used together
5. **Why it matters**
${context ? "6. **In this specific context**" : ""}`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 800);

    const session = `term_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Legal Term Decoder] Term: "${term.trim()}"`,
      reply,
      "decode_term"
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not decode this term.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 4: Filing Guidance (UPDATED)
// ══════════════════════════════════════════
export const filingGuidance = async (req, res) => {
  try {
    const { caseType, description, court, state } = req.body;

    await trackFeatureUsage(req.user.id, "filingGuidance");

    if (!caseType || !caseType.trim()) {
      return res.status(400).json({ message: "Case type is required." });
    }

    const prompt = `A citizen wants to file a ${caseType.trim()} case in India${
      state ? ` (State: ${state})` : ""
    }${court ? ` at ${court}` : ""}.
${description ? `Details: ${description.trim()}\n` : ""}

Please provide a complete step-by-step guide:
1. **Before filing**
2. **Step-by-step process**
3. **Required documents**
4. **Estimated costs**
5. **Estimated timeline**
6. **Common mistakes to avoid**
7. **Where to get help**
8. **Online filing options**`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `filing_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Filing Guidance] Case Type: ${caseType.trim()}`,
      reply,
      "filing_guidance"
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not generate filing guidance.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 5: Document Checklist (UPDATED)
// ══════════════════════════════════════════
export const generateChecklist = async (req, res) => {
  try {
    const { caseType, purpose, state } = req.body;

    await trackFeatureUsage(req.user.id, "generateChecklist");

    if (!caseType || !caseType.trim()) {
      return res.status(400).json({ message: "Case type is required." });
    }

    const prompt = `A citizen needs documents for a ${caseType.trim()} case in India${
      state ? ` (State: ${state})` : ""
    }.
${purpose ? `Purpose: ${purpose.trim()}\n` : ""}

Generate a comprehensive document checklist:
1. **Mandatory documents** (mark with ✅)
2. **Supporting documents** (mark with 📎)
3. **Identity & address proof**
4. **How to get missing documents**
5. **Document formatting requirements**
6. **Digital copies needed?**
7. **Checklist summary** (numbered, printable)`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `checklist_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Document Checklist] Case Type: ${caseType.trim()}`,
      reply,
      "checklist"
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not generate the checklist.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 6: Legal Aid Checker (UPDATED)
// ══════════════════════════════════════════
export const checkLegalAid = async (req, res) => {
  try {
    const { annualIncome, category, caseType, state, description } = req.body;

    if (!annualIncome && !category && !caseType) {
      return res.status(400).json({
        message: "Please provide at least income, category, or case type.",
      });
    }

    await trackFeatureUsage(req.user.id, "checkLegalAid");

    const prompt = `A citizen wants to know if they qualify for free legal aid in India.

Details:
- Annual Income: ${annualIncome ? `₹${annualIncome}` : "Not specified"}
- Category: ${category || "Not specified"}
- Case Type: ${caseType || "Not specified"}
- State: ${state || "Not specified"}
${description ? `- Additional details: ${description.trim()}` : ""}

Based on the Legal Services Authorities Act, 1987, analyze:
1. **Eligibility status** (Yes/No/Maybe)
2. **Eligibility criteria met**
3. **What free legal aid includes**
4. **How to apply**
5. **Important contacts** (NALSA, State authority)
6. **Alternative options** if not eligible`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `legalaid_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Legal Aid Check] Income: ${annualIncome || "N/A"}, Category: ${category || "N/A"}`,
      reply,
      "legal_aid"
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not check eligibility.",
    });
  }
};

// ══════════════════════════════════════════
// FEATURE 7: Scam Detector (UPDATED)
// ══════════════════════════════════════════
export const detectScam = async (req, res) => {
  try {
    let noticeText = req.body.notice || "";
    let isOCR = false;

    if (req.file) {
      const { text, error, isOCR: ocrUsed } = await extractTextFromFile(req.file);
      if (error) return res.status(400).json({ message: error });
      noticeText = text;
      isOCR = ocrUsed;
      await trackPDFUpload(req.user.id, ocrUsed);
    }

    if (!noticeText || !noticeText.trim()) {
      return res.status(400).json({
        message: "Notice text is required.",
      });
    }

    await trackFeatureUsage(req.user.id, "detectScam");

    const detector = new ScamDetector();
    const ruleBasedAnalysis = await detector.analyze(noticeText.trim());

    const aiPrompt = `A citizen received the following notice and wants to verify if it's genuine or a scam.

${isOCR ? "Note: Text extracted via OCR.\n\n" : ""}Notice:
"${noticeText.trim()}"

Provide:
1. Your assessment (Genuine/Suspicious/Fake)
2. Key indicators you noticed
3. Recommendations for the citizen

Keep it concise.`;

    const aiResponse = await askGroq(LEGAL_SYSTEM_PROMPT, aiPrompt, 800);

    const aiLower = aiResponse.toLowerCase();
    const aiSaysFake =
      aiLower.includes("assessment: fake") ||
      aiLower.includes("assessment: suspicious/fake") ||
      aiLower.includes("assessment: suspicious");

    let finalScore = ruleBasedAnalysis.score;
    if (aiSaysFake) finalScore = Math.min(finalScore, 3);
    else if (aiLower.includes("requires verification") && finalScore > 7) finalScore = 7;

    const aiSaysVerify =
      aiLower.includes("verify") ||
      aiLower.includes("consult") ||
      aiLower.includes("check credentials");
    if (!aiSaysFake && aiSaysVerify && finalScore >= 9) finalScore = 8;

    let finalVerdict;
    if (finalScore <= 3) finalVerdict = "🚨 High Scam Risk";
    else if (finalScore <= 7) finalVerdict = "⚠️ Needs Manual Verification";
    else finalVerdict = "✅ Likely Genuine";

    const isScam = finalScore <= 5;
    await trackScamResult(req.user.id, isScam, finalScore);

    let redFlagsText = "";
    if (ruleBasedAnalysis.redFlags.length > 0) {
      redFlagsText = "\n\n🚩 **RED FLAGS DETECTED:**\n\n";
      ruleBasedAnalysis.redFlags.forEach((flag, index) => {
        const emoji = { critical: "🔴", high: "🟠", medium: "🟡", low: "⚪" }[flag.severity];
        redFlagsText += `${index + 1}. ${emoji} **${flag.type.replace(/_/g, " ").toUpperCase()}**\n`;
        redFlagsText += `   ${flag.message}\n\n`;
      });
    }

    const actionSection =
      finalScore <= 5
        ? `## 🚨 If this is a SCAM:\n- Do NOT respond\n- Do NOT pay\n- Report to Cyber Crime Portal\n- Save as evidence`
        : `## ✅ If this is GENUINE:\n- Respond through proper legal channels\n- Consult a lawyer if needed\n- Keep all documentation`;

    const finalResponse = `
# 🔍 SCAM DETECTION ANALYSIS

## 📊 Authenticity Score: ${finalScore}/10
## ${finalVerdict}

${redFlagsText}

---

## 🤖 AI Analysis:
${aiResponse}

---

## ✅ VERIFICATION STEPS:
1. **Check sender details** - Verify court/authority name on official website (.gov.in)
2. **Verify case number** - Search on official court website
3. **Check for official seal/stamp**
4. **Never pay immediately** - Government never asks for urgent payments via UPI/personal accounts

${actionSection}

${isOCR ? "\n📸 *Note: Scanned document processed via OCR*" : ""}
    `.trim();

    try {
      await ScamReport.create({
        reportedBy: req.user.id,
        noticeText: noticeText.trim().substring(0, 5000),
        noticeFile: req.file ? req.file.filename : null,
        isScam,
        scamType: isScam ? "fake_notice" : undefined,
        detectedPatterns: ruleBasedAnalysis.redFlags.map((f) => f.type),
        authenticityScore: finalScore,
        aiAnalysis: aiResponse.substring(0, 2000),
        redFlags: ruleBasedAnalysis.redFlags.map((f) => f.message),
      });
    } catch (dbError) {
      console.error("Failed to save scam report:", dbError);
    }

    const session = `scam_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Scam Detection Request]\n${noticeText.trim().substring(0, 500)}...`,
      finalResponse,
      "scam_detection"
    );

    res.json({
      reply: finalResponse,
      sessionId: session,
      analysis: {
        score: finalScore,
        verdict: finalVerdict,
        isScam,
        totalRedFlags: ruleBasedAnalysis.totalRedFlags,
        criticalFlags: ruleBasedAnalysis.criticalFlags,
        highFlags: ruleBasedAnalysis.highFlags,
      },
    });
  } catch (error) {
    console.error("SCAM DETECTION ERROR:", error);
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not analyze this notice.",
    });
  }
};

// ══════════════════════════════════════════
// LEGACY Chat History APIs (kept for backward compatibility)
// ══════════════════════════════════════════

export const getChatHistory = async (req, res) => {
  try {
    const { sessionId, conversationId } = req.query;

    const filter = { user: req.user.id };

    if (conversationId) {
      filter.conversation = conversationId;
    } else if (sessionId) {
      filter.sessionId = sessionId;
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatSessions = async (req, res) => {
  try {
    // Return conversations instead of raw sessions
    const conversations = await Conversation.find({
      user: req.user.id,
      isDeleted: false,
    })
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .limit(20)
      .lean();

    // Map to old format for backward compatibility
    const sessions = conversations.map((conv) => ({
      _id: conv._id,
      sessionId: conv._id.toString(),
      title: conv.title,
      lastMessage: conv.lastMessage,
      lastTime: conv.lastActivityAt,
      messageCount: conv.messageCount,
      type: conv.type,
      isPinned: conv.isPinned,
    }));

    res.json({ sessions, conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Try to delete by conversation ID first
    let deleted = false;

    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      const conversation = await Conversation.findOne({
        _id: sessionId,
        user: req.user.id,
      });

      if (conversation) {
        conversation.isDeleted = true;
        await conversation.save();
        await ChatMessage.deleteMany({ conversation: sessionId });
        deleted = true;
      }
    }

    // Fallback: delete by sessionId string
    if (!deleted) {
      await ChatMessage.deleteMany({
        user: req.user.id,
        sessionId: sessionId,
      });
    }

    res.json({ message: "Chat session deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllChats = async (req, res) => {
  try {
    await ChatMessage.deleteMany({ user: req.user.id });
    await Conversation.updateMany(
      { user: req.user.id },
      { isDeleted: true }
    );
    res.json({ message: "All chat history cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};