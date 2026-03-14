// backend/routes/activityRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getMyActivity } from "../controllers/activityController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyActivity);

export default router;