// backend/controllers/adminController.js

import User from "../models/User.js";
import Activity from "../models/Activity.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
      pendingLawyers,
      approvedLawyers,
      rejectedLawyers,
      recentUsers,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "citizen", isActive: true,  isBanned: false }),
      User.countDocuments({ role: "citizen", isBanned: true }),
      User.countDocuments({ role: "lawyer" }),
      User.countDocuments({ role: "lawyer", verificationStatus: "pending"  }),
      User.countDocuments({ role: "lawyer", verificationStatus: "approved" }),
      User.countDocuments({ role: "lawyer", verificationStatus: "rejected" }),
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
          pending:  pendingLawyers,
          approved: approvedLawyers,
          rejected: rejectedLawyers,
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
      status         = "all",
      district       = "",
      specialization = "",
      page           = 1,
      limit          = 20,
    } = req.query;

    const query = { role: "lawyer" };

    if (search) {
      query.$or = [
        { name:             { $regex: search, $options: "i" } },
        { email:            { $regex: search, $options: "i" } },
        { barCouncilNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all")  query.verificationStatus = status;
    if (district)          query.district       = { $regex: district,       $options: "i" };
    if (specialization)    query.specialization = { $regex: specialization, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [lawyers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password -pushSubscriptions"),
      User.countDocuments(query),
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
    const lawyer = await User.findOne({ _id: req.params.id, role: "lawyer" })
      .select("-password -pushSubscriptions");

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
      name, email, phone, district, specialization,
      experience, barCouncilNumber, languages,
      consultationFee, availability, education,
      courtsPracticing, bio, address,
    } = req.body;

    if (!name || !district || !specialization) {
      return res.status(400).json({
        message: "Name, district and specialization are required",
      });
    }

    // Generate email if not provided
    const lawyerEmail = email ||
      `${name.toLowerCase().replace(/\s+/g, ".")}@advocate.telangana.in`;

    const existing = await User.findOne({ email: lawyerEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Default password for admin-added lawyers
    const hashedPassword = await bcrypt.hash("Lawyer@123", 10);

    const lawyer = await User.create({
      name,
      email:              lawyerEmail,
      password:           hashedPassword,
      role:               "lawyer",
      state:              "Telangana",
      district:           district       || "Hyderabad",
      phone:              phone          || "",
      bio:                bio            || "",
      address:            address        || "",
      specialization:     specialization || "",
      experience:         parseInt(experience) || 0,
      barCouncilNumber:   barCouncilNumber || "",
      languages:          Array.isArray(languages)
                            ? languages
                            : (languages?.split(",").map(l => l.trim()) || []),
      consultationFee:    parseInt(consultationFee) || 0,
      availability:       availability || "available",
      education:          Array.isArray(education)       ? education       : [],
      courtsPracticing:   Array.isArray(courtsPracticing)? courtsPracticing: [],
      importedFrom:       "admin",
      isVerified:         true,
      verificationStatus: "approved",
      isActive:           true,
    });

    const data = lawyer.toObject();
    delete data.password;

    res.status(201).json({ message: "Lawyer added successfully", lawyer: data });
  } catch (error) {
    console.error("[addLawyer]", error);
    res.status(500).json({ message: "Failed to add lawyer" });
  }
};

export const updateLawyer = async (req, res) => {
  try {
    const allowedFields = [
      "name", "email", "phone", "district", "specialization",
      "experience", "barCouncilNumber", "languages", "consultationFee",
      "availability", "availableDays", "education", "courtsPracticing",
      "bio", "address", "verificationStatus", "isVerified",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const lawyer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "lawyer" },
      updates,
      { new: true }
    ).select("-password -pushSubscriptions");

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
    const lawyer = await User.findOneAndDelete({
      _id:  req.params.id,
      role: "lawyer",
    });

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ message: "Lawyer deleted successfully" });
  } catch (error) {
    console.error("[deleteLawyer]", error);
    res.status(500).json({ message: "Failed to delete lawyer" });
  }
};

export const approveLawyer = async (req, res) => {
  try {
    const lawyer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "lawyer" },
      { verificationStatus: "approved", isVerified: true },
      { new: true }
    ).select("-password");

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ message: "Lawyer approved successfully", lawyer });
  } catch (error) {
    console.error("[approveLawyer]", error);
    res.status(500).json({ message: "Failed to approve lawyer" });
  }
};

export const rejectLawyer = async (req, res) => {
  try {
    const { reason = "" } = req.body;

    const lawyer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "lawyer" },
      { verificationStatus: "rejected", isVerified: false, bannedReason: reason },
      { new: true }
    ).select("-password");

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({ message: "Lawyer rejected", lawyer });
  } catch (error) {
    console.error("[rejectLawyer]", error);
    res.status(500).json({ message: "Failed to reject lawyer" });
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