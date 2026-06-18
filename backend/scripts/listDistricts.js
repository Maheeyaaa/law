import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import ScrapedLawyer from "../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const districts = await ScrapedLawyer.distinct("district");

console.log("\n📍 DISTRICTS IN DATABASE\n");
districts.sort().forEach(d => console.log(d));

console.log(`\nTotal Districts: ${districts.length}`);

await mongoose.disconnect();