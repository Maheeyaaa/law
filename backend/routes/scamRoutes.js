// backend/routes/scamRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import ScamPattern from "../models/ScamPattern.js";
import ScamReport from "../models/ScamReport.js";

const router = express.Router();

// ── Scam Reports ──────────────────────────────────────────
// Citizen: get their own reports
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

// Court staff: get ALL reports
router.get("/reports/all", protect, restrictTo("court_staff"), async (req, res) => {
  try {
    const reports = await ScamReport.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Scam Patterns ─────────────────────────────────────────
// Anyone authenticated can READ patterns
router.get("/patterns", protect, async (req, res) => {
  try {
    const patterns = await ScamPattern.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json({ patterns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Only court_staff can WRITE patterns
router.post("/patterns", protect, restrictTo("court_staff"), async (req, res) => {
  try {
    const { type, pattern, description, severity, isRegex } = req.body;
    const newPattern = await ScamPattern.create({
      type, pattern, description, severity, isRegex,
    });
    res.status(201).json({ message: "Scam pattern added", pattern: newPattern });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/patterns/:id", protect, restrictTo("court_staff"), async (req, res) => {
  try {
    const pattern = await ScamPattern.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!pattern) return res.status(404).json({ error: "Pattern not found" });
    res.json({ message: "Pattern updated", pattern });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/patterns/:id", protect, restrictTo("court_staff"), async (req, res) => {
  try {
    await ScamPattern.findByIdAndDelete(req.params.id);
    res.json({ message: "Pattern deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;