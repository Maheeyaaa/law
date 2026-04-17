// backend/routes/lawyerPanelRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  getLawyerDashboard,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  getMyCases,
  getCaseDetails,
  updateCaseNotes,
  getLawyerAppointments,
  updateAppointmentStatus,
  getLawyerOwnProfile,
  updateLawyerProfile,
  updateAvailability,
  getLawyerNotifications,
  markNotificationRead,
} from "../controllers/lawyerPanelController.js";

const router = express.Router();

// All routes require authentication + lawyer role
router.use(protect);
router.use(restrictTo("lawyer"));

// ── Dashboard ──────────────────────────────────────────────
router.get("/dashboard", getLawyerDashboard);

// ── Requests ───────────────────────────────────────────────
router.get("/requests", getIncomingRequests);
router.patch("/requests/:id/accept", acceptRequest);
router.patch("/requests/:id/reject", rejectRequest);

// ── Cases ──────────────────────────────────────────────────
router.get("/cases", getMyCases);
router.get("/cases/:id", getCaseDetails);
router.patch("/cases/:id/notes", updateCaseNotes);

// ── Appointments ───────────────────────────────────────────
router.get("/appointments", getLawyerAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);

// ── Profile ────────────────────────────────────────────────
router.get("/profile", getLawyerOwnProfile);
router.patch("/profile", updateLawyerProfile);
router.patch("/availability", updateAvailability);

// ── Notifications ──────────────────────────────────────────
router.get("/notifications", getLawyerNotifications);
router.patch("/notifications/:id/read", markNotificationRead);

export default router;