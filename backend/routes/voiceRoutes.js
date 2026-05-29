// backend/routes/voiceRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  voiceChat,
  getVoiceHistory,
  clearVoiceSession,
} from "../controllers/voiceController.js";

const router = express.Router();

router.use(protect);

router.post("/chat", voiceChat);
router.get("/history/:sessionId", getVoiceHistory);
router.delete("/session/:sessionId", clearVoiceSession);

export default router;