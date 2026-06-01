// backend/models/SavedCase.js
import mongoose from "mongoose";

const savedCaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    court: {
      type: String,
      required: true,
      trim: true,
    },
    caseType: {
      type: String,
      required: true,
      trim: true,
    },
    mtype: {
      type: Number,
      required: true,
    },
    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // CNR = Case Number Record (16 digit unique ID for every Indian court case)
    cnrNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    lastTrackedAt: {
      type: Date,
      default: null,
    },
    cachedTrackingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

savedCaseSchema.index(
  {
    user: 1,
    court: 1,
    caseType: 1,
    caseNumber: 1,
    year: 1,
  },
  { unique: true }
);
savedCaseSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("SavedCase", savedCaseSchema);