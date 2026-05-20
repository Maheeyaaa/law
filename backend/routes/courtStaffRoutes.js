// backend/routes/courtStaffRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  getCourtStaffDashboard,
  getCourtCases,
  getCourtCaseDetails,
  updateCaseStatus,
  assignLawyerToCase,
  removeLawyerFromCase,
  getAvailableLawyers,
} from "../controllers/courtStaffController.js";

const router = express.Router();

// All routes require authentication + court_staff role
router.use(protect);
router.use(restrictTo("court_staff"));

// ── Dashboard ──────────────────────────────────────────────
router.get("/dashboard", getCourtStaffDashboard);

// ── Cases ──────────────────────────────────────────────────
router.get("/cases", getCourtCases);
router.get("/cases/:id", getCourtCaseDetails);
router.patch("/cases/:id/status", updateCaseStatus);
router.patch("/cases/:id/assign-lawyer", assignLawyerToCase);
router.patch("/cases/:id/remove-lawyer", removeLawyerFromCase);

// ── Lawyers ────────────────────────────────────────────────
router.get("/available-lawyers", getAvailableLawyers);

export default router;