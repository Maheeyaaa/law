// backend/controllers/userController.js

import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { DISTRICTS } from "../constants/telangana.js";
console.log("EMAIL CHECK:");
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("EMAIL_APP_PASSWORD exists:", !!process.env.EMAIL_APP_PASSWORD);
console.log("EMAIL_APP_PASSWORD length:", process.env.EMAIL_APP_PASSWORD?.length);

// ======================
// JWT
// ======================

const signToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ======================
// Helpers
// ======================

function generateVerificationToken() {
  // Random 64-char hex string
  return crypto.randomBytes(32).toString("hex");
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  // ← transporter is now created HERE inside the function
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"LegalMind" <${process.env.ADMIN_EMAIL}>`,
    to: email,
    subject: "Verify your LegalMind account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;
                  background:#0d1117;color:white;border-radius:12px;
                  padding:40px;border:1px solid rgba(255,255,255,0.1)">
        <h2 style="margin:0 0 8px;font-size:24px">⚖️ LegalMind</h2>
        <p style="color:rgba(255,255,255,0.5);margin:0 0 32px;font-size:14px">
          Digital Court Management System
        </p>
        <h3 style="margin:0 0 16px;font-size:20px">Verify your email address</h3>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 32px">
          Thank you for registering with LegalMind.
          Click the button below to verify your email and activate your account.
          This link expires in <strong>24 hours</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 32px;
                    background:#ffffff;color:#000000;
                    border-radius:8px;font-weight:bold;
                    font-size:16px;text-decoration:none">
            ✓ Verify My Account
          </a>
        </div>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;
                  border-top:1px solid rgba(255,255,255,0.1);
                  padding-top:24px;margin:32px 0 0;line-height:1.6">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${verifyUrl}"
             style="color:rgba(255,255,255,0.6);word-break:break-all">
            ${verifyUrl}
          </a>
        </p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:16px 0 0">
          If you didn't create a LegalMind account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// ======================
// Register
// ======================

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, district } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (district && !DISTRICTS.includes(district)) {
      return res.status(400).json({ message: "Invalid district" });
    }

    // Already verified — block re-registration
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken       = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (existing && !existing.isVerified) {
      // Resend verification to existing unverified user
      existing.name                    = name;
      existing.password                = hashedPassword;
      existing.district                = district || "Hyderabad";
      existing.verificationToken       = verificationToken;
      existing.verificationTokenExpiry = verificationTokenExpiry;
      await existing.save();
    } else {
      // Create new unverified user
      await User.create({
        name,
        email,
        password:                hashedPassword,
        role:                    "citizen",
        state:                   "Telangana",
        district:                district || "Hyderabad",
        isVerified:              false,
        verificationToken,
        verificationTokenExpiry,
      });
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      message: "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("[registerUser]", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ======================
// Verify Email (link click)
// ======================

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification link" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({
        message: "Verification link has expired. Please register again.",
        expired: true,
        email: user.email,
      });
    }

    // Activate account
    user.isVerified              = true;
    user.verificationToken       = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("[verifyEmail]", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ======================
// Resend Verification Email
// ======================

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const verificationToken       = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken       = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Verification email resent successfully!" });
  } catch (error) {
    console.error("[resendVerification]", error);
    res.status(500).json({ message: "Failed to resend verification email" });
  }
};

// ======================
// Login
// ======================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    const allowedRole = req.body.allowedRole;
    if (allowedRole && user && user.role !== allowedRole) {
      return res.status(403).json({
        message: `Please login through ${user.role} portal`,
      });
    }

    if (user && !["citizen", "admin"].includes(user.role)) {
      return res.status(403).json({
        message: "This account type is no longer supported",
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Block unverified users
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox.",
        needsVerification: true,
        email,
      });
    }

    if (user.isBanned || !user.isActive) {
      return res.status(403).json({ message: "Account is disabled." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken(user._id, user.role);
    const data  = user.toObject();
    delete data.password;

    res.json({ message: "Login successful", token, user: data });
  } catch (error) {
    console.error("[loginUser]", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ======================
// Profile
// ======================

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};