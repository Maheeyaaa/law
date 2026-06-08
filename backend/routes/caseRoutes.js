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

const router = express.Router();
router.use(protect);

// ── Saved Cases ────────────────────────────────────────────
router.get("/saved",         getSavedCases);
router.post("/saved",        addSavedCase);
router.get("/saved/:id",     getSavedCaseById);
router.patch("/saved/:id",   updateSavedCase);
router.delete("/saved/:id",  deleteSavedCase);

export default router;