// backend/models/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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

  // Lawyer-specific fields
  barCouncilNumber: String,
  specialization: String,
  experience: Number,
  licenseDocument: String,

  verificationStatus: {
    type: String,
    enum: ["pending", "approved"],
    default: "approved",
  },

  // NEW — Profile fields for all users
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
}, { timestamps: true });

export default mongoose.model("User", userSchema);