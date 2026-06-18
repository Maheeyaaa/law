// backend/routes/lawyerRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  browseLawyers,
  getLawyerProfile,
  recommendLawyers,
  generateContactEmail,
} from "../controllers/lawyerController.js";

const router = express.Router();

// ── Public for testing ────────────────────────────────────
router.get("/browse",    browseLawyers);
router.get("/recommend", recommendLawyers);

// ── Protected (needs auth) ────────────────────────────────
router.use(protect);

router.get("/profile/:id",        getLawyerProfile);
router.post("/contact/:lawyerId", generateContactEmail);  // ← needs req.user

export default router;