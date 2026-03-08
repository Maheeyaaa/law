import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import dns from "dns";

import userRoutes from "./routes/userRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dns.setServers(['1.1.1.1','8.8.8.8']);

dotenv.config();

// ✅ create app FIRST
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// MongoDB Connection
// mongoose.connect(process.env.MONGO_URI, {
//   serverSelectionTimeoutMS: 50000,
//   family: 4
// })
// .then(() => {
//   console.log("MongoDB Connected Successfully ✅");
// })
// .catch((error) => {
//   console.log("MongoDB Connection Error ❌");
//   console.log(error);
// });

// Port
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
setInterval(() => {}, 1000);