// backend/routes/lawyerRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  browseLawyers,
  getLawyerProfile,
} from "../controllers/lawyerController.js";

const router =
  express.Router();

router.use(
  protect
);

// Citizen only
router.get(
  "/browse",
  browseLawyers
);

router.get(
  "/profile/:id",
  getLawyerProfile
);

export default router;