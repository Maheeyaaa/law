// backend/routes/helpRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  getFAQs,
  submitSupportMessage,
  getMySupportMessages,
  getSupportMessageById,
  updateSupportStatus,
} from "../controllers/helpController.js";

const router = express.Router();

// ── Public ─────────────────────────────────────────────────
router.get("/faqs", getFAQs);

// ── Citizen ────────────────────────────────────────────────
router.post("/contact", protect, submitSupportMessage);
router.get("/my-messages", protect, getMySupportMessages);
router.get("/my-messages/:id", protect, getSupportMessageById);

// ── Court Staff ────────────────────────────────────────────
router.patch(
  "/messages/:id/status",
  protect,
  restrictTo("court_staff"),
  updateSupportStatus
);

export default router;