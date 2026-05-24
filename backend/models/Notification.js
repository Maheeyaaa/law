import mongoose from "mongoose";

const notificationSchema =
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

  title: {
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

  type: {
    type:
      String,

    enum: [
      "case",

      "document",

      "support",

      "voice",

      "ai",

      "system",
    ],

    default:
      "system",
  },

  read: {
    type:
      Boolean,

    default:
      false,
  },

  link: {
    type:
      String,

    default:
      null,
  },
},
{
  timestamps:
    true,
}
);

notificationSchema.index({
  citizen: 1,

  read: 1,

  createdAt: -1,
});

export default mongoose.model(
  "Notification",
  notificationSchema
);