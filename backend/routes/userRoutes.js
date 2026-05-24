import express from "express";

import {
  registerUser,
  loginUser,
} from "../controllers/userController.js";

import protect from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  validateUserLocation,
} from "../middleware/telanganaValidation.js";

const router =
  express.Router();

// ======================
// Auth
// ======================

router.post(
  "/register",

  upload.single(
    "avatar"
  ),

  validateUserLocation,

  registerUser
);

router.post(
  "/login",

  (req, res) => {
    req.body.allowedRole =
      "citizen";

    loginUser(
      req,
      res
    );
  }
);

router.post(
  "/admin/login",

  (req, res) => {
    req.body.allowedRole =
      "admin";

    loginUser(
      req,
      res
    );
  }
);

// ======================
// Profile
// ======================

router.get(
  "/profile",

  protect,

  (
    req,
    res
  ) => {
    res.json({
      user:
        req.user,
    });
  }
);

export default router;