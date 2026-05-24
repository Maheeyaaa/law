import mongoose from "mongoose";

const faqSchema =
new mongoose.Schema(
{
  question: {
    type:
      String,

    required:
      true,
  },

  answer: {
    type:
      String,

    required:
      true,
  },

  category: {
    type:
      String,

    enum: [
      "General",

      "AI Assistance",

      "Documents",

      "Voice Assistance",

      "Account",

      "Support",
    ],

    default:
      "General",
  },

  order: {
    type:
      Number,

    default:
      0,
  },
},
{
  timestamps:
    true,
}
);

faqSchema.index({
  category: 1,

  order: 1,
});

export default mongoose.model(
  "FAQ",
  faqSchema
);