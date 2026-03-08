import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

router.post("/register", registerUser);
router.post("/login", loginUser);



export default router;