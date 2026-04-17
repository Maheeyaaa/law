// models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },
    lawyerRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawyerRequest",
      default: null,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ["in_person", "video_call", "phone_call"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
    meetingLink: {
      type: String,
      default: null, // for video calls
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);