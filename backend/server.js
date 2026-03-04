import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import dns from 'dns';
import userRoutes from "./routes/userRoutes.js";

dns.setServers(['1.1.1.1','8.8.8.8']);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 50000,
  family: 4
})
.then(() => {
  console.log("MongoDB Connected Successfully ✅");
})
.catch((error) => {
  console.log("MongoDB Connection Error ❌");
  console.log(error);
});

// Server Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});