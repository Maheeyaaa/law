// backend/routes/predictionRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  predictCaseOutcome,
  getPredictionHistory,
} from "../controllers/predictionController.js";

const router = express.Router();

router.use(protect);

router.post("/predict", predictCaseOutcome);
router.get("/history", getPredictionHistory);

export default router;