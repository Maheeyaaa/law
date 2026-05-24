// backend/models/Case.js

import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    // Case ID entered by citizen (their actual court case ID)
    caseId: {
      type: String,
      required: true,
    },

    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    caseType: {
      type: String,
      enum: [
        "Civil Dispute",
        "Property",
        "Criminal",
        "Family",
        "Contract",
        "Consumer",
        "Employment",
        "Other",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Resolved", "Closed", "Dismissed"],
      default: "Pending",
    },

    // Location
    state: {
      type: String,
      default: "Telangana",
    },
    district: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    notes: {
      type: String,
      default: "",
    },

    filingDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One citizen cannot register same case ID twice
caseSchema.index({ caseId: 1, citizen: 1 }, { unique: true });
caseSchema.index({ citizen: 1, status: 1 });

export default mongoose.model("Case", caseSchema);