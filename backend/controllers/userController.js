import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, barCouncilNumber, specialization, experience } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const licenseDocument = req.file ? req.file.filename : null;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      barCouncilNumber,
      specialization,
      experience,
      licenseDocument,
      verificationStatus: role === "lawyer" ? "pending" : "approved"
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
    message: "User registered successfully",
    token,
    user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    if (user.role === "lawyer" && user.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Your account is pending verification"
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretKey",
      { expiresIn: "7d" }
    );

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingLawyers = async (req, res) => {
  try {

    const lawyers = await User.find({
      role: "lawyer",
      verificationStatus: "pending"
    });

    res.json(lawyers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveLawyer = async (req, res) => {
  try {

    if (req.user.role !== "Court Staff") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const lawyer = await User.findById(req.params.id);

    if (!lawyer) {
      return res.status(404).json({
        message: "Lawyer not found"
      });
    }

    lawyer.verificationStatus = "approved";

    await lawyer.save();

    res.json({
      message: "Lawyer approved successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getApprovedLawyers = async (req, res) => {
  try {

    const lawyers = await User.find({
      role: "lawyer",
      verificationStatus: "approved"
    }).select("-password");

    res.json(lawyers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};