import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DISTRICTS, SPECIALIZATIONS, LANGUAGES } from "../constants/telangana.js";

console.log("Signing with secret:", process.env.JWT_SECRET?.substring(0, 10));
const signToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

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
    const token = signToken(user._id, user.role);

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

    if (user.role === "lawyer" && user.verificationStatus === "pending") {
      return res.status(403).json({
        message: "Your account is pending verification by court staff",
        verificationStatus: "pending",
      });
    }

    if (user.role === "lawyer" && user.verificationStatus === "rejected") {
      return res.status(403).json({
        message: "Your lawyer account has been rejected. Please contact support for more information.",
        verificationStatus: "rejected",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = signToken(user._id, user.role);

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
    lawyer.isVerified = true;
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

export const rejectLawyer = async (req, res) => {
  try {
    const { reason } = req.body;

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
        message: "Cannot reject an already approved lawyer",
      });
    }

    if (lawyer.verificationStatus === "rejected") {
      return res.status(400).json({
        message: "Lawyer is already rejected",
      });
    }

    lawyer.verificationStatus = "rejected";
    await lawyer.save();

    res.json({
      success: true,
      message: `Lawyer ${lawyer.name} has been rejected`,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        barCouncilNumber: lawyer.barCouncilNumber,
        verificationStatus: lawyer.verificationStatus,
        reason: reason || "Not specified",
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

export const createCourtStaff = async (req, res) => {
  try {
    const { name, email, password, district, courtName } = req.body;

    if (!name || !email || !password || !courtName) {
      return res.status(400).json({
        message: "Name, email, password and court name are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const courtStaff = new User({
      name,
      email,
      password: hashedPassword,
      role: "court_staff",
      state: "Telangana",
      district: district || "Hyderabad",
      courtName: courtName,
      verificationStatus: "approved",
    });

    await courtStaff.save();

    const token = signToken(courtStaff._id, courtStaff.role);

    res.status(201).json({
      message: "Court Staff created successfully",
      token,
      user: {
        id: courtStaff._id,
        name: courtStaff.name,
        email: courtStaff.email,
        role: courtStaff.role,
        courtName: courtStaff.courtName,
        district: courtStaff.district,
      },
    });
  } catch (error) {
    console.error("Error creating court staff:", error);
    res.status(500).json({ error: error.message });
  }
};