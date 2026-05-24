import mongoose from "mongoose";

const scamPatternSchema =
new mongoose.Schema(
{
  type: {
    type:
      String,

    enum: [
      "phone_number",

      "bank_account",

      "url",

      "email",

      "keyword",

      "threat_pattern",

      "payment_pattern",

      "impersonation",
    ],

    required:
      true,
  },

  pattern: {
    type:
      String,

    required:
      true,

    trim:
      true,
  },

  description: {
    type:
      String,

    required:
      true,
  },

  severity: {
    type:
      String,

    enum: [
      "low",

      "medium",

      "high",

      "critical",
    ],

    default:
      "medium",
  },

  isRegex: {
    type:
      Boolean,

    default:
      false,
  },

  isActive: {
    type:
      Boolean,

    default:
      true,
  },

  reportCount: {
    type:
      Number,

    default:
      0,
  },

  lastReported:
  {
    type:
      Date,

      default:
      null,
  },
},
{
  timestamps:
    true,
}
);

scamPatternSchema.index({
  type: 1,

  severity: 1,
});

export default mongoose.model(
  "ScamPattern",
  scamPatternSchema
);