// backend/controllers/savedCaseController.js

import SavedCase from "../models/SavedCase.js";
import Notification from "../models/Notification.js";
import Activity from "../models/Activity.js";

// ── Add a saved case ───────────────────────────────────────
export const addSavedCase = async (req, res) => {
  console.log(req.body);
  try {
    const { 
      court, 
      courtComplex, 
      caseType, 
      mtype, 
      caseNumber, 
      year, 
      label, 
      cnrNumber, 
      distCode, 
      distName, 
      complexCode, 
      complexName 
    } = req.body;

    if (!court || !caseType || !mtype || !caseNumber || !year) {
      return res.status(400).json({
        success: false,
        message: "Court, case type, case number, and year are required",
      });
    }

    if (year < 1950 || year > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid year",
      });
    }

    // Check duplicate
    const existing = await SavedCase.findOne({
      user: req.user.id,
      court: court.trim(),
      courtComplex: courtComplex?.trim() || "",
      caseType: caseType.trim(),
      mtype: Number(mtype),
      caseNumber: caseNumber.trim(),
      year: parseInt(year),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This case is already saved in your account",
      });
    }

    // ── Create the saved case ──────────────────────────────
    const savedCase = await SavedCase.create({
      user: req.user.id,
      court: court.trim(),
      caseType: caseType.trim(),
      mtype: Number(mtype),
      caseNumber: caseNumber.trim(),
      year: parseInt(year),
      cnrNumber: cnrNumber?.trim().toUpperCase() || "",
      label: label?.trim() || "",
      courtComplex: courtComplex?.trim() || "",
      distCode: distCode?.trim() || "",
      distName: distName?.trim() || "",
      complexCode: complexCode?.trim() || "",
      complexName: complexName?.trim() || "",
    });

    // ── Create Activity ────────────────────────────────────
    await Activity.create({
      citizen: req.user.id,
      text: `Case saved for tracking: ${caseNumber}/${year} at ${court}`,
      type: "case_created",
    });

    // ── Create Notification ────────────────────────────────
    await Notification.create({
      citizen: req.user.id,
      title: "Case Added for Tracking",
      message: `Case ${caseNumber}/${year} at ${court} has been saved. We'll notify you of any updates.`,
      type: "case",
      subType: null,
      relatedCase: savedCase._id,
      link: `/cases/saved`,
      read: false,
    });

    res.status(201).json({
      success: true,
      message: "Case saved successfully",
      savedCase,
    });

  } catch (error) {
    console.log("ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get all saved cases ────────────────────────────────────
export const getSavedCases = async (req, res) => {
  try {
    const savedCases = await SavedCase.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      savedCases,
      total: savedCases.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get single saved case ──────────────────────────────────
export const getSavedCaseById = async (req, res) => {
  try {
    const savedCase = await SavedCase.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!savedCase) {
      return res.status(404).json({
        success: false,
        message: "Saved case not found",
      });
    }

    res.json({ success: true, savedCase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Delete a saved case ────────────────────────────────────
export const deleteSavedCase = async (req, res) => {
  try {
    const savedCase = await SavedCase.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!savedCase) {
      return res.status(404).json({
        success: false,
        message: "Saved case not found",
      });
    }

    await SavedCase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Case removed from saved list",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Update label of a saved case ───────────────────────────
export const updateSavedCase = async (req, res) => {
  try {
    const { 
      label, 
      mtype, 
      distCode, 
      distName, 
      complexCode, 
      complexName 
    } = req.body;

    const savedCase = await SavedCase.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!savedCase) {
      return res.status(404).json({
        success: false,
        message: "Saved case not found",
      });
    }

    if (label !== undefined)       savedCase.label       = label.trim();
    if (mtype !== undefined)       savedCase.mtype       = Number(mtype);
    if (distCode !== undefined)    savedCase.distCode    = distCode.trim();
    if (distName !== undefined)    savedCase.distName    = distName.trim();
    if (complexCode !== undefined) savedCase.complexCode = complexCode.trim();
    if (complexName !== undefined) savedCase.complexName = complexName.trim();

    await savedCase.save();

    res.json({
      success: true,
      message: "Saved case updated",
      savedCase,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};