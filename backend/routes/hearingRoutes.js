// backend/routes/hearingRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  getMyHearings,
  getNextHearing,
  getHearingById,
  createHearing,
  updateHearing,
  cancelHearing,
  requestReschedule,
} from "../controllers/hearingController.js";

const router = express.Router();

router.use(protect);

// ── Citizen routes ─────────────────────────────────────────
router.get("/", getMyHearings);
router.get("/next", getNextHearing);
router.get("/:id", getHearingById);
router.post("/:id/reschedule-request", restrictTo("citizen"), requestReschedule);

// ── Court Staff routes ─────────────────────────────────────
router.post("/", restrictTo("court_staff"), createHearing);
router.patch("/:id", restrictTo("court_staff"), updateHearing);
router.delete("/:id", restrictTo("court_staff"), cancelHearing);

export default router;