import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

  role: {
    type: String,
    enum: ["citizen", "lawyer", "Court Staff"]
  },

  barCouncilNumber: String,
  specialization: String,
  experience: Number,

  licenseDocument: String,

  verificationStatus: {
    type: String,
    enum: ["pending", "approved"],
    default: "approved"
  }
});

export default mongoose.model("User", userSchema);