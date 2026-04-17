// backend/models/Case.js

import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

// Telangana courts - easy to expand later for multi-state
const TELANGANA_COURTS = [
  // High Court
  "Telangana High Court, Hyderabad",

  // District Courts
  "District Court, Hyderabad",
  "City Civil Court, Hyderabad",
  "City Criminal Court, Hyderabad",
  "District Court, Rangareddy",
  "District Court, Medchal-Malkajgiri",
  "District Court, Sangareddy",
  "District Court, Vikarabad",
  "District Court, Warangal",
  "District Court, Hanumakonda",
  "District Court, Khammam",
  "District Court, Nalgonda",
  "District Court, Karimnagar",
  "District Court, Nizamabad",
  "District Court, Adilabad",
  "District Court, Mancherial",
  "District Court, Peddapalli",
  "District Court, Jagtial",
  "District Court, Rajanna Sircilla",
  "District Court, Kamareddy",
  "District Court, Medak",
  "District Court, Siddipet",
  "District Court, Jangaon",
  "District Court, Mahabubabad",
  "District Court, Suryapet",
  "District Court, Yadadri Bhuvanagiri",
  "District Court, Mahabubnagar",
  "District Court, Nagarkurnool",
  "District Court, Wanaparthy",
  "District Court, Jogulamba Gadwal",
  "District Court, Narayanpet",
  "District Court, Mulugu",
  "District Court, Jayashankar Bhupalpally",
  "District Court, Bhadradri Kothagudem",

  // Special Courts
  "Family Court, Hyderabad",
  "Consumer Court, Hyderabad",
  "Labour Court, Hyderabad",
  "Small Causes Court, Hyderabad",
  "Metropolitan Magistrate Court, Hyderabad",

  // Tribunals
  "Telangana State Consumer Disputes Redressal Commission",
  "Telangana Administrative Tribunal",
];

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
    },
    cnrNumber: {
      type: String,
      default: null,
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
      enum: ["Draft", "Filed", "Active", "Pending", "Resolved", "Closed", "Dismissed"],
      default: "Draft",
    },

    // Location fields (Telangana specific, future-proof for multi-state)
    state: {
      type: String,
      default: "Telangana",
    },
    district: {
      type: String,
      default: "",
    },
    courtName: {
      type: String,
      default: "",
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
    filingDate: {
      type: Date,
      default: Date.now,
    },
    courtFilingDate: {
      type: Date,
      default: null,
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

// Auto-generate caseId with TS (Telangana State) prefix
caseSchema.pre("save", async function () {
  if (!this.caseId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.caseId = `#TS-${new Date().getFullYear()}-${timestamp}-${random}`;
  }
});

caseSchema.index({ citizen: 1, status: 1 });
caseSchema.index({ assignedLawyer: 1 });
caseSchema.index({ caseType: 1, district: 1 });

export { TELANGANA_COURTS };
export default mongoose.model("Case", caseSchema);