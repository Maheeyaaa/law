// fixIndex.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected to MongoDB");
  
  try {
    // Drop the problematic index
    await mongoose.connection.collection("cases").dropIndex("cnrNumber_1");
    console.log("✅ cnrNumber_1 index dropped successfully!");
  } catch (error) {
    if (error.code === 27) {
      console.log("⚠️ Index doesn't exist (already dropped)");
    } else {
      console.log("❌ Error:", error.message);
    }
  }
  
  console.log("\n🎯 You can now create cases without errors!");
  process.exit(0);
});