// backend/server.js

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import dns from "dns";

import caseRoutes from "./routes/caseRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import lawyerRoutes from "./routes/lawyerRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import scamRoutes from "./routes/scamRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import { seedScamPatterns } from "./utils/scamDetector.js";
import { initCronJobs } from "./jobs/cronManager.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files ───────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Routes ─────────────────────────────────────────────────
app.use("/api/cases", caseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/scam", scamRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/push", pushRoutes);

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "LegalMind Backend is running 🚀", status: "ok" });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── MongoDB Connection ─────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 50000,
    family: 4,
  })
  .then(async () => {
    console.log("MongoDB Connected Successfully ✅");

    // Seed scam patterns
    seedScamPatterns();

    // Show scraped lawyer stats on startup
    try {
      const ScrapedLawyer = (await import("./models/ScrapedLawyer.js")).default;
      const total    = await ScrapedLawyer.countDocuments({ isActive: true });
      const verified = await ScrapedLawyer.countDocuments({
        isActive: true,
        isVerified: true,
      });

      console.log(`\n📊 Lawyer Database Status:`);
      console.log(`   Total:    ${total}`);
      console.log(`   Verified: ${verified}`);
      console.log(`   Source:   FreeLaw\n`);
    } catch (error) {
      console.error("⚠️ Startup check error:", error.message);
    }
  })
  .catch((error) => {
    console.error("MongoDB Connection Error ❌", error.message);
    process.exit(1);
  });

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}\n`);
  initCronJobs();
});