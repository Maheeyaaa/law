import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DISTRICTS, SPECIALIZATIONS, LANGUAGES } from "../constants/telangana.js";

export const registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      district, 
      barCouncilNumber, 
      specialization, 
      experience,
      languages
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required",
      });
    }

    if (!district || !DISTRICTS.includes(district)) {
      return res.status(400).json({
        message: "Valid Telangana district is required",
        validDistricts: DISTRICTS,
      });
    }

    if (role === "lawyer") {
      if (!barCouncilNumber || !specialization || !experience) {
        return res.status(400).json({
          message: "Bar Council Number, Specialization, and Experience are required for lawyers",
        });
      }

      if (!SPECIALIZATIONS.includes(specialization)) {
        return res.status(400).json({
          message: "Invalid specialization",
          validSpecializations: SPECIALIZATIONS,
        });
      }

      if (languages && Array.isArray(languages)) {
        const invalidLanguages = languages.filter(lang => !LANGUAGES.includes(lang));
        if (invalidLanguages.length > 0) {
          return res.status(400).json({
            message: "Invalid language(s) selected",
            invalidLanguages,
            validLanguages: LANGUAGES,
          });
        }
      }

      const barCouncilRegex = /^TS\/\d{4,5}\/\d{4}$/;
      if (!barCouncilRegex.test(barCouncilNumber)) {
        return res.status(400).json({
          message: "Invalid Telangana Bar Council Number format",
          format: "TS/XXXX/YYYY (e.g., TS/1234/2020)",
        });
      }

      const existingLawyer = await User.findOne({ barCouncilNumber });
      if (existingLawyer) {
        return res.status(400).json({
          message: "This Bar Council Number is already registered",
        });
      }

      const exp = parseInt(experience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return res.status(400).json({
          message: "Experience must be a number between 0 and 60 years",
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const licenseDocument = req.file ? req.file.filename : null;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      state: "Telangana",
      district,
      barCouncilNumber: role === "lawyer" ? barCouncilNumber : undefined,
      specialization: role === "lawyer" ? specialization : undefined,
      experience: role === "lawyer" ? parseInt(experience) : undefined,
      licenseDocument: role === "lawyer" ? licenseDocument : undefined,
      verificationStatus: role === "lawyer" ? "pending" : "approved",
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "7d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: role === "lawyer" 
        ? "Lawyer registration successful. Awaiting verification." 
        : "Registration successful",
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Registration failed",
      error: error.message 
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    if (user.role === "lawyer" && user.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Your lawyer account is pending verification by court staff",
        verificationStatus: user.verificationStatus,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Login failed",
      error: error.message 
    });
  }
};

export const getPendingLawyers = async (req, res) => {
  try {
    if (req.user.role !== "Court Staff") {
      return res.status(403).json({
        message: "Access denied. Only court staff can view pending lawyers.",
      });
    }

    const lawyers = await User.find({
      role: "lawyer",
      verificationStatus: "pending",
    }).select("-password");

    res.json({
      count: lawyers.length,
      lawyers,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveLawyer = async (req, res) => {
  try {
    if (req.user.role !== "Court Staff") {
      return res.status(403).json({
        message: "Access denied. Only court staff can approve lawyers.",
      });
    }

    const lawyer = await User.findById(req.params.id);

    if (!lawyer) {
      return res.status(404).json({
        message: "Lawyer not found",
      });
    }

    if (lawyer.role !== "lawyer") {
      return res.status(400).json({
        message: "User is not a lawyer",
      });
    }

    if (lawyer.verificationStatus === "approved") {
      return res.status(400).json({
        message: "Lawyer is already approved",
      });
    }

    lawyer.verificationStatus = "approved";
    await lawyer.save();

    res.json({
      message: `Lawyer ${lawyer.name} approved successfully`,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        barCouncilNumber: lawyer.barCouncilNumber,
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getApprovedLawyers = async (req, res) => {
  try {
    const lawyers = await User.find({
      role: "lawyer",
      verificationStatus: "approved",
    }).select("-password");

    res.json({
      count: lawyers.length,
      lawyers,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// TEMPORARY - For creating court staff account
export const createCourtStaff = async (req, res) => {
  try {
    console.log("🔧 Creating court staff...");

    // Check if already exists
    const existing = await User.findOne({ email: "admin@court.gov.in" });
    if (existing) {
      console.log("⚠️ Court staff already exists");
      return res.status(400).json({ 
        message: "Court staff already exists",
        email: "admin@court.gov.in",
        note: "Try logging in instead"
      });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const courtStaff = new User({
      name: "Court Admin",
      email: "admin@court.gov.in",
      password: hashedPassword,
      role: "Court Staff",
      state: "Telangana",
      district: "Hyderabad",
      verificationStatus: "approved",
    });

    await courtStaff.save();
    console.log("✅ Court staff created successfully");

    const token = jwt.sign(
      { id: courtStaff._id, role: courtStaff.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Court Staff created successfully",
      email: "admin@court.gov.in",
      password: "admin123",
      token,
      user: {
        id: courtStaff._id,
        name: courtStaff.name,
        email: courtStaff.email,
        role: courtStaff.role
      }
    });

  } catch (error) {
    console.error("❌ Error creating court staff:", error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};