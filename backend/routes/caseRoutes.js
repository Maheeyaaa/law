// backend/routes/caseRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  registerCaseId,
  getMyCases,
  getCaseById,
  updateCase,
  getCaseStats,
  deleteCase,
} from "../controllers/caseController.js";
import {
  trackCase,
  trackCaseById,
} from "../controllers/trackController.js";

const router = express.Router();

router.use(protect);

// ── Stats ──────────────────────────────────────────────────
router.get("/stats", getCaseStats);

// ── Track by Case ID string ────────────────────────────────
router.get("/track/:caseId", trackCase);

// ── Register & List ────────────────────────────────────────
router.post("/", registerCaseId);
router.get("/", getMyCases);

// ── Single Case ────────────────────────────────────────────
router.get("/:id", getCaseById);
router.patch("/:id", updateCase);
router.delete("/:id", deleteCase);

// ── Track by MongoDB ID ────────────────────────────────────
router.get("/:id/track", trackCaseById);

export default router;