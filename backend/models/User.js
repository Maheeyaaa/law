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
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["citizen", "lawyer", "court_Staff"], required: true },

    // Location fields
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
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    importedFrom: {
      type: String,
      default: null,
    },
    scrapedFrom: {
      type: String,
      default: null,
    },
    dataSource: {
      type: String,
      default: null,
    },
    proBonoRegistrationNo: {
      type: String,
      default: null,
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

    // 🆕 Additional lawyer fields for enhanced functionality
    education: {
      type: [String],
      default: [],
    },
    courtsPracticing: {
      type: [String],
      default: [],
    },
    
    // Availability
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    availableDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    
    // Rating system
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    
    // Profile completion
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // Cases statistics
    casesHandled: {
      type: Number,
      default: 0,
    },
    casesWon: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export { TELANGANA_DISTRICTS };
export default mongoose.model("User", userSchema);