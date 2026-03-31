// backend/models/UserAnalytics.js

import mongoose from "mongoose";

const userAnalyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Feature usage tracking
    featureUsage: {
      chatbot: { type: Number, default: 0 },
      noticeExplanation: { type: Number, default: 0 },
      deadlineCalculation: { type: Number, default: 0 },
      termDecoder: { type: Number, default: 0 },
      filingGuidance: { type: Number, default: 0 },
      checklistGeneration: { type: Number, default: 0 },
      legalAidCheck: { type: Number, default: 0 },
      scamDetection: { type: Number, default: 0 },
      casePrediction: { type: Number, default: 0 },
      voiceInput: { type: Number, default: 0 },
    },

    // Scam detection stats
    scamStats: {
      totalScansPerformed: { type: Number, default: 0 },
      scamsDetected: { type: Number, default: 0 },
      genuineNoticesVerified: { type: Number, default: 0 },
      suspiciousNotices: { type: Number, default: 0 },
    },

    // Session tracking
    totalSessions: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },

    // PDF uploads
    totalPDFsUploaded: { type: Number, default: 0 },
    totalOCRProcessed: { type: Number, default: 0 },

    // Activity
    lastActive: { type: Date, default: Date.now },
    lastFeatureUsed: String,
  },
  { timestamps: true }
);

export default mongoose.model("UserAnalytics", userAnalyticsSchema);