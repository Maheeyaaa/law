// backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized — no token" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();

  } catch (error) {
    // ← Give specific messages for different JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired — please login again",
        expired: true  // ← frontend can use this to auto-redirect to login
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Invalid token — please login again" 
      });
    }

    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export default protect;