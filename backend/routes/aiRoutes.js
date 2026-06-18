// backend/routes/aiRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  // AI Features
  chatbot,
  explainNotice,
  calculateDeadline,
  decodeLegalTerm,
  filingGuidance,
  generateChecklist,
  checkLegalAid,
  detectScam,
  classifyCaseType,
  // Conversation CRUD
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
  deleteAllConversations,
  // Legacy
  getChatHistory,
  getChatSessions,
  deleteChatSession,
  clearAllChats,
} from "../controllers/aiController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ══════════════════════════════════════════
// AI Feature Routes
// ══════════════════════════════════════════
router.post("/chatbot", chatbot);
router.post("/explain-notice", upload.single("noticeFile"), explainNotice);
router.post("/decode-term", decodeLegalTerm);
router.post("/checklist", generateChecklist);
router.post("/legal-aid", checkLegalAid);
router.post("/detect-scam", upload.single("noticeFile"), detectScam);
router.post("/deadline", calculateDeadline);
router.post("/filing-guide", filingGuidance);
router.post("/classify-case-type", upload.single("noticeFile"), classifyCaseType);

// ══════════════════════════════════════════
// Conversation CRUD Routes (New)
// ══════════════════════════════════════════
router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:conversationId", getConversationById);
router.patch("/conversations/:conversationId", updateConversation);
router.delete("/conversations/all", deleteAllConversations);
router.delete("/conversations/:conversationId", deleteConversation);

// ══════════════════════════════════════════
// Legacy Routes (kept for backward compatibility)
// ══════════════════════════════════════════
router.get("/chat/history", getChatHistory);
router.get("/chat/sessions", getChatSessions);
router.delete("/chat/session/:sessionId", deleteChatSession);
router.delete("/chat/clear", clearAllChats);

export default router;