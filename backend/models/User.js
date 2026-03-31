// backend/models/User.js

import mongoose from "mongoose";

// Telangana districts - easy to expand later for multi-state
const TELANGANA_DISTRICTS = [
  "Hyderabad",
  "Rangareddy",
  "Medchal-Malkajgiri",
  "Sangareddy",
  "Vikarabad",
  "Warangal Urban",
  "Warangal Rural",
  "Hanumakonda",
  "Khammam",
  "Nalgonda",
  "Karimnagar",
  "Nizamabad",
  "Adilabad",
  "Komaram Bheem Asifabad",
  "Mancherial",
  "Peddapalli",
  "Jagtial",
  "Rajanna Sircilla",
  "Kamareddy",
  "Medak",
  "Siddipet",
  "Jangaon",
  "Mahabubabad",
  "Warangal",
  "Suryapet",
  "Yadadri Bhuvanagiri",
  "Mahabubnagar",
  "Nagarkurnool",
  "Wanaparthy",
  "Jogulamba Gadwal",
  "Narayanpet",
  "Mulugu",
  "Jayashankar Bhupalpally",
  "Bhadradri Kothagudem",
];

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,

    role: {
      type: String,
      enum: ["citizen", "lawyer", "Court Staff"],
    },

    // Location fields
    state: {
      type: String,
      default: "Telangana",
    },
    district: {
      type: String,
      default: "",
    },

    // Lawyer-specific fields
    barCouncilNumber: String,
    specialization: String,
    experience: Number,
    licenseDocument: String,

    languages: {
      type: [String],
      default: [],
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "approved",
    },

    // Profile fields
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export { TELANGANA_DISTRICTS };
export default mongoose.model("User", userSchema);