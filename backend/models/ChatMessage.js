// backend/models/ChatMessage.js
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Link to Conversation document
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: false, // false for backward compatibility with old messages
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Keep sessionId for backward compatibility
    sessionId: {
      type: String,
      required: true,
    },

    // Which feature generated this message
    featureType: {
      type: String,
      enum: [
        "chatbot",
        "explain_notice",
        "deadline",
        "decode_term",
        "filing_guidance",
        "checklist",
        "legal_aid",
        "scam_detection",
        "general",
      ],
      default: "chatbot",
    },

    // For file uploads (notice explanation, scam detection)
    attachmentName: {
      type: String,
      default: null,
    },

    // Token count for analytics (optional)
    tokenCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
chatMessageSchema.index({ user: 1, sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, conversation: 1, createdAt: 1 });
chatMessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);