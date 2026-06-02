// backend/models/SavedCase.js
import mongoose from "mongoose";
import { PROVIDERS, getCourtConfig } from "../constants/courtRegistry.js";

const savedCaseSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // ── Court Identity ─────────────────────────────────────────
    court: {
      type:     String,
      required: true,
      trim:     true,
    },

    // NEW: which tracking provider handles this court
    provider: {
      type:    String,
      enum:    Object.values(PROVIDERS),
      default: PROVIDERS.TELANGANA_HC,
    },

    // NEW: court code from registry (e.g. "18001" for eCourts, "TSHC" for HC)
    courtCode: {
      type:    String,
      default: "",
      trim:    true,
    },

    courtComplex: {
      type:    String,
      default: "",
      trim:    true,
    },

    // NEW: eCourts state code (e.g. "18" for Telangana)
    stateCode: {
      type:    String,
      default: "18",
      trim:    true,
    },

    // NEW: eCourts district code (e.g. "01" for Hyderabad)
    districtCode: {
      type:    String,
      default: "",
      trim:    true,
    },

    // ── Case Identity ──────────────────────────────────────────
    caseType: {
      type:     String,
      required: true,
      trim:     true,
    },

    // mtype: used by TSHC. For eCourts it maps to case_type param.
    mtype: {
      type:    Number,
      default: 0,
    },

    caseNumber: {
      type:     String,
      required: true,
      trim:     true,
    },

    year: {
      type:     Number,
      required: true,
    },

    // CNR = 16-char unique case ID across all Indian courts
    cnrNumber: {
      type:      String,
      default:   "",
      trim:      true,
      uppercase: true,
    },

    distCode:    { type: String, default: "" },   // e.g. "2" (Hyderabad)
    distName:    { type: String, default: "" },   // e.g. "Hyderabad"
    complexCode: { type: String, default: "" },   // e.g. "1290019"
    complexName: { type: String, default: "" },

    // ── User Label ─────────────────────────────────────────────
    label: {
      type:      String,
      default:   "",
      trim:      true,
      maxlength: 100,
    },

    // ── Caching ────────────────────────────────────────────────
    lastTrackedAt: {
      type:    Date,
      default: null,
    },

    cachedTrackingData: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────
savedCaseSchema.index(
  { user: 1, court: 1, caseType: 1, caseNumber: 1, year: 1 },
  { unique: true }
);
savedCaseSchema.index({ user: 1, createdAt: -1 });
savedCaseSchema.index({ user: 1, provider: 1 });   // NEW: filter by provider

savedCaseSchema.pre("save", function () {
  if (!this.isModified("court") && !this.isNew) {
    return;
  }

  try {
    // ✅ Try registry first (for legacy hardcoded courts)
    const config = getCourtConfig(this.court);

    if (config) {
      this.provider     = config.provider     || this.provider;
      this.courtCode    = config.courtCode    || this.courtCode    || "";
      this.stateCode    = config.stateCode    || this.stateCode    || "29";
      this.districtCode = config.districtCode || this.districtCode || "";
      return;
    }

    // ✅ NEW — Fallback: detect provider from court name pattern
    //    (for dynamic eCourts court names like "HYD, City Civil Court Complex, Hyderabad")
    if (this.court?.toLowerCase().includes("high court")) {
      this.provider  = PROVIDERS.TELANGANA_HC;
      this.stateCode = this.stateCode || "29";
    } else {
      this.provider  = PROVIDERS.ECOURTS;
      this.stateCode = this.stateCode || "29";
    }

  } catch (e) {
    console.error("SavedCase pre-save error:", e.message);
  }
});

export default mongoose.model("SavedCase", savedCaseSchema);