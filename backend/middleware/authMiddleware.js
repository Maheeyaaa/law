import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (
  req,
  res,
  next
) => {
  try {
    const auth =
      req.headers.authorization;

    if (
      !auth ||
      !auth.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          message:
            "Authentication required",
        });
    }

    if (
      !process.env.JWT_SECRET
    ) {
      throw new Error(
        "JWT secret missing"
      );
    }

    const token =
      auth.split(
        " "
      )[1];

    const decoded =
      jwt.verify(
        token,
        process.env
          .JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.id
      ).select(
        "-password"
      );

    if (
      !user
    ) {
      return res
        .status(401)
        .json({
          message:
            "User not found",
        });
    }

    req.user =
      user;

    next();
  } catch (
    error
  ) {
    console.error(
      "Auth:",
      error.message
    );

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({
          message:
            "Session expired",

          expired:
            true,
        });
    }

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res
        .status(401)
        .json({
          message:
            "Invalid token",
        });
    }

    return res
      .status(401)
      .json({
        message:
          "Authentication failed",
      });
  }
};

export default protect;