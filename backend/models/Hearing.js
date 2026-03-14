// backend/models/Hearing.js
import mongoose from "mongoose";

const hearingSchema = new mongoose.Schema(
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
    hearingDate: {
      type: Date,
      required: true,
    },
    hearingTime: {
      type: String,
      default: "10:00 AM",
    },
    courtRoom: {
      type: String,
      default: null,
    },
    judgeName: {
      type: String,
      default: null,
    },
    purpose: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Postponed", "Cancelled"],
      default: "Scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Hearing", hearingSchema);