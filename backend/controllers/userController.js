import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const token = jwt.sign(
  { id: user._id, role: user.role },
  "secretKey",
  { expiresIn: "7d" }
);

    res.status(200).json({
    message: "Login successful",
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

    res.status(200).json({
    message: "Login successful",
    token,
    user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};