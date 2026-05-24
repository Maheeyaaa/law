import express from "express";

import protect from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  chatbot,
  explainNotice,
  decodeLegalTerm,
  generateChecklist,
  checkLegalAid,
  detectScam,
  getChatHistory,
  getChatSessions,
  deleteChatSession,
  clearAllChats,
} from "../controllers/aiController.js";

const router =
  express.Router();

// ======================
// Protected
// ======================

router.use(
  protect
);

// ======================
// AI Features
// ======================

// General AI

router.post(
  "/chatbot",

  chatbot
);

// Explain uploaded notice

router.post(
  "/explain-notice",

  upload.single(
    "noticeFile"
  ),

  explainNotice
);

// Decode legal terms

router.post(
  "/decode-term",

  decodeLegalTerm
);

// Generate checklist

router.post(
  "/checklist",

  generateChecklist
);

// Legal aid

router.post(
  "/legal-aid",

  checkLegalAid
);

// Scam detection

router.post(
  "/detect-scam",

  upload.single(
    "noticeFile"
  ),

  detectScam
);

// ======================
// Chat History
// ======================

router.get(
  "/chat/history",

  getChatHistory
);

router.get(
  "/chat/sessions",

  getChatSessions
);

router.delete(
  "/chat/session/:sessionId",

  deleteChatSession
);

router.delete(
  "/chat/clear",

  clearAllChats
);

export default router;