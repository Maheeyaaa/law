// backend/middleware/optionalAuth.js
// ══════════════════════════════════════════════════════════════════
// Like protect, but doesn't fail if no token.
// Sets req.user if logged in, otherwise leaves it undefined.
// ══════════════════════════════════════════════════════════════════

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token — continue as anonymous
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (user) {
        req.user = { id: user._id.toString(), ...user.toObject() };
      }
    } catch (err) {
      // Invalid token — just continue as anonymous
      console.log("[optionalAuth] Token invalid — continuing as anonymous");
    }

    next();
  } catch (err) {
    // On any error, just continue without auth
    next();
  }
};

export default optionalAuth;