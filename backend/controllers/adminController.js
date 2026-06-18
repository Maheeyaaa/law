// backend/controllers/adminController.js

import User from "../models/User.js";
import Activity from "../models/Activity.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ScrapedLawyer from "../models/ScrapedLawyer.js";

// ======================
// Admin Login
// ======================

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    if (user.isBanned || !user.isActive) {
      return res.status(403).json({ message: "Account is disabled." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const data = user.toObject();
    delete data.password;

    res.json({ message: "Admin login successful", token, user: data });
  } catch (error) {
    console.error("[adminLogin]", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ======================
// Dashboard Stats
// ======================

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCitizens,
      activeCitizens,
      bannedCitizens,
      totalLawyers,
      adminLawyers,
      freelawLawyers,
      verifiedLawyers,
      recentUsers,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "citizen", isActive: true,  isBanned: false }),
      User.countDocuments({ role: "citizen", isBanned: true }),

      ScrapedLawyer.countDocuments({ isActive: true }),
      ScrapedLawyer.countDocuments({ isActive: true, source: "admin" }),
      ScrapedLawyer.countDocuments({ isActive: true, source: "freelaw" }),
      ScrapedLawyer.countDocuments({ isActive: true, isVerified: true }),

      User.find({ role: "citizen" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email district createdAt isActive isBanned"),

      Activity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("citizen", "name email"),
    ]);

    res.json({
      stats: {
        citizens: {
          total:  totalCitizens,
          active: activeCitizens,
          banned: bannedCitizens,
        },
        lawyers: {
          total:    totalLawyers,
          admin:    adminLawyers,
          freelaw:  freelawLawyers,
          verified: verifiedLawyers,
        },
      },
      recentUsers,
      recentActivity,
    });
  } catch (error) {
    console.error("[getDashboardStats]", error);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

// ======================
// Manage Users (Citizens)
// ======================

export const getAllUsers = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      page   = 1,
      limit  = 20,
    } = req.query;

    const query = { role: "citizen" };

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") { query.isBanned = false; query.isActive = true;  }
    if (status === "banned") { query.isBanned = true; }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password -pushSubscriptions"),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[getAllUsers]", error);
    res.status(500).json({ message: "Failed to load users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -pushSubscriptions");

    if (!user || user.role !== "citizen") {
      return res.status(404).json({ message: "User not found" });
    }

    const activity = await Activity.find({ citizen: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ user, activity });
  } catch (error) {
    console.error("[getUserById]", error);
    res.status(500).json({ message: "Failed to load user" });
  }
};

export const banUser = async (req, res) => {
  try {
    const { reason = "" } = req.body;

    const user = await User.findById(req.params.id);
    if (!user || user.role !== "citizen") {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.params.id, {
      isBanned:     true,
      bannedReason: reason,
      isActive:     false,
    });

    res.json({ message: "User banned successfully" });
  } catch (error) {
    console.error("[banUser]", error);
    res.status(500).json({ message: "Failed to ban user" });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "citizen") {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.params.id, {
      isBanned:     false,
      bannedReason: "",
      isActive:     true,
    });

    res.json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error("[unbanUser]", error);
    res.status(500).json({ message: "Failed to unban user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "citizen") {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ citizen: req.params.id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[deleteUser]", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// ======================
// Manage Lawyers
// ======================

export const getAllLawyers = async (req, res) => {
  try {
    const {
      search         = "",
      source         = "all",
      district       = "",
      specialization = "",
      page           = 1,
      limit          = 20,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search.replace(/\D/g, "") } },
      ];
    }

    if (source !== "all")  query.source         = source;
    if (district)          query.district       = { $regex: district,       $options: "i" };
    if (specialization)    query.$or = [
      { specialization:  { $regex: specialization, $options: "i" } },
      { specializations: { $elemMatch: { $regex: specialization, $options: "i" } } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [lawyers, total] = await Promise.all([
      ScrapedLawyer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ScrapedLawyer.countDocuments(query),
    ]);

    res.json({
      lawyers,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[getAllLawyers]", error);
    res.status(500).json({ message: "Failed to load lawyers" });
  }
};

export const getLawyerById = async (req, res) => {
  try {
    const lawyer = await ScrapedLawyer.findById(req.params.id).lean();

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ lawyer });
  } catch (error) {
    console.error("[getLawyerById]", error);
    res.status(500).json({ message: "Failed to load lawyer" });
  }
};

export const addLawyer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      district,
      city,
      specialization,
      specializations,
      bio,
      education,
      isVerified,
    } = req.body;

    if (!name || !district || !specialization) {
      return res.status(400).json({
        message: "Name, district and specialization are required",
      });
    }

    // Check for duplicates by phone or email
    const dupQuery = [];
    if (phone) dupQuery.push({ phone });
    if (email) dupQuery.push({ email });

    if (dupQuery.length > 0) {
      const existing = await ScrapedLawyer.findOne({ $or: dupQuery });
      if (existing) {
        return res.status(400).json({
          message: `Lawyer already exists with this ${existing.phone === phone ? "phone" : "email"}`,
        });
      }
    }

    // Normalize specializations array
    const specsArray = Array.isArray(specializations)
      ? specializations
      : (specializations
          ? specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : [specialization]);

    // Normalize education array
    const eduArray = Array.isArray(education)
      ? education
      : (education
          ? education.split(",").map((e) => e.trim()).filter(Boolean)
          : []);

    const lawyer = await ScrapedLawyer.create({
      name,
      email:           email || null,
      phone:           phone || null,
      district,
      city:            city || district,
      state:           "Telangana",
      specialization:  specialization,
      specializations: specsArray,
      bio:             bio || "",
      education:       eduArray,
      isVerified:      !!isVerified,
      isActive:        true,
      source:          ["admin"],
      lastScraped:     new Date(),
    });

    res.status(201).json({
      message: "Lawyer added successfully",
      lawyer,
    });

  } catch (error) {
    console.error("[addLawyer]", error);
    res.status(500).json({ message: "Failed to add lawyer" });
  }
};

export const updateLawyer = async (req, res) => {
  try {
    const allowedFields = [
      "name", "email", "phone", "district", "city",
      "specialization", "specializations",
      "bio", "education", "isVerified",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] === undefined) return;

      // Handle array fields
      if (field === "specializations" || field === "education") {
        const value = req.body[field];
        updates[field] = Array.isArray(value)
          ? value
          : (value
              ? value.split(",").map((v) => v.trim()).filter(Boolean)
              : []);
      } else {
        updates[field] = req.body[field];
      }
    });

    const lawyer = await ScrapedLawyer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).lean();

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ message: "Lawyer updated successfully", lawyer });
  } catch (error) {
    console.error("[updateLawyer]", error);
    res.status(500).json({ message: "Failed to update lawyer" });
  }
};

export const deleteLawyer = async (req, res) => {
  try {
    const lawyer = await ScrapedLawyer.findByIdAndDelete(req.params.id);

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ message: "Lawyer deleted successfully" });
  } catch (error) {
    console.error("[deleteLawyer]", error);
    res.status(500).json({ message: "Failed to delete lawyer" });
  }
};

// ======================
// System Activity
// ======================

export const getSystemActivity = async (req, res) => {
  try {
    const {
      type  = "all",
      page  = 1,
      limit = 30,
    } = req.query;

    const query = {};
    if (type !== "all") query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("citizen", "name email role"),
      Activity.countDocuments(query),
    ]);

    res.json({
      activities,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[getSystemActivity]", error);
    res.status(500).json({ message: "Failed to load activity" });
  }
};

//Change password

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    // Get admin with password
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[changeAdminPassword]", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};