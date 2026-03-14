// backend/routes/lawyerRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  browseLawyers,
  getLawyerProfile,
  sendRequest,
  getMyRequests,
  cancelRequest,
} from "../controllers/lawyerController.js";

const router = express.Router();

// Browse lawyers (protected - need to be logged in)
router.get("/browse", protect, browseLawyers);

// Get lawyer profile
router.get("/profile/:id", protect, getLawyerProfile);

// Send request to lawyer
router.post("/request", protect, sendRequest);

// Get my sent requests
router.get("/my-requests", protect, getMyRequests);

// Cancel a pending request
router.delete("/request/:id", protect, cancelRequest);

export default router;