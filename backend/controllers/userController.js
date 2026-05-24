import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DISTRICTS } from "../constants/telangana.js";

// ======================
// JWT
// ======================

const signToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ======================
// Register
// ======================

export const registerUser = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      role,
      district,
    } = req.body;

    const allowedRoles = [
      "citizen",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Only citizen and admin registration are allowed",
      });
    }

    if (
      !name ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Name, email and password are required",
        });
    }

    if (
      district &&
      !DISTRICTS.includes(
        district
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid district",
        });
    }

    const existing =
      await User.findOne({
        email,
      });

    if (existing) {
      return res
        .status(400)
        .json({
          message:
            "Email already registered",
        });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await User.create({
        name,

        email,

        password:
          hashedPassword,

        role,

        state:
          "Telangana",

        district:
          district ||
          "Hyderabad",
      });

    const token =
      signToken(
        user._id,
        user.role
      );

    const response =
      user.toObject();

    delete response.password;

    res
      .status(201)
      .json({
        message:
          "Registration successful",

        token,

        user:
          response,
      });
  } catch (
    error
  ) {
    console.error(
      error
    );

    res
      .status(500)
      .json({
        message:
          "Registration failed",
      });
  }
};

// ======================
// Login
// ======================

export const loginUser =
async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } =
      req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email and password required",
        });
    }

    const user =
      await User.findOne({
        email,
      });

      const allowedRole =
        req.body.allowedRole;

      if (
        allowedRole &&
        user &&
        user.role !==
          allowedRole
      ) {
        return res
          .status(403)
          .json({
            message:
              `Please login through ${user.role} portal`,
          });
      }

    if (
      user &&
      ![
        "citizen",
        "admin",
      ].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        message:
          "This account type is no longer supported",
      });
    }

    if (
      !user
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid credentials",
        });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (
      !valid
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid credentials",
        });
    }

    const token =
      signToken(
        user._id,
        user.role
      );

    const data =
      user.toObject();

    delete data.password;

    res.json({
      message:
        "Login successful",

      token,

      user:
        data,
    });
  } catch (
    error
  ) {
    console.error(
      error
    );

    res
      .status(500)
      .json({
        message:
          "Login failed",
      });
  }
};

// ======================
// Profile
// ======================

export const getCurrentUser =
async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password"
      );

    if (
      !user
    ) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    res.json(
      user
    );
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Admin Create
// ======================

export const createAdmin =
async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
    } =
      req.body;

    const exists =
      await User.findOne(
        {
          email,
        }
      );

    if (
      exists
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email already exists",
        });
    }

    const hashed =
      await bcrypt.hash(
        password,
        10
      );

    const admin =
      await User.create({
        name,

        email,

        password:
          hashed,

        role:
          "admin",
      });

    res
      .status(201)
      .json({
        message:
          "Admin created",

        user: {
          id:
            admin._id,

          name:
            admin.name,

          email:
            admin.email,
        },
      });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};