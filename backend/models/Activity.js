// backend/models/Activity.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "case_filed",
        "case_updated",
        "hearing_scheduled",
        "hearing_notice",
        "document_uploaded",
        "document_verified",
        "lawyer_assigned",
        "status_changed",
        "general",
      ],
      default: "general",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);