// backend/scripts/createAdmin.js

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ email: "admin@legalapp.com" });
    if (existing) {
      console.log("⚠️  Admin already exists:", existing.email);
      process.exit(0);
    }

    const password = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name:     "Super Admin",
      email:    "admin@legalapp.com",
      password,
      role:     "admin",
      state:    "Telangana",
      district: "Hyderabad",
      isActive: true,
      isBanned: false,
    });

    console.log("✅ Admin created successfully!");
    console.log("   Email:    admin@legalapp.com");
    console.log("   Password: Admin@123");
    console.log("   ⚠️  Change password after first login!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

createAdmin();