// backend/routes/caseRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  addSavedCase,
  getSavedCases,
  getSavedCaseById,
  deleteSavedCase,
  updateSavedCase,
} from "../controllers/savedCaseController.js";

import {
  trackByCredentials,
  trackByCNR,
  trackSavedCase,
  trackCase,
  trackCaseById,
  getCaptcha
} from "../controllers/trackController.js";

const router = express.Router();
router.get("/captcha", getCaptcha);

router.use(protect);

// ── Track routes ───────────────────────────────────────────
router.post("/track",     trackByCredentials);
router.post("/track/cnr", trackByCNR);

// ── Saved Cases — specific before param ───────────────────
router.get("/saved",          getSavedCases);
router.post("/saved",         addSavedCase);
router.get("/saved/:id/track", trackSavedCase);
router.get("/saved/:id",      getSavedCaseById);
router.patch("/saved/:id",    updateSavedCase);
router.delete("/saved/:id",   deleteSavedCase);

export default router;