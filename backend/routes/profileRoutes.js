// backend/routes/profileRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getProfile, updateProfile,
  changePassword,
  uploadAvatar,
  updateLanguage,
  getLanguage,
  getNotificationPreferences,
  updateNotificationPreferences,
  removeDevice,
} from "../controllers/profileController.js";

const router = express.Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/change-password", changePassword);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);

// Language preference
router.get("/language", getLanguage);
router.patch("/language", updateLanguage);

router.get("/notifications",    getNotificationPreferences);
router.patch("/notifications",  updateNotificationPreferences);
router.delete("/device",        removeDevice);

export default router;