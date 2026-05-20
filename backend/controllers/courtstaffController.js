// backend/controllers/courtStaffController.js

import User from "../models/User.js";
import Case from "../models/Case.js";
import Hearing from "../models/Hearing.js";
import Notification from "../models/Notification.js";
import Activity from "../models/Activity.js";
import CaseTimeline from "../models/CaseTimeline.js";
import { addTimelineEvent } from "../helpers/timelineHelper.js";

// ─────────────────────────────────────────
// GET COURT STAFF DASHBOARD
// ─────────────────────────────────────────
export const getCourtStaffDashboard = async (req, res) => {
  try {
    const staff = req.user;
    const courtName = staff.courtName;

    if (!courtName) {
      return res.status(400).json({
        success: false,
        message: "Court staff account has no assigned court. Contact admin.",
      });
    }

    const [
      totalCases,
      activeCases,
      pendingCases,
      resolvedCases,
      todayHearings,
      upcomingHearings,
      recentCases,
      pendingLawyers,
    ] = await Promise.all([
      Case.countDocuments({ courtName }),
      Case.countDocuments({ courtName, status: "Active" }),
      Case.countDocuments({ courtName, status: { $in: ["Draft", "Pending"] } }),
      Case.countDocuments({ courtName, status: "Resolved" }),
      Hearing.countDocuments({
        hearingDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "Scheduled",
      }),
      Hearing.countDocuments({
        hearingDate: { $gte: new Date() },
        status: "Scheduled",
      }),
      Case.find({ courtName })
        .populate("citizen", "name email phone")
        .populate("assignedLawyer", "name specialization")
        .sort({ updatedAt: -1 })
        .limit(5),
      User.countDocuments({ role: "lawyer", verificationStatus: "pending" }),
    ]);

    res.json({
      success: true,
      court: {
        name: courtName,
        district: staff.district,
        staffName: staff.name,
      },
      stats: {
        totalCases,
        activeCases,
        pendingCases,
        resolvedCases,
        todayHearings,
        upcomingHearings,
        pendingLawyers,
      },
      recentCases,
    });
  } catch (error) {
    console.error("Court staff dashboard error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL CASES UNDER THEIR COURT
// ─────────────────────────────────────────
export const getCourtCases = async (req, res) => {
  try {
    const courtName = req.user.courtName;

    if (!courtName) {
      return res.status(400).json({
        success: false,
        message: "No court assigned to this account",
      });
    }

    const {
      status,
      search,
      page = 1,
      limit = 10,
      priority,
    } = req.query;

    const filter = { courtName };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
        { cnrNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cases = await Case.find(filter)
      .populate("citizen", "name email phone district")
      .populate("assignedLawyer", "name email specialization phone")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    // Stats for this court
    const stats = {
      total: await Case.countDocuments({ courtName }),
      draft: await Case.countDocuments({ courtName, status: "Draft" }),
      filed: await Case.countDocuments({ courtName, status: "Filed" }),
      active: await Case.countDocuments({ courtName, status: "Active" }),
      pending: await Case.countDocuments({ courtName, status: "Pending" }),
      resolved: await Case.countDocuments({ courtName, status: "Resolved" }),
      closed: await Case.countDocuments({ courtName, status: "Closed" }),
    };

    res.json({
      success: true,
      courtName,
      cases,
      stats,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get court cases error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE CASE DETAILS
// ─────────────────────────────────────────
export const getCourtCaseDetails = async (req, res) => {
  try {
    const courtName = req.user.courtName;

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      courtName,
    })
      .populate("citizen", "name email phone district address avatar")
      .populate("assignedLawyer", "name email phone specialization experience");

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not under your court",
      });
    }

    const timeline = await CaseTimeline.find({ case: caseDoc._id })
      .sort({ completedAt: 1 });

    const Document = (await import("../models/Document.js")).default;
    const documents = await Document.find({ case: caseDoc._id })
      .sort({ createdAt: -1 });

    const hearings = await Hearing.find({ case: caseDoc._id })
      .sort({ hearingDate: -1 });

    res.json({
      success: true,
      case: caseDoc,
      timeline,
      documents,
      hearings,
    });
  } catch (error) {
    console.error("Get court case details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE CASE STATUS
// ─────────────────────────────────────────
export const updateCaseStatus = async (req, res) => {
  try {
    const courtName = req.user.courtName;
    const { status, notes } = req.body;

    const validStatuses = ["Filed", "Active", "Pending", "Resolved", "Closed", "Dismissed"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      courtName,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not under your court",
      });
    }

    const oldStatus = caseDoc.status;
    caseDoc.status = status;
    if (notes) caseDoc.notes = notes;

    await caseDoc.save();

    // Add timeline event
    await addTimelineEvent({
      caseId: caseDoc._id,
      citizenId: caseDoc.citizen,
      event: `Case Status Updated`,
      description: `Status changed from ${oldStatus} to ${status} by court staff.`,
      type: "status_changed",
    });

    // Notify citizen
    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Case Status Updated",
      message: `Your case "${caseDoc.title}" status has been updated to: ${status}`,
      type: "case",
    });

    // Log activity
    await Activity.create({
      citizen: caseDoc.citizen,
      case: caseDoc._id,
      text: `Case status updated to ${status} by court staff`,
      type: "status_changed",
    });

    res.json({
      success: true,
      message: `Case status updated to ${status}`,
      case: caseDoc,
    });
  } catch (error) {
    console.error("Update case status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// ASSIGN LAWYER TO CASE
// ─────────────────────────────────────────
export const assignLawyerToCase = async (req, res) => {
  try {
    const courtName = req.user.courtName;
    const { lawyerId } = req.body;

    if (!lawyerId) {
      return res.status(400).json({
        success: false,
        message: "Lawyer ID is required",
      });
    }

    // Verify case belongs to this court
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      courtName,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not under your court",
      });
    }

    // Verify lawyer exists and is approved
    const lawyer = await User.findOne({
      _id: lawyerId,
      role: "lawyer",
      verificationStatus: "approved",
    });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found or not verified",
      });
    }

    // Assign lawyer
    caseDoc.assignedLawyer = lawyerId;
    if (caseDoc.status === "Draft" || caseDoc.status === "Pending") {
      caseDoc.status = "Active";
    }
    await caseDoc.save();

    // Update lawyer's cases handled count
    await User.findByIdAndUpdate(lawyerId, {
      $inc: { casesHandled: 1 },
    });

    // Add timeline event
    await addTimelineEvent({
      caseId: caseDoc._id,
      citizenId: caseDoc.citizen,
      event: "Lawyer Assigned",
      description: `${lawyer.name} has been assigned to your case by court staff.`,
      type: "lawyer_assigned",
    });

    // Notify citizen
    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Lawyer Assigned to Your Case",
      message: `${lawyer.name} (${lawyer.specialization}) has been assigned to your case "${caseDoc.title}".`,
      type: "lawyer",
    });

    // Notify lawyer
    await Notification.create({
      citizen: lawyerId,
      title: "New Case Assigned",
      message: `You have been assigned to case "${caseDoc.title}" by court staff.`,
      type: "case",
    });

    // Log activity
    await Activity.create({
      citizen: caseDoc.citizen,
      case: caseDoc._id,
      text: `Lawyer ${lawyer.name} assigned to case by court staff`,
      type: "lawyer_assigned",
    });

    res.json({
      success: true,
      message: `${lawyer.name} assigned to case successfully`,
      case: caseDoc,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
      },
    });
  } catch (error) {
    console.error("Assign lawyer error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// REMOVE LAWYER FROM CASE
// ─────────────────────────────────────────
export const removeLawyerFromCase = async (req, res) => {
  try {
    const courtName = req.user.courtName;

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      courtName,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not under your court",
      });
    }

    if (!caseDoc.assignedLawyer) {
      return res.status(400).json({
        success: false,
        message: "No lawyer assigned to this case",
      });
    }

    const previousLawyerId = caseDoc.assignedLawyer;
    caseDoc.assignedLawyer = null;
    await caseDoc.save();

    // Notify citizen
    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Lawyer Removed from Case",
      message: `The assigned lawyer has been removed from your case "${caseDoc.title}". Court staff will assign a new lawyer soon.`,
      type: "lawyer",
    });

    res.json({
      success: true,
      message: "Lawyer removed from case",
      case: caseDoc,
    });
  } catch (error) {
    console.error("Remove lawyer error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL APPROVED LAWYERS (for assignment dropdown)
// ─────────────────────────────────────────
export const getAvailableLawyers = async (req, res) => {
  try {
    const { specialization, district } = req.query;

    const filter = {
      role: "lawyer",
      verificationStatus: "approved",
      availability: { $ne: "unavailable" },
    };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (district) {
      filter.district = district;
    }

    const lawyers = await User.find(filter)
      .select("name email specialization experience district availability rating")
      .sort({ rating: -1, experience: -1 });

    res.json({
      success: true,
      lawyers,
      total: lawyers.length,
    });
  } catch (error) {
    console.error("Get available lawyers error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};