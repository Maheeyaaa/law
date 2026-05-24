import mongoose from "mongoose";

const activitySchema =
new mongoose.Schema(
{
  citizen: {
    type:
      mongoose.Schema
        .Types
        .ObjectId,

    ref:
      "User",

    required:
      true,
  },

  case: {
    type:
      mongoose.Schema
        .Types
        .ObjectId,

    ref:
      "Case",

    default:
      null,
  },

  text: {
    type:
      String,

    required:
      true,

    trim:
      true,
  },

  type: {
    type:
      String,

    enum: [
      "case_created",

      "case_updated",

      "document_uploaded",

      "document_deleted",

      "ai_used",

      "voice_used",

      "profile_updated",

      "support",

      "general",
    ],

    default:
      "general",
  },
},
{
  timestamps:
    true,
}
);

activitySchema.index({
  citizen: 1,

  createdAt: -1,
});

export default mongoose.model(
  "Activity",
  activitySchema
);