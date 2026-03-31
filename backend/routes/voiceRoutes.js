// backend/routes/voiceRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { voiceChat } from "../controllers/voiceController.js";

const router = express.Router();

router.use(protect);

// Voice chat endpoint
router.post("/chat", voiceChat);

export default router;