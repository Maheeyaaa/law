import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import ScrapedLawyer from "../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 50000,
    family: 4,
  });

  console.log("\n📊 SCRAPED LAWYER STATISTICS");
  console.log("═".repeat(60));

  const total     = await ScrapedLawyer.countDocuments();
  const withEmail = await ScrapedLawyer.countDocuments({
    email: { $nin: [null, ""] }
  });
  const withPhone = await ScrapedLawyer.countDocuments({
    phone: { $nin: [null, ""] }
  });
  const verified  = await ScrapedLawyer.countDocuments({ isVerified: true });

  console.log(`\n📦 Total lawyers : ${total}`);
  console.log(`📧 With email    : ${withEmail} (${((withEmail/total)*100).toFixed(1)}%)`);
  console.log(`📞 With phone    : ${withPhone} (${((withPhone/total)*100).toFixed(1)}%)`);
  console.log(`✅ Verified      : ${verified} (${((verified/total)*100).toFixed(1)}%)`);

  // District distribution
  const byDistrict = await ScrapedLawyer.aggregate([
    { $group: { _id: "$district", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log("\n📍 By District:");
  console.log("─".repeat(40));
  byDistrict.slice(0, 15).forEach((d) => {
    console.log(`   ${(d._id || "Unknown").padEnd(30)} ${d.count}`);
  });

  // Specialization distribution
  const bySpec = await ScrapedLawyer.aggregate([
    {
      $match: {
        specializations: {
          $exists: true,
          $ne: [],
        },
      },
    },
    { $unwind: "$specializations" },
    {
      $group: {
        _id: "$specializations",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  console.log("\n⚖️  By Specialization:");
  console.log("─".repeat(40));
  bySpec.forEach((s) => {
    console.log(`   ${(s._id || "Unknown").padEnd(30)} ${s.count}`);
  });

  // Sample records
  console.log("\n📋 Sample records:");
  console.log("─".repeat(40));
  const samples = await ScrapedLawyer.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  samples.forEach((l, i) => {
    console.log(`\n${i + 1}. ${l.name}`);
    console.log(`   📍 ${l.district}`);
    console.log(`   📧 ${l.email || "—"}`);
    console.log(`   📞 ${l.phone || "—"}`);
    console.log(`   🎓 ${l.education?.join(", ") || "—"}`);
    console.log(`   ✅ ${l.isVerified ? "Verified" : "Unverified"}`);
  });

  console.log("\n" + "═".repeat(60));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});