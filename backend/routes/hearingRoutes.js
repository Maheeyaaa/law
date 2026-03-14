// backend/routes/hearingRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMyHearings,
  getNextHearing,
  getHearingById,
} from "../controllers/hearingController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyHearings);
router.get("/next", getNextHearing);
router.get("/:id", getHearingById);

export default router;