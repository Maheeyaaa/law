// backend/models/ChatMessage.js

import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);