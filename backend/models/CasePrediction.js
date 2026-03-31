// backend/models/CasePrediction.js

import mongoose from "mongoose";

const casePredictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caseType: {
      type: String,
      required: true,
    },

    // Case details
    caseDetails: {
      hasEvidence: Boolean,
      evidenceQuality: {
        type: String,
        enum: ["weak", "moderate", "strong"],
      },
      hasWitnesses: Boolean,
      witnessCount: Number,
      witnessQuality: {
        type: String,
        enum: ["weak", "moderate", "strong"],
      },
      hasLegalPrecedent: Boolean,
      opposingPartyStrength: {
        type: String,
        enum: ["weak", "moderate", "strong"],
      },
      lawyerExperience: Number,
      jurisdiction: String,
      caseDuration: String,
    },

    // Prediction results
    prediction: {
      winProbability: Number,
      verdict: {
        type: String,
        enum: ["Highly Favorable", "Favorable", "Neutral", "Unfavorable", "Highly Unfavorable"],
      },
      confidence: Number,
    },

    // Analysis
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    estimatedTimeline: String,
    estimatedCost: String,

    // AI analysis
    aiInsights: String,
  },
  { timestamps: true }
);

export default mongoose.model("CasePrediction", casePredictionSchema);