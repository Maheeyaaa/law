// backend/models/Notification.js

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    citizen: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    title: {
      type:     String,
      required: true,
      trim:     true,
    },

    message: {
      type:     String,
      required: true,
      trim:     true,
    },

    // ── Type & SubType ──────────────────────────────────────
    type: {
      type: String,
      enum: [
        "case",
        "document",
        "support",
        "voice",
        "ai",
        "system",
        "hearing_reminder",   // NEW: hearing date approaching
        "case_update",        // NEW: detected change in case
      ],
      default: "system",
    },

    // Granular subtype for filtering / icons
    subType: {
      type: String,
      enum: [
        "hearing_7day",
        "hearing_1day",
        "hearing_today",
        "status_change",
        "next_date_change",
        "judge_change",
        "new_history_entry",
        null,
      ],
      default: null,
    },

    // ── Link To Related Case (NEW) ──────────────────────────
    relatedCase: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "SavedCase",
      default: null,
    },

    // Store before/after change details
    changeDetails: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Read Status ─────────────────────────────────────────
    read: {
      type:    Boolean,
      default: false,
    },

    link: {
      type:    String,
      default: null,
    },

    // ── Push Delivery Tracking (NEW) ────────────────────────
    pushSent: {
      type:    Boolean,
      default: false,
    },
    pushSentAt: {
      type:    Date,
      default: null,
    },
    pushError: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────
notificationSchema.index({ citizen: 1, read: 1, createdAt: -1 });
notificationSchema.index({ citizen: 1, type: 1 });
notificationSchema.index({ relatedCase: 1 });
notificationSchema.index({ pushSent: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);