// backend/routes/aiRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  chatbot,
  explainNotice,
  calculateDeadline,
  decodeLegalTerm,
  filingGuidance,
  generateChecklist,
  checkLegalAid,
  detectScam,
  getChatHistory,
  getChatSessions,
  deleteChatSession,
  clearAllChats,
} from "../controllers/aiController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Feature 0: General chatbot
router.post("/chatbot", chatbot);

// Feature 1: Explain notice (text or file upload)
router.post("/explain-notice", upload.single("noticeFile"), explainNotice);

// Feature 2: Deadline calculator
router.post("/deadline", calculateDeadline);

// Feature 3: Legal term decoder
router.post("/decode-term", decodeLegalTerm);

// Feature 4: Filing guidance
router.post("/filing-guide", filingGuidance);

// Feature 5: Document checklist generator
router.post("/checklist", generateChecklist);

// Feature 6: Legal aid eligibility checker
router.post("/legal-aid", checkLegalAid);

// Feature 7: Fake notice / scam detector
router.post("/detect-scam", upload.single("noticeFile"), detectScam);

// Chat history
router.get("/chat/history", getChatHistory);
router.get("/chat/sessions", getChatSessions);
router.delete("/chat/session/:sessionId", deleteChatSession);
router.delete("/chat/clear", clearAllChats);

export default router;