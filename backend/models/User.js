// backend/models/User.js

import mongoose from "mongoose";

const TELANGANA_DISTRICTS = [
  "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy",
  "Vikarabad", "Warangal Urban", "Warangal Rural", "Hanumakonda",
  "Khammam", "Nalgonda", "Karimnagar", "Nizamabad", "Adilabad",
  "Komaram Bheem Asifabad", "Mancherial", "Peddapalli", "Jagtial",
  "Rajanna Sircilla", "Kamareddy", "Medak", "Siddipet", "Jangaon",
  "Mahabubabad", "Warangal", "Suryapet", "Yadadri Bhuvanagiri",
  "Mahabubnagar", "Nagarkurnool", "Wanaparthy", "Jogulamba Gadwal",
  "Narayanpet", "Mulugu", "Jayashankar Bhupalpally",
  "Bhadradri Kothagudem",
];

const userSchema = new mongoose.Schema(
  {
    // ── Core Fields ─────────────────────────────────────────
    name:     { type: String, required: true, trim: true },
    email:    { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type:     String,
      enum:     ["citizen", "lawyer", "admin"],
      required: true,
    },

    // ── Account Status ───────────────────────────────────────
    isActive:     { type: Boolean, default: true  },
    isBanned:     { type: Boolean, default: false },
    bannedReason: { type: String,  default: ""    },
    lastLogin:    { type: Date,    default: null  },

    // ── Location Fields ──────────────────────────────────────
    state:    { type: String, default: "Telangana" },
    district: { type: String, default: ""          },

    // ── Profile Fields ───────────────────────────────────────
    phone:   { type: String, default: "" },
    address: { type: String, default: "" },
    avatar:  { type: String, default: "" },
    bio:     { type: String, default: "" },

    // ── Voice & Language Preferences ─────────────────────────
    preferredLanguage: {
      type:    String,
      enum:    ["english", "telugu", "hindi"],
      default: null,
    },
    isProfileComplete: { type: Boolean, default: false },
    isVerified:        { type: Boolean, default: false },
    verificationToken:        { type: String,  default: null },
    verificationTokenExpiry:  { type: Date,    default: null },

    // ── Push Notification Fields ─────────────────────────────
    pushSubscriptions: [
      {
        endpoint:    { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth:   { type: String, required: true },
        },
        deviceLabel: { type: String, default: "" },
        userAgent:   { type: String, default: "" },
        createdAt:   { type: Date,   default: Date.now },
      },
    ],

    notificationPreferences: {
      hearingReminders: { type: Boolean,  default: true  },
      caseUpdates:      { type: Boolean,  default: true  },
      pushEnabled:      { type: Boolean,  default: false },
      reminderDays:     { type: [Number], default: [7, 1, 0] },
    },

    // ── Lawyer Directory Fields ──────────────────────────────
    barCouncilNumber:     { type: String, default: "" },
    specialization:       { type: String, default: "" },
    experience:           { type: Number, default: 0  },
    licenseDocument:      { type: String, default: "" },
    languages:            { type: [String], default: [] },
    education:            { type: [String], default: [] },
    courtsPracticing:     { type: [String], default: [] },

    availability: {
      type:    String,
      enum:    ["available", "busy", "unavailable"],
      default: "available",
    },
    availableDays: {
      type: [String],
      enum: [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday",
      ],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    consultationFee: { type: Number, default: 0 },
    rating:          { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:    { type: Number, default: 0 },
    casesHandled:    { type: Number, default: 0 },
    casesWon:        { type: Number, default: 0 },

    verificationStatus: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending",
    },

    importedFrom:          { type: String, default: null },
    scrapedFrom:           { type: String, default: null },
    dataSource:            { type: String, default: null },
    proBonoRegistrationNo: { type: String, default: null },
  },
  { timestamps: true }
);

export { TELANGANA_DISTRICTS };
export default mongoose.model("User", userSchema);