import express from "express";
import { registerUser, loginUser, getPendingLawyers, approveLawyer, getApprovedLawyers } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

router.post("/register", upload.single("licenseDocument"), registerUser);
router.post("/login", loginUser);
router.get("/pending-lawyers", protect, getPendingLawyers);
router.patch("/approve-lawyer/:id", protect, approveLawyer);
router.get("/lawyers", getApprovedLawyers);

export default router;