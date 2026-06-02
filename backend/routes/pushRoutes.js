// backend/routes/pushRoutes.js

import express from "express";
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendTest,
  getSubscriptions,
} from "../controllers/pushController.js";
import protect from "../middleware/authMiddleware.js";
import { triggerHearingReminders } from "../jobs/cronManager.js";

const router = express.Router();

// Public — frontend needs this to create subscription
router.get("/public-key", getPublicKey);

// Protected — require login
router.post("/subscribe",     protect, subscribe);
router.post("/unsubscribe",   protect, unsubscribe);
router.post("/test",          protect, sendTest);
router.get("/subscriptions",  protect, getSubscriptions);

// Manual trigger for hearing reminders (for testing)
router.post("/trigger-reminders", protect, async (req, res) => {
  try {
    const result = await triggerHearingReminders();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
export default router;