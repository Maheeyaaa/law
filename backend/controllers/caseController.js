// backend/controllers/caseController.js

import Case from "../models/Case.js";
import CaseTimeline from "../models/CaseTimeline.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { addTimelineEvent } from "../helpers/timelineHelper.js";

// Create a new case
export const createCase = async (req, res) => {
  try {
    const { title, description, caseType, priority, notes } = req.body;

    if (!title || !description || !caseType) {
      return res.status(400).json({
        message: "Title, description, and case type are required",
      });
    }

    const newCase = new Case({
      citizen: req.user.id,
      title,
      description,
      caseType,
      priority: priority || "Medium",
      notes: notes || "",
    });

    await newCase.save();

    // Auto-create timeline events
    await addTimelineEvent({
      caseId: newCase._id,
      citizenId: req.user.id,
      event: "Case Filed",
      description: `Case "${title}" has been filed successfully`,
      type: "case_filed",
    });

    await addTimelineEvent({
      caseId: newCase._id,
      citizenId: req.user.id,
      event: "Under Review",
      description: "Your case is being reviewed by the court",
      type: "under_review",
    });

    // Log activity
    await Activity.create({
      citizen: req.user.id,
      case: newCase._id,
      text: `New case filed: ${title}`,
      type: "case_filed",
    });

    // Create notification
    await Notification.create({
      citizen: req.user.id,
      title: "Case Filed Successfully",
      message: `Your case "${title}" has been filed with ID ${newCase.caseId}`,
      type: "case",
    });

    res.status(201).json({
      message: "Case filed successfully",
      case: newCase,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all cases for logged-in citizen
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
      .populate("assignedLawyer", "name email specialization")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    res.json({
      cases,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single case by ID with full details
export const getCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("assignedLawyer", "name email specialization experience phone");

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Get timeline for this case
    const timeline = await CaseTimeline.find({ case: caseDoc._id })
      .sort({ completedAt: 1 });

    // Get documents linked to this case
    const Document = (await import("../models/Document.js")).default;
    const documents = await Document.find({
      case: caseDoc._id,
      citizen: req.user.id,
    }).sort({ createdAt: -1 });

    // Get hearings for this case
    const Hearing = (await import("../models/Hearing.js")).default;
    const hearings = await Hearing.find({
      case: caseDoc._id,
      citizen: req.user.id,
    }).sort({ hearingDate: -1 });

    res.json({
      case: caseDoc,
      timeline,
      documents,
      hearings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update case
export const updateCase = async (req, res) => {
  try {
    const { description, notes } = req.body;

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseDoc.status === "Resolved" || caseDoc.status === "Closed") {
      return res.status(400).json({
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
      message: "Case updated successfully",
      case: caseDoc,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get case stats for dashboard
export const getCaseStats = async (req, res) => {
  try {
    const citizenId = req.user.id;

    const [total, active, pending, resolved, hearings] = await Promise.all([
      Case.countDocuments({ citizen: citizenId }),
      Case.countDocuments({ citizen: citizenId, status: "Active" }),
      Case.countDocuments({ citizen: citizenId, status: "Pending" }),
      Case.countDocuments({ citizen: citizenId, status: "Resolved" }),
      Case.countDocuments({
        citizen: citizenId,
        nextHearingDate: { $gte: new Date() },
      }),
    ]);

    res.json({
      total,
      active,
      pending,
      resolved,
      hearings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get case timeline
export const getCaseTimeline = async (req, res) => {
  try {
    // Verify the case belongs to this citizen
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    const timeline = await CaseTimeline.find({ case: req.params.id })
      .sort({ completedAt: 1 });

    // Build the full expected steps with completion status
    const expectedSteps = [
      { type: "case_filed", event: "Case Filed" },
      { type: "under_review", event: "Under Review" },
      { type: "lawyer_assigned", event: "Lawyer Assigned" },
      { type: "hearing_scheduled", event: "Hearing Scheduled" },
      { type: "hearing_completed", event: "Hearing Completed" },
      { type: "resolved", event: "Case Resolved" },
    ];

    const completedTypes = timeline.map((t) => t.type);

    const fullTimeline = expectedSteps.map((step) => {
      const found = timeline.find((t) => t.type === step.type);
      return {
        event: step.event,
        type: step.type,
        completed: completedTypes.includes(step.type),
        description: found ? found.description : "",
        completedAt: found ? found.completedAt : null,
      };
    });

    // Add any extra timeline events not in expected steps (like document uploads)
    const extraEvents = timeline.filter(
      (t) => !expectedSteps.find((s) => s.type === t.type)
    );

    res.json({
      caseId: caseDoc.caseId,
      title: caseDoc.title,
      status: caseDoc.status,
      timeline: fullTimeline,
      extraEvents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};