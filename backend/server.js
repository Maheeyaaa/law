// backend/server.js

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import dns from "dns";

import authRoutes from "./routes/authRoutes.js";        // ← replaces userRoutes
import caseRoutes from "./routes/caseRoutes.js";
import hearingRoutes from "./routes/hearingRoutes.js";
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
import predictionRoutes from "./routes/predictionRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";            // ← static import now
import { seedScamPatterns } from "./utils/scamDetector.js";

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
app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/hearings", hearingRoutes);
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
app.use("/api/prediction", predictionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

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

    // Show lawyer stats on startup
    try {
      const User = (await import("./models/User.js")).default;
      const totalLawyers = await User.countDocuments({ role: "lawyer" });
      const proBonoLawyers = await User.countDocuments({ 
        role: "lawyer", 
        importedFrom: "DoJ Pro Bono" 
      });
      const csvLawyers = await User.countDocuments({
        role: "lawyer",
        importedFrom: "CSV",
      });
      const seedLawyers = await User.countDocuments({
        role: "lawyer",
        importedFrom: { $nin: ["DoJ Pro Bono", "CSV"] },
      });

      console.log(`\n📊 Lawyer Database Status:`);
      console.log(`   Total: ${totalLawyers}`);
      console.log(`   ✅ DoJ Pro Bono: ${proBonoLawyers}`);
      console.log(`   📄 CSV Imported: ${csvLawyers}`);
      console.log(`   🌱 Seed/Registered: ${seedLawyers}`);

      // Only scrape if NO lawyers exist at all
      if (totalLawyers === 0) {
        console.log("\n🔄 No lawyers found. Starting one-time import...");
        const { scrapeProBono } = await import("./utils/scrapeProbono.js");
        const result = await scrapeProBono();
        if (result.success) {
          console.log(`✅ Imported ${result.count} Pro Bono lawyers`);
        } else {
          console.log(`⚠️ Import failed: ${result.error}`);
        }
      } else {
        console.log(`\n✅ Database ready with ${totalLawyers} lawyers\n`);
      }
    } catch (error) {
      console.log("⚠️ Startup check error:", error.message);
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
});