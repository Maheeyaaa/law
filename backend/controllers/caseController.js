// backend/controllers/caseController.js

import Case from "../models/Case.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import Document from "../models/Document.js";

// Register a case ID (citizen enters their existing court case ID)
export const registerCaseId = async (req, res) => {
  try {
    const { caseId, title, caseType, district, description } = req.body;

    if (!caseId || !title || !caseType) {
      return res.status(400).json({
        success: false,
        message: "Case ID, title, and case type are required",
      });
    }

    // Check if case ID already registered by this citizen
    const existing = await Case.findOne({
      caseId: caseId,
      citizen: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This Case ID is already registered in your account",
      });
    }

    const newCase = new Case({
      citizen: req.user.id,
      caseId,
      title,
      description: description || "",
      caseType,
      state: "Telangana",
      district: district || "",
      status: "Pending",
    });

    await newCase.save();

    await Activity.create({
      citizen: req.user.id,
      case: newCase._id,
      text: `Case ID registered: ${caseId}`,
      type: "case_registered",
    });

    await Notification.create({
      citizen: req.user.id,
      title: "Case ID Registered",
      message: `Your case "${title}" has been registered for tracking.`,
      type: "case",
    });

    res.status(201).json({
      success: true,
      message: "Case ID registered successfully",
      case: newCase,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all cases for citizen
export const getMyCases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = { citizen: req.user.id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cases = await Case.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      cases,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single case by MongoDB ID
export const getCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    const documents = await Document.find({
      case: caseDoc._id,
      citizen: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      case: caseDoc,
      documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update case notes/description (citizen only)
export const updateCase = async (req, res) => {
  try {
    const { description, notes } = req.body;

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    if (caseDoc.status === "Resolved" || caseDoc.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a resolved or closed case",
      });
    }

    if (description) caseDoc.description = description;
    if (notes) caseDoc.notes = notes;

    await caseDoc.save();

    await Activity.create({
      citizen: req.user.id,
      case: caseDoc._id,
      text: `Case updated: ${caseDoc.title}`,
      type: "case_updated",
    });

    res.json({
      success: true,
      message: "Case updated successfully",
      case: caseDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get case stats for citizen dashboard
export const getCaseStats = async (req, res) => {
  try {
    const citizenId = req.user.id;

    const [total, active, pending, resolved, closed] = await Promise.all([
      Case.countDocuments({ citizen: citizenId }),
      Case.countDocuments({ citizen: citizenId, status: "Active" }),
      Case.countDocuments({ citizen: citizenId, status: "Pending" }),
      Case.countDocuments({ citizen: citizenId, status: "Resolved" }),
      Case.countDocuments({ citizen: citizenId, status: "Closed" }),
    ]);

    res.json({
      success: true,
      total,
      active,
      pending,
      resolved,
      closed,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a case (citizen removes tracking)
export const deleteCase = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    await Case.findByIdAndDelete(req.params.id);

    await Activity.create({
      citizen: req.user.id,
      text: `Case removed from tracking: ${caseDoc.title}`,
      type: "general",
    });

    res.json({
      success: true,
      message: "Case removed from tracking successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};