import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createCase,
  getMyCases,
  getCaseById,
  updateCase,
  getCaseStats,
  getCaseTimeline,
  updateCNR,
} from "../controllers/caseController.js";

const router = express.Router();

router.use(protect);

router.post("/", createCase);
router.get("/", getMyCases);
router.get("/stats", getCaseStats);
router.get("/:id", getCaseById);
router.get("/:id/timeline", getCaseTimeline);
router.patch("/:id", updateCase);
router.patch("/:id/cnr", updateCNR);

export default router;