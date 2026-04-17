// backend/routes/lawyerRoutes.js

import express from "express";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  browseLawyers,
  getLawyerProfile,
  sendRequest,
  getMyRequests,
  cancelRequest,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  submitReview,
  getLawyerReviews,
} from "../controllers/lawyerController.js";

const router = express.Router();

// Development only debug route
if (process.env.NODE_ENV === "development") {
  router.get("/debug", protect, async (req, res) => {
    const allLawyers = await User.find({ role: "lawyer" })
      .select("name specialization district verificationStatus");
    res.json({ count: allLawyers.length, lawyers: allLawyers });
  });
}

router.get("/browse", protect, browseLawyers);
router.get("/profile/:id", protect, getLawyerProfile);
router.post("/request", protect, sendRequest);
router.get("/my-requests", protect, getMyRequests);
router.delete("/request/:id", protect, cancelRequest);

router.post("/appointment", protect, bookAppointment);
router.get("/appointments", protect, getMyAppointments);
router.patch("/appointment/:id/cancel", protect, cancelAppointment);

router.post("/review/:lawyerId", protect, submitReview);
router.get("/reviews/:lawyerId", protect, getLawyerReviews);

export default router;