// backend/routes/profileRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../controllers/profileController.js";

const router = express.Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/change-password", changePassword);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);

export default router;