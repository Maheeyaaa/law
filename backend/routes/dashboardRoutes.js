// backend/routes/dashboardRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getDashboardData,
  globalSearch,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(protect);

router.get("/", getDashboardData);
router.get("/search", globalSearch);

export default router;