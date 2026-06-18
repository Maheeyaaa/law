import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import ScrapedLawyer from "../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const duplicates = await ScrapedLawyer.aggregate([
  {
    $group: {
      _id: {
        name: "$name",
        phone: "$phone",
      },
      count: { $sum: 1 },
      docs: { $push: "$_id" },
    },
  },
  {
    $match: {
      count: { $gt: 1 },
    },
  },
]);

console.log(JSON.stringify(duplicates, null, 2));

await mongoose.disconnect();