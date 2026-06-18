import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import ScrapedLawyer from "../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const DISTRICT_MAP = {
  "Hyd": "Hyderabad",

  "Hanmakonda": "Hanumakonda",

  "Medchal_Malkajgiri": "Medchal-Malkajgiri",

  "Rajanna_Sircilla": "Rajanna Sircilla",

  "Yadadri_bhuvanagiri": "Yadadri Bhuvanagiri",

  "Peddapally": "Peddapalli",

  "Warangal Urban": "Hanumakonda",

  "Jayashankar": "Jayashankar Bhupalpally",

  "Jogulamba": "Jogulamba Gadwal",

  "Komaram_hyd": "Komaram Bheem Asifabad",
};

for (const [oldName, newName] of Object.entries(DISTRICT_MAP)) {
  const result = await ScrapedLawyer.updateMany(
    { district: oldName },
    { $set: { district: newName } }
  );

  console.log(
    `${oldName} → ${newName}: ${result.modifiedCount}`
  );
}

await mongoose.disconnect();

console.log("\n✅ District normalization complete");