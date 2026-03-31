// backend/routes/analyticsRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import UserAnalytics from "../models/UserAnalytics.js";
import ScamReport from "../models/ScamReport.js";
import ScamPattern from "../models/ScamPattern.js";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import CasePrediction from "../models/CasePrediction.js";

const router = express.Router();

// ═══════════════════════════════════════
// User's Personal Stats
// ═══════════════════════════════════════
router.get("/my-stats", protect, async (req, res) => {
  try {
    let analytics = await UserAnalytics.findOne({ user: req.user.id });

    if (!analytics) {
      analytics = await UserAnalytics.create({ user: req.user.id });
    }

    const totalChats = await ChatMessage.countDocuments({ user: req.user.id });
    const sessions = await ChatMessage.distinct("sessionId", {
      user: req.user.id,
    });

    // Get user's scam reports
    const myScamReports = await ScamReport.find({
      reportedBy: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        memberSince: req.user.createdAt,
      },
      analytics: {
        featureUsage: analytics.featureUsage,
        scamStats: analytics.scamStats,
        totalSessions: analytics.totalSessions,
        totalMessages: totalChats,
        uniqueSessions: sessions.length,
        totalPDFsUploaded: analytics.totalPDFsUploaded,
        totalOCRProcessed: analytics.totalOCRProcessed,
        lastActive: analytics.lastActive,
        lastFeatureUsed: analytics.lastFeatureUsed,
      },
      recentScamReports: myScamReports.slice(0, 5).map((report) => ({
        id: report._id,
        isScam: report.isScam,
        score: report.authenticityScore,
        detectedAt: report.createdAt,
        redFlagsCount: report.redFlags.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════
// Global Statistics (Admin/Public)
// ═══════════════════════════════════════
router.get("/global-stats", protect, async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      verificationStatus: "approved",
    });

    // User breakdown by role
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Total messages
    const totalChats = await ChatMessage.countDocuments();

    // All analytics
    const allAnalytics = await UserAnalytics.find();

    // Aggregate feature usage
    const globalFeatureUsage = allAnalytics.reduce(
      (acc, userAnalytics) => {
        Object.keys(userAnalytics.featureUsage).forEach((feature) => {
          acc[feature] =
            (acc[feature] || 0) + userAnalytics.featureUsage[feature];
        });
        return acc;
      },
      {}
    );

    const totalPredictions = await CasePrediction.countDocuments();
    const predictionsByVerdict = await CasePrediction.aggregate([
      { $group: { _id: "$prediction.verdict", count: { $sum: 1 } } },
    ]);

    // Aggregate scam stats
    const globalScamStats = allAnalytics.reduce(
      (acc, userAnalytics) => {
        acc.totalScansPerformed +=
          userAnalytics.scamStats.totalScansPerformed || 0;
        acc.scamsDetected += userAnalytics.scamStats.scamsDetected || 0;
        acc.genuineNoticesVerified +=
          userAnalytics.scamStats.genuineNoticesVerified || 0;
        acc.suspiciousNotices += userAnalytics.scamStats.suspiciousNotices || 0;
        return acc;
      },
      {
        totalScansPerformed: 0,
        scamsDetected: 0,
        genuineNoticesVerified: 0,
        suspiciousNotices: 0,
      }
    );

    // Total PDFs
    const totalPDFs = allAnalytics.reduce(
      (sum, a) => sum + a.totalPDFsUploaded,
      0
    );
    const totalOCR = allAnalytics.reduce(
      (sum, a) => sum + a.totalOCRProcessed,
      0
    );

    // Most detected scam patterns
    const scamPatterns = await ScamPattern.find()
      .sort({ reportCount: -1 })
      .limit(10);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      usage: {
        totalMessages: totalChats,
        totalPDFsUploaded: totalPDFs,
        totalOCRProcessed: totalOCR,
        featureUsage: globalFeatureUsage,
        totalPredictions,
      },
      predictionStats: {  // ⭐ ADD
        total: totalPredictions,
        byVerdict: predictionsByVerdict,
      },
      scamDetection: globalScamStats,
      topScamPatterns: scamPatterns.map((p) => ({
        pattern: p.pattern,
        description: p.description,
        severity: p.severity,
        detectedCount: p.reportCount,
      })),
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════
// Scam Detection Trends
// ═══════════════════════════════════════
router.get("/scam-trends", protect, async (req, res) => {
  try {
    // Get scam reports from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = await ScamReport.find({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Group by day
    const trendsByDay = {};

    recentReports.forEach((report) => {
      const day = report.createdAt.toISOString().split("T")[0];
      if (!trendsByDay[day]) {
        trendsByDay[day] = { scams: 0, genuine: 0, suspicious: 0 };
      }

      if (report.authenticityScore <= 3) {
        trendsByDay[day].scams += 1;
      } else if (report.authenticityScore >= 8) {
        trendsByDay[day].genuine += 1;
      } else {
        trendsByDay[day].suspicious += 1;
      }
    });

    res.json({ trendsByDay });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;