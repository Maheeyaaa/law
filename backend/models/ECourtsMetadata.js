// backend/models/ECourtsMetadata.js
// ══════════════════════════════════════════════════════════════════
// Caches eCourts dropdown data (districts, complexes, case types)
// to avoid hammering eCourts servers on every dropdown change.
//
// TTL: 7 days — data refreshes automatically after that.
// ══════════════════════════════════════════════════════════════════

import mongoose from "mongoose";

const ecourtsMetadataSchema = new mongoose.Schema(
  {
    // Type of cached data: "districts" | "complexes" | "caseTypes"
    type: {
      type:     String,
      required: true,
      enum:     ["districts", "complexes", "caseTypes"],
      index:    true,
    },

    // Unique key for this cache entry
    // Examples:
    //   districts:  "state_29"
    //   complexes:  "state_29_dist_2"
    //   caseTypes:  "state_29_dist_2_complex_1290019"
    cacheKey: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    // Parent identifiers for easy querying
    stateCode:        { type: String, default: "29" },  // Telangana
    distCode:         { type: String },
    courtComplexCode: { type: String },

    // The cached array
    // Format: [{ code: "2", name: "Hyderabad" }, ...]
    data: {
      type:     [{ code: String, name: String }],
      required: true,
      default:  [],
    },

    // When this cache was last refreshed
    fetchedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index — auto-delete docs after 7 days
ecourtsMetadataSchema.index(
  { fetchedAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7 days
);

export default mongoose.model("ECourtsMetadata", ecourtsMetadataSchema);