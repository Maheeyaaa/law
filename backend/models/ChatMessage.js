import mongoose from "mongoose";

const chatMessageSchema =
new mongoose.Schema(
{
  user: {
    type:
      mongoose.Schema
        .Types
        .ObjectId,

    ref:
      "User",

    required:
      true,
  },

  role: {
    type:
      String,

    enum: [
      "user",

      "assistant",
    ],

    required:
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

  sessionId: {
    type:
      String,

    required:
      true,
  },
},
{
  timestamps:
    true,
}
);

// Faster history lookup

chatMessageSchema.index({
  user: 1,

  sessionId: 1,

  createdAt: -1,
});

export default mongoose.model(
  "ChatMessage",
  chatMessageSchema
);