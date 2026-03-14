// backend/routes/trackRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { trackCase, trackCaseById } from "../controllers/trackController.js";

const router = express.Router();

router.use(protect);

// Track by case ID string (e.g. #LM-2025-0041)
router.get("/case/:caseId", trackCase);

// Track by MongoDB _id
router.get("/id/:id", trackCaseById);

export default router;