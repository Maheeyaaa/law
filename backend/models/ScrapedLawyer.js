import mongoose from "mongoose";

const scrapedLawyerSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────
    name:  { type: String, required: true, index: true },
    photo: { type: String, default: null },

    // ── Contact ───────────────────────────────────────────────
    email:  { type: String, default: null },
    phone:  { type: String, default: null },
    phones: [{ type: String }],

    // ── Professional ─────────────────────────────────────────
    specialization:  { type: String, default: "General Practice", index: true },
    specializations: [{ type: String }],
    experience:      { type: Number, default: 0 },
    bio:             { type: String, default: "" },
    education:       [{ type: String }],

    // ── Location ──────────────────────────────────────────────
    district: { type: String, index: true },
    city:     { type: String },
    state:    { type: String, default: "Telangana" },

    // ── Source Tracking ───────────────────────────────────────
    source:     [{ type: String, enum: ["freelaw", "admin"] }],
    sourceUrl:  { type: String },
    profileUrl: { type: String },
    advocateId: { type: String }, // FreeLaw internal ID

    // ── Status ────────────────────────────────────────────────
    isVerified:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    lastScraped: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────
scrapedLawyerSchema.index({ district: 1, specialization: 1 });
scrapedLawyerSchema.index({ name: "text", bio: "text" });

export default mongoose.model("ScrapedLawyer", scrapedLawyerSchema);