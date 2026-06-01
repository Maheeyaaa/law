// backend/models/Conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Auto-generated or user-defined title
    title: {
      type: String,
      default: "New Conversation",
      trim: true,
      maxlength: 120,
    },

    // Which AI feature this conversation belongs to
    type: {
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

    // Last message preview for sidebar
    lastMessage: {
      type: String,
      default: "",
      maxlength: 200,
    },

    // Total messages in this conversation
    messageCount: {
      type: Number,
      default: 0,
    },

    // Is this conversation pinned by user
    isPinned: {
      type: Boolean,
      default: false,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // When last message was sent
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast user conversation lookup
conversationSchema.index({ user: 1, isDeleted: 1, lastActivityAt: -1 });
conversationSchema.index({ user: 1, isPinned: -1, lastActivityAt: -1 });

export default mongoose.model("Conversation", conversationSchema);