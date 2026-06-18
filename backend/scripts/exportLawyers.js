import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";
import path from "path";
import ScrapedLawyer from "../models/ScrapedLawyer.js";
import User from "../models/User.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

/**
 * Convert array of lawyer objects to CSV string
 */
function toCSV(lawyers) {
  if (lawyers.length === 0) return "";

  const headers = [
    "name",
    "email",
    "phone",
    "phones",
    "district",
    "city",
    "state",
    "specialization",
    "experience",
    "education",
    "barCouncilNumber",
    "isVerified",
    "smartScore",
    "winRate",
    "totalCases",
    "casesWon",
    "source",
    "createdAt",
  ];

  // Escape CSV cell
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = lawyers.map((l) => {
    return headers.map((h) => {
      switch (h) {
        case "phones":     return escape(l.phones?.join(" | ") || "");
        case "education":  return escape(l.education?.join(" | ") || "");
        case "smartScore": return escape(l.scores?.smartScore || "");
        case "winRate":    return escape(l.scores?.rawWinRate || "");
        case "totalCases": return escape(l.caseStats?.totalCases || "");
        case "casesWon":   return escape(l.caseStats?.casesWon || "");
        case "source":     return escape(Array.isArray(l.source) ? l.source.join("|") : l.source || "");
        case "createdAt":  return escape(l.createdAt?.toISOString() || "");
        default:           return escape(l[h]);
      }
    }).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 50000,
    family: 4,
  });

  console.log("✅ Connected to MongoDB\n");

  // Create exports folder if it doesn't exist
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  // ─── Export Scraped Lawyers ──────────────────────────────
  console.log("📦 Fetching scraped lawyers...");
  const scraped = await ScrapedLawyer.find().lean();
  console.log(`   Found: ${scraped.length}`);

  if (scraped.length > 0) {
    const csv = toCSV(scraped);
    const filename = path.join(exportDir, `scraped-lawyers-${timestamp}.csv`);
    fs.writeFileSync(filename, csv);
    console.log(`   💾 Saved: ${filename}`);
    console.log(`   📏 Size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
  }

  // ─── Export Seed/User Lawyers ────────────────────────────
  console.log("\n👤 Fetching seed lawyers (Users)...");
  const seed = await User.find({ role: "lawyer" }).select("-password").lean();
  console.log(`   Found: ${seed.length}`);

  if (seed.length > 0) {
    const csv = toCSV(seed);
    const filename = path.join(exportDir, `seed-lawyers-${timestamp}.csv`);
    fs.writeFileSync(filename, csv);
    console.log(`   💾 Saved: ${filename}`);
    console.log(`   📏 Size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
  }

  // ─── Combined export ─────────────────────────────────────
  if (scraped.length > 0 && seed.length > 0) {
    const combined = [...scraped, ...seed];
    const csv = toCSV(combined);
    const filename = path.join(exportDir, `all-lawyers-${timestamp}.csv`);
    fs.writeFileSync(filename, csv);
    console.log(`\n📋 Combined export:`);
    console.log(`   💾 Saved: ${filename}`);
    console.log(`   📊 Total: ${combined.length}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ Export complete!");
  console.log(`📂 Open folder: ${exportDir}`);
  console.log("═".repeat(60));

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});