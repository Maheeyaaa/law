// backend/routes/scamRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import ScamPattern from "../models/ScamPattern.js";
import ScamReport from "../models/ScamReport.js";

const router = express.Router();

// Get all scam reports (for admin/analysis)
router.get("/reports", protect, async (req, res) => {
  try {
    const reports = await ScamReport.find({ reportedBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new scam pattern (admin only - you can add role check later)
router.post("/patterns", protect, async (req, res) => {
  try {
    const { type, pattern, description, severity, isRegex } = req.body;

    const newPattern = await ScamPattern.create({
      type,
      pattern,
      description,
      severity,
      isRegex,
    });

    res.json({ message: "Scam pattern added", pattern: newPattern });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patterns
router.get("/patterns", protect, async (req, res) => {
  try {
    const patterns = await ScamPattern.find().sort({ createdAt: -1 });
    res.json({ patterns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pattern
router.put("/patterns/:id", protect, async (req, res) => {
  try {
    const pattern = await ScamPattern.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "Pattern updated", pattern });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pattern
router.delete("/patterns/:id", protect, async (req, res) => {
  try {
    await ScamPattern.findByIdAndDelete(req.params.id);
    res.json({ message: "Pattern deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;