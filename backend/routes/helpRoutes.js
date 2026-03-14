// backend/routes/helpRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getFAQs,
  submitSupportMessage,
  getMySupportMessages,
} from "../controllers/helpController.js";

const router = express.Router();

// FAQs are public (no auth needed)
router.get("/faqs", getFAQs);

// Support messages need auth
router.post("/contact", protect, submitSupportMessage);
router.get("/my-messages", protect, getMySupportMessages);

export default router;