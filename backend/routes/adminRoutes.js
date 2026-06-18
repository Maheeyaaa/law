// backend/routes/adminRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  deleteUser,
  getAllLawyers,
  getLawyerById,
  addLawyer,
  updateLawyer,
  deleteLawyer,
  getSystemActivity,
  changeAdminPassword,
} from "../controllers/adminController.js";

const router = express.Router();

// ======================
// Public — Admin Login
// ======================

router.post("/login", adminLogin);

// ======================
// Protected — Admin Only
// ======================

router.use(protect);
router.use(requireAdmin);

// ── Dashboard ──────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ── Users ──────────────────────────────────────────
router.get   ("/users",             getAllUsers);
router.get   ("/users/:id",         getUserById);
router.patch ("/users/:id/ban",     banUser);
router.patch ("/users/:id/unban",   unbanUser);
router.delete("/users/:id",         deleteUser);

// ── Lawyers ────────────────────────────────────────
router.get   ("/lawyers",                getAllLawyers);
router.get   ("/lawyers/:id",            getLawyerById);
router.post  ("/lawyers",                addLawyer);
router.patch ("/lawyers/:id",            updateLawyer);
router.delete("/lawyers/:id",            deleteLawyer);

// ── Activity ───────────────────────────────────────
router.get("/activity", getSystemActivity);

//change password
router.patch("/change-password", changeAdminPassword);

export default router;