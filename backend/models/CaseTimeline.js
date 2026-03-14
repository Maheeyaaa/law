// backend/models/CaseTimeline.js

import mongoose from "mongoose";

const caseTimelineSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "case_filed",
        "under_review",
        "lawyer_assigned",
        "hearing_scheduled",
        "hearing_completed",
        "document_uploaded",
        "document_verified",
        "status_changed",
        "judgment",
        "resolved",
        "general",
      ],
      default: "general",
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CaseTimeline", caseTimelineSchema);