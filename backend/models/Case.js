// backend/models/Case.js
import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    caseType: {
      type: String,
      enum: [
        "Civil Dispute",
        "Property",
        "Criminal",
        "Family",
        "Contract",
        "Consumer",
        "Employment",
        "Other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Resolved", "Closed", "Dismissed"],
      default: "Pending",
    },
    assignedLawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedJudge: {
      type: String,
      default: null,
    },
    courtName: {
      type: String,
      default: null,
    },
    filingDate: {
      type: Date,
      default: Date.now,
    },
    nextHearingDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-generate caseId before saving
caseSchema.pre("save", async function () {
  if (!this.caseId) {
    const count = await mongoose.model("Case").countDocuments();
    const num = String(count + 1).padStart(4, "0");
    this.caseId = `#LM-${new Date().getFullYear()}-${num}`;
  }
});

export default mongoose.model("Case", caseSchema);