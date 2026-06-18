import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// ← Same fix as server.js
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

console.log("🔌 Connecting to MongoDB...");

try {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 50000,
    family: 4, // ← Same fix as server.js
  });

  console.log("✅ Connected!\n");

  const db = mongoose.connection.db;

  const scraped = await db.collection("scrapedlawyers").countDocuments();
  const users   = await db.collection("users").countDocuments({ role: "lawyer" });

  console.log("━".repeat(40));
  console.log(`📦 ScrapedLawyers : ${scraped}`);
  console.log(`👤 Users (lawyers): ${users}`);
  console.log("━".repeat(40));

  // Show sample user lawyer if exists
  if (users > 0) {
    const sample = await db
      .collection("users")
      .findOne({ role: "lawyer" });
    console.log("\n📋 Sample lawyer from Users:");
    console.log(`   Name  : ${sample.name}`);
    console.log(`   Email : ${sample.email}`);
    console.log(`   Dist  : ${sample.district}`);
    console.log(`   Spec  : ${sample.specialization}`);
  }

  process.exit(0);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}