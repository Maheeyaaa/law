// backend/routes/caseRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createCase,
  getMyCases,
  getCaseById,
  updateCase,
  getCaseStats,
  getCaseTimeline,
  updateCNR,
} from "../controllers/caseController.js";
import {
  trackCase,
  trackCaseById,
} from "../controllers/trackController.js";

const router = express.Router();

router.use(protect);

// ── Static/specific routes FIRST ──────────────────────────
router.get("/stats", getCaseStats);
router.get("/track/:caseId", trackCase);      // e.g. /cases/track/%23TS-2025-0001

// ── Collection routes ─────────────────────────────────────
router.post(
  "/",
  upload.array("documents"),
  createCase
);
router.get("/", getMyCases);

// ── Dynamic :id routes LAST ───────────────────────────────
router.get("/:id", getCaseById);
router.get("/:id/timeline", getCaseTimeline);
router.patch("/:id", updateCase);
router.patch("/:id/cnr", restrictTo("court_staff"), updateCNR);

export default router;