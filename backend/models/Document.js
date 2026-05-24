import mongoose from "mongoose";

const documentSchema =
new mongoose.Schema(
{
  citizen: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref:
      "User",

    required:
      true,
  },

  case: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref:
      "Case",

    default:
      null,
  },

  name: {
    type:
      String,

    required:
      true,
  },

  originalName: {
    type:
      String,

    required:
      true,
  },

  filePath: {
    type:
      String,

    required:
      true,
  },

  fileType: {
    type:
      String,

    default:
      "FILE",
    },

  fileSize: {
    type:
      Number,

    default:
      0,
  },

  purpose: {
    type:
      String,

    enum: [
      "notice_explanation",

      "scam_detection",

      "storage",

      "general",
    ],

    default:
      "general",
  },

  aiProcessed: {
    type:
      Boolean,

    default:
      false,
  },

  uploadDate: {
    type:
      Date,

    default:
      Date.now,
  },
},
{
  timestamps:
    true,
}
);

documentSchema.index({
  citizen: 1,

  createdAt: -1,
});

export default mongoose.model(
  "Document",
  documentSchema
);