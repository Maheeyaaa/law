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

    // Read from .env instead of hardcoding
    const email    = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name     = process.env.ADMIN_NAME || "Super Admin";

    if (!email || !password) {
      console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
      process.exit(1);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("⚠️  Admin already exists:", existing.email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role:     "admin",
      state:    "Telangana",
      district: "Hyderabad",
      isActive: true,
      isBanned: false,
    });

    console.log("✅ Admin created successfully!");
    console.log("   Email:", email);
    console.log("   ⚠️  Change password after first login!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

createAdmin();