// backend/models/ScamReport.js

import mongoose from "mongoose";

const scamReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    noticeText: {
      type: String,
      required: true,
    },

    noticeFile: String,

    isScam: {
      type: Boolean,
      required: true,
    },

    scamType: {
      type: String,
      enum: [
        "fake_court_notice",
        "fake_police_notice",
        "fake_tax_notice",
        "fake_legal_threat",
        "impersonation",
        "payment_fraud",
        "other",
      ],
    },

    detectedPatterns: [
      {
        type: String,
      },
    ],

    authenticityScore: {
      type: Number,
      min: 1,
      max: 10,
    },

    aiAnalysis: String,

    redFlags: [String],

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified_scam", "verified_genuine", "disputed"],
      default: "pending",
    },

    actionTaken: String,

    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("ScamReport", scamReportSchema);