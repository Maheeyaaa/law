import mongoose from "mongoose";

const scamReportSchema =
new mongoose.Schema(
{
  reportedBy: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref:
      "User",

    required:
      true,
  },

  noticeText: {
    type:
      String,

    required:
      true,
  },

  noticeFile: {
    type:
      String,

    default:
      null,
  },

  isScam: {
    type:
      Boolean,

    required:
      true,
  },

  scamType: {
    type:
      String,

    enum: [
      "fake_notice",

      "fake_identity",

      "fake_authority",

      "payment_fraud",

      "impersonation",

      "other",
    ],
  },

  detectedPatterns:
  [
    String,
  ],

  authenticityScore:
  {
    type:
      Number,

    min:
      1,

    max:
      10,
  },

  aiAnalysis:
  {
    type:
      String,

      default:
      "",
  },

  redFlags:
  [
    String,
  ],

  reviewed:
  {
    type:
      Boolean,

      default:
      false,
  },

  adminNote:
  {
    type:
      String,

      default:
      "",
  },
},
{
  timestamps:
    true,
}
);

scamReportSchema.index({
  reportedBy: 1,

  createdAt: -1,
});

export default mongoose.model(
  "ScamReport",
  scamReportSchema
);