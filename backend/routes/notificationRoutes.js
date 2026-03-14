// backend/routes/notificationRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-read", clearAllRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;