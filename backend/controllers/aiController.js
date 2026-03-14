// backend/controllers/aiController.js

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import ChatMessage from "../models/ChatMessage.js";
import { extractTextFromPDF } from "../utils/pdfExtractor.js";

// ▲ REMOVED: createRequire and pdf-parse import
// ▲ ADDED: extractTextFromPDF utility

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// Helper: Call Groq API
const askGroq = async (systemPrompt, userMessage, maxTokens = 1024) => {
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

// Helper: Save chat to history
const saveToHistory = async (userId, sessionId, userMsg, assistantMsg) => {
  await ChatMessage.create({
    user: userId,
    role: "user",
    message: userMsg,
    sessionId,
  });
  await ChatMessage.create({
    user: userId,
    role: "assistant",
    message: assistantMsg,
    sessionId,
  });
};

// ══════════════════════════════════════════
// Helper: Extract text from uploaded file
// ══════════════════════════════════════════
const extractTextFromFile = async (file) => {
  const filePath = path.join("uploads", file.filename);
  const ext = path.extname(file.originalname).toLowerCase();

  let text = "";
  let error = null;
  let isOCR = false;

  if (ext === ".pdf") {
    try {
      text = await extractTextFromPDF(filePath);

      // Check if OCR was used (OCR adds "--- Page X ---" markers)
      if (text.includes("--- Page")) {
        isOCR = true;
      }
    } catch (pdfError) {
      error =
        "Could not read this PDF file. Please try pasting the text instead.";
    }
  } else if (ext === ".txt") {
    text = fs.readFileSync(filePath, "utf-8");
  } else {
    error =
      "Unsupported file type. Please upload a PDF or TXT file, or paste the text directly.";
  }

  // Clean up uploaded file
  try {
    fs.unlinkSync(filePath);
  } catch {}

  // Check if extracted text is meaningful
  if (!error && (!text || text.trim().length < 10)) {
    error =
      "Could not extract readable text from this PDF.\n\n" +
      "This might be because:\n" +
      "• The PDF is a scanned image with very low quality\n" +
      "• The PDF is password protected\n" +
      "• The PDF contains only images/diagrams\n\n" +
      "Please try:\n" +
      "• Opening the PDF, selecting all text (Ctrl+A), copying (Ctrl+C), and pasting it here\n" +
      "• Uploading a clearer scan\n" +
      "• Typing the notice content directly";
  }

  return { text: text.trim(), error, isOCR };
};

// ═══════════════════════════════════════
// FEATURE 0: General Chatbot
// ═══════════════════════════════════════
export const chatbot = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const session = sessionId || `session_${req.user.id}_${Date.now()}`;

    await ChatMessage.create({
      user: req.user.id,
      role: "user",
      message: message.trim(),
      sessionId: session,
    });

    const history = await ChatMessage.find({
      user: req.user.id,
      sessionId: session,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const chronological = history.reverse();

    const messages = [
      { role: "system", content: LEGAL_SYSTEM_PROMPT },
      ...chronological.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.message,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    await ChatMessage.create({
      user: req.user.id,
      role: "assistant",
      message: reply,
      sessionId: session,
    });

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I encountered an error. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 1: Explain Notice
// ═══════════════════════════════════════
export const explainNotice = async (req, res) => {
  try {
    let noticeText = req.body.notice || "";
    let isOCR = false;

    // If file was uploaded, extract text
    if (req.file) {
      const { text, error, isOCR: ocrUsed } = await extractTextFromFile(req.file);

      if (error) {
        return res.status(400).json({ message: error });
      }

      noticeText = text;
      isOCR = ocrUsed;
    }

    if (!noticeText || !noticeText.trim()) {
      return res.status(400).json({
        message:
          "Notice text is required. Upload a PDF/TXT file or paste the text.",
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

${isOCR ? "Note: This text was extracted via OCR from a scanned document, so there may be minor character recognition errors. Please interpret accordingly.\n\n" : ""}Legal Notice:
${noticeText.trim()}`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `notice_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Notice Explanation Request]\n${noticeText.trim().substring(0, 500)}...`,
      reply
    );

    res.json({
      reply: isOCR
        ? `📸 *This was a scanned document — text was extracted using OCR. Minor recognition errors are possible.*\n\n${reply}`
        : reply,
      sessionId: session,
    });
  } catch (error) {
    console.error("NOTICE ERROR:", error);
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not analyze this notice. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 2: Deadline Calculator
// ═══════════════════════════════════════
export const calculateDeadline = async (req, res) => {
  try {
    const { noticeType, receivedDate, noticeText } = req.body;

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

1. **Response deadline** - The exact date by which the citizen must respond, based on Indian law
2. **How the deadline is calculated** - Explain the law/rule that determines this deadline
3. **What happens on the deadline** - What expires or what action can be taken after this date
4. **Intermediate deadlines** - Any intermediate dates the citizen should be aware of
5. **Tips to not miss the deadline** - Practical advice
6. **Can the deadline be extended?** - If yes, how

Format dates clearly as DD Month YYYY (e.g., 15 January 2025).
If you cannot determine the exact deadline from the information provided, explain what additional information is needed and provide general guidelines.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1024);

    const session = `deadline_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Deadline Calculation] Type: ${noticeType || "N/A"}, Date: ${dateStr}`,
      reply
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not calculate the deadline. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 3: Legal Term Decoder
// ═══════════════════════════════════════
export const decodeLegalTerm = async (req, res) => {
  try {
    const { term, context } = req.body;

    if (!term || !term.trim()) {
      return res.status(400).json({ message: "Legal term is required." });
    }

    const prompt = `A citizen encountered the legal term "${term.trim()}" ${context ? `in this context: "${context.trim()}"` : ""} and needs help understanding it.

Please explain:

1. **Simple meaning** - What this term means in plain everyday language (1-2 sentences)
2. **Legal definition** - The formal legal meaning
3. **Example** - A real-world example of how this term applies
4. **Related terms** - Other legal terms that are commonly used together with this one
5. **Why it matters** - Why a citizen should care about this term
${context ? "6. **In this specific context** - What this term means in the context provided" : ""}

Keep the explanation simple and easy to understand for someone with no legal background.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 800);

    const session = `term_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Legal Term Decoder] Term: "${term.trim()}"${context ? `, Context: "${context.trim()}"` : ""}`,
      reply
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not decode this term. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 4: Step-by-Step Filing Guidance
// ═══════════════════════════════════════
export const filingGuidance = async (req, res) => {
  try {
    const { caseType, description, court, state } = req.body;

    if (!caseType || !caseType.trim()) {
      return res.status(400).json({ message: "Case type is required." });
    }

    const prompt = `A citizen wants to file a ${caseType.trim()} case in India${state ? ` (State: ${state})` : ""}${court ? ` at ${court}` : ""}.
${description ? `Details: ${description.trim()}\n` : ""}

Please provide a complete step-by-step guide:

1. **Before filing** - What to prepare before going to court
2. **Step-by-step process** - Numbered steps from start to finish, including:
   - Where to go
   - What forms to fill
   - What documents to carry
   - Fees to pay
   - How to submit
3. **Required documents** - Complete list of documents needed
4. **Estimated costs** - Filing fees and other expenses (approximate)
5. **Estimated timeline** - How long the process typically takes
6. **Common mistakes to avoid** - Things that delay or reject filings
7. **Where to get help** - Free legal aid options, legal services authorities
8. **Online filing options** - If available for this type of case

Make each step clear and actionable. A person with no legal knowledge should be able to follow these steps.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `filing_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Filing Guidance] Case Type: ${caseType.trim()}, State: ${state || "N/A"}`,
      reply
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not generate filing guidance. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 5: Document Checklist Generator
// ═══════════════════════════════════════
export const generateChecklist = async (req, res) => {
  try {
    const { caseType, purpose, state } = req.body;

    if (!caseType || !caseType.trim()) {
      return res.status(400).json({ message: "Case type is required." });
    }

    const prompt = `A citizen needs to know what documents are required for a ${caseType.trim()} case in India${state ? ` (State: ${state})` : ""}.
${purpose ? `Purpose: ${purpose.trim()}\n` : ""}

Please generate a comprehensive document checklist:

1. **Mandatory documents** - Documents absolutely required (mark each with ✅)
   - Document name
   - What it is / where to get it
   - Number of copies needed

2. **Supporting documents** - Documents that strengthen the case (mark each with 📎)
   - Document name
   - Why it helps

3. **Identity & address proof** - Which ID proofs are accepted

4. **How to get documents you don't have** - Where to obtain missing documents (government offices, online portals, etc.)

5. **Document formatting requirements** - Any specific requirements like notarization, attestation, affidavit format

6. **Digital copies needed?** - Whether digital/scanned copies are required

7. **Checklist summary** - A quick numbered checklist the citizen can print and tick off

Make this practical and easy to follow. The citizen should be able to use this as a checklist while gathering documents.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `checklist_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Document Checklist] Case Type: ${caseType.trim()}, State: ${state || "N/A"}`,
      reply
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not generate the checklist. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 6: Legal Aid Eligibility Checker
// ═══════════════════════════════════════
export const checkLegalAid = async (req, res) => {
  try {
    const { annualIncome, category, caseType, state, description } = req.body;

    const prompt = `A citizen wants to know if they are eligible for free legal aid in India.

Their details:
- Annual Income: ${annualIncome ? `₹${annualIncome}` : "Not specified"}
- Category: ${category || "Not specified"} (e.g., SC/ST, woman, child, disabled, industrial worker, etc.)
- Case Type: ${caseType || "Not specified"}
- State: ${state || "Not specified"}
${description ? `- Additional details: ${description.trim()}` : ""}

Based on the Legal Services Authorities Act, 1987 and other relevant Indian laws, please analyze:

1. **Eligibility status** - Is this person likely eligible for free legal aid? (Yes/No/Maybe)

2. **Eligibility criteria met** - Which criteria does this person meet:
   - Section 12 of Legal Services Authorities Act categories
   - Income threshold (varies by state)
   - Special categories (SC/ST, women, children, disabled, etc.)

3. **What free legal aid includes**:
   - Free lawyer
   - Court fees waived
   - Other benefits

4. **How to apply** - Step-by-step process to apply for legal aid:
   - Where to go (District Legal Services Authority, Taluk level, etc.)
   - Documents needed
   - Application process

5. **Important contacts**:
   - NALSA (National Legal Services Authority) helpline
   - State Legal Services Authority contact
   - Nearest Legal Aid Clinic information

6. **Alternative options** - If not eligible for free legal aid, what other affordable options exist

Please be specific about Indian legal aid rules and provide accurate income thresholds.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `legalaid_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Legal Aid Check] Income: ${annualIncome || "N/A"}, Category: ${category || "N/A"}, Case: ${caseType || "N/A"}`,
      reply
    );

    res.json({ reply, sessionId: session });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not check eligibility. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// FEATURE 7: Fake Notice / Scam Detector
// ═══════════════════════════════════════
export const detectScam = async (req, res) => {
  try {
    let noticeText = req.body.notice || "";
    let isOCR = false;

    // If file was uploaded, extract text
    if (req.file) {
      const { text, error, isOCR: ocrUsed } = await extractTextFromFile(req.file);

      if (error) {
        return res.status(400).json({ message: error });
      }

      noticeText = text;
      isOCR = ocrUsed;
    }

    if (!noticeText || !noticeText.trim()) {
      return res.status(400).json({
        message:
          "Notice text is required. Upload a file or paste the text.",
      });
    }

    const prompt = `A citizen received the following notice/document and wants to verify if it's genuine or a potential scam/fake.

${isOCR ? "Note: This text was extracted via OCR from a scanned document, so there may be minor character recognition errors. Don't flag OCR artifacts as red flags for scam detection.\n\n" : ""}Notice/Document:
"${noticeText.trim()}"

Please analyze this notice for authenticity. Check for:

1. **Authenticity Score** - Rate 1-10 (1 = likely fake, 10 = likely genuine). Give a clear score.

2. **Red flags found** 🚩 - List any suspicious elements:
   - Grammatical errors or unprofessional language
   - Missing official headers, logos, or reference numbers
   - Vague or threatening language
   - Unusual payment demands or bank account details
   - Missing sender details or incomplete addresses
   - Unrealistic deadlines (e.g., "respond in 24 hours or face arrest")
   - Wrong legal references or non-existent laws cited

3. **Genuine indicators** ✅ - List elements that look legitimate:
   - Proper court/authority name
   - Valid legal sections cited
   - Proper format and language
   - Realistic timelines
   - Proper seal/stamp mentions

4. **Verdict** - Is this notice:
   - ✅ Likely Genuine
   - ⚠️ Suspicious - needs verification
   - 🚩 Likely Fake/Scam

5. **How to verify** - Steps the citizen can take to confirm authenticity:
   - Where to call/visit
   - What to check
   - Who to contact

6. **What to do if it's fake** - Steps to report the scam

7. **What to do if it's genuine** - Immediate action items

Be thorough but clear. Many citizens receive fake legal notices and this analysis could save them from fraud.`;

    const reply = await askGroq(LEGAL_SYSTEM_PROMPT, prompt, 1500);

    const session = `scam_${req.user.id}_${Date.now()}`;
    await saveToHistory(
      req.user.id,
      session,
      `[Scam Detection Request]\n${noticeText.trim().substring(0, 500)}...`,
      reply
    );

    res.json({
      reply: isOCR
        ? `📸 *Note: This was a scanned document processed via OCR. Minor character recognition errors are possible and were not flagged as scam indicators.*\n\n${reply}`
        : reply,
      sessionId: session,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not analyze this notice. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// Chat History APIs
// ═══════════════════════════════════════
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;

    const filter = { user: req.user.id };
    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatSessions = async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $match: { user: req.user.id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $first: "$message" },
          lastRole: { $first: "$role" },
          lastTime: { $first: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastTime: -1 } },
      { $limit: 20 },
    ]);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await ChatMessage.deleteMany({
      user: req.user.id,
      sessionId: sessionId,
    });
    res.json({ message: "Chat session deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllChats = async (req, res) => {
  try {
    await ChatMessage.deleteMany({ user: req.user.id });
    res.json({ message: "All chat history cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};