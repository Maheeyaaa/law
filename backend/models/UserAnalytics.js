import mongoose from "mongoose";

const userAnalyticsSchema =
new mongoose.Schema(
{
  user: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref:
      "User",

    required:
      true,

    unique:
      true,
  },

  // ======================
  // Feature Usage
  // ======================

  featureUsage: {
    chatbot: {
      type:
        Number,

      default:
        0,
    },

    noticeExplanation: {
      type:
        Number,

      default:
        0,
    },

    termDecoder: {
      type:
        Number,

      default:
        0,
    },

    legalGuidance: {
      type:
        Number,

      default:
        0,
    },

    checklistGeneration: {
      type:
        Number,

      default:
        0,
    },

    legalAidCheck: {
      type:
        Number,

      default:
        0,
    },

    scamDetection: {
      type:
        Number,

      default:
        0,
    },

    voiceInput: {
      type:
        Number,

      default:
        0,
    },

    documentAnalysis: {
      type:
        Number,

      default:
        0,
    },

    lawyerSearch: {
      type:
        Number,

      default:
        0,
    },
  },

  // ======================
  // Scam Analytics
  // ======================

  scamStats: {
    totalScansPerformed: {
      type:
        Number,

      default:
        0,
    },

    scamsDetected: {
      type:
        Number,

      default:
        0,
    },

    genuineNoticesVerified: {
      type:
        Number,

      default:
        0,
    },

    suspiciousNotices: {
      type:
        Number,

      default:
        0,
    },
  },

  // ======================
  // Sessions
  // ======================

  totalSessions: {
    type:
      Number,

    default:
      0,
  },

  totalMessages: {
    type:
      Number,

      default:
      0,
  },

  // ======================
  // Documents
  // ======================

  totalDocumentsUploaded:
  {
    type:
      Number,

    default:
      0,
  },

  totalDocumentsProcessed:
  {
    type:
      Number,

    default:
      0,
  },

  // ======================
  // Activity
  // ======================

  lastActive: {
    type:
      Date,

    default:
      Date.now,
  },

  lastFeatureUsed:
  {
    type:
      String,

    default:
      null,
  },
},
{
  timestamps:
    true,
}
);

// Faster lookup

userAnalyticsSchema.index(
{
  user: 1,
}
);

export default mongoose.model(
  "UserAnalytics",
  userAnalyticsSchema
);