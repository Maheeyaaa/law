import express from "express";
import { 
  registerUser, 
  loginUser, 
  getPendingLawyers, 
  approveLawyer, 
  getApprovedLawyers 
} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { validateUserLocation } from "../middleware/telanganaValidation.js";
import { createCourtStaff } from "../controllers/userController.js";

const router = express.Router();

router.post(
  "/register", 
  upload.single("licenseDocument"),
  validateUserLocation, // ✅ Add Telangana validation
  registerUser
);

router.post("/login", loginUser);

router.post("/create-court-staff", createCourtStaff);

router.get("/lawyers", getApprovedLawyers);

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

router.get("/pending-lawyers", protect, getPendingLawyers);
router.patch("/approve-lawyer/:id", protect, approveLawyer);



export default router;