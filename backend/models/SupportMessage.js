import mongoose from "mongoose";

const supportMessageSchema =
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

  subject: {
    type:
      String,

    required:
      true,

    trim:
      true,
  },

  message: {
    type:
      String,

    required:
      true,

    trim:
      true,
  },

  status: {
    type:
      String,

    enum: [
      "open",

      "in_progress",

      "resolved",
    ],

    default:
      "open",
  },

  adminNote: {
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

supportMessageSchema.index({
  citizen: 1,

  createdAt: -1,
});

export default mongoose.model(
  "SupportMessage",
  supportMessageSchema
);