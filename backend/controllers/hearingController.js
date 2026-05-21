// backend/controllers/hearingController.js

import Hearing from "../models/Hearing.js";
import Case from "../models/Case.js";
import Notification from "../models/Notification.js";
import Activity from "../models/Activity.js";
import { addTimelineEvent } from "../helpers/timelineHelper.js";

// Valid hearing statuses — single source of truth
const VALID_STATUSES = ["Scheduled", "Completed", "Postponed", "Cancelled"];

// ─────────────────────────────────────────
// GET ALL HEARINGS FOR CITIZEN
// ─────────────────────────────────────────
export const getMyHearings = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const filter = { citizen: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (upcoming === "true") {
      filter.hearingDate = { $gte: new Date() };
      filter.status = { $in: ["Scheduled", "Postponed"] };
    }

    const hearings = await Hearing.find(filter)
      .populate("case", "caseId title caseType status")
      .sort({ hearingDate: 1 });

    res.json({ hearings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// GET NEXT UPCOMING HEARING
// ─────────────────────────────────────────
export const getNextHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      citizen: req.user.id,
      hearingDate: { $gte: new Date() },
      status: { $in: ["Scheduled", "Postponed"] },
    })
      .populate("case", "caseId title caseType")
      .sort({ hearingDate: 1 });

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// GET HEARING BY ID
// ─────────────────────────────────────────
export const getHearingById = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("case", "caseId title caseType status");

    if (!hearing) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// CREATE HEARING (Court Staff)
// ─────────────────────────────────────────
export const createHearing = async (req, res) => {
  try {
    const {
      caseId,
      citizenId,
      hearingDate,
      hearingTime,
      courtRoom,
      judgeName,
      purpose,
      notes,
    } = req.body;

    if (!caseId || !hearingDate || !purpose) {
      return res.status(400).json({
        message: "Case ID, date, and purpose are required",
      });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    const hearing = await Hearing.create({
      case: caseId,
      citizen: citizenId || caseDoc.citizen,
      hearingDate,
      hearingTime: hearingTime || "10:00 AM",
      courtRoom: courtRoom || null,
      judgeName: judgeName || null,
      purpose,
      notes: notes || "",
      // status defaults to "Scheduled" per model
    });

    caseDoc.nextHearingDate = hearingDate;
    await caseDoc.save();

    await addTimelineEvent({
      caseId: caseDoc._id,
      citizenId: caseDoc.citizen,
      event: "Consultation Scheduled",
      description: `Consultation scheduled for ${new Date(hearingDate).toLocaleDateString("en-IN")} — ${purpose}`,
      type: "hearing_scheduled",
    });

    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Consultation Scheduled",
      message: `A consultation has been scheduled for your request "${caseDoc.title}" on ${new Date(hearingDate).toLocaleDateString("en-IN")}`,
      type: "hearing",
    });

    res.status(201).json({
      success: true,
      message: "Consultation scheduled successfully",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE HEARING (Court Staff)
// ─────────────────────────────────────────
export const updateHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const {
      hearingDate,
      hearingTime,
      courtRoom,
      judgeName,
      purpose,
      status,
      notes,
    } = req.body;

    if (hearingDate) hearing.hearingDate = hearingDate;
    if (hearingTime) hearing.hearingTime = hearingTime;
    if (courtRoom !== undefined) hearing.courtRoom = courtRoom;
    if (judgeName !== undefined) hearing.judgeName = judgeName;
    if (purpose) hearing.purpose = purpose;
    if (notes !== undefined) hearing.notes = notes;

    // Validate status against enum
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }
      hearing.status = status;
    }

    await hearing.save();

    await Notification.create({
      citizen: hearing.citizen,
      title: "Consultation Updated",
      message: `Your consultation details have been updated. Please check the latest schedule.`,
      type: "hearing",
    });

    res.json({
      success: true,
      message: "Consultation updated successfully",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// CANCEL HEARING (Court Staff)
// ─────────────────────────────────────────
export const cancelHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    hearing.status = "Cancelled";
    await hearing.save();

    await Notification.create({
      citizen: hearing.citizen,
      title: "Consultation Cancelled",
      message: `Your consultation scheduled for ${new Date(hearing.hearingDate).toLocaleDateString("en-IN")} has been cancelled.`,
      type: "hearing",
    });

    res.json({
      success: true,
      message: "Consultation cancelled",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// REQUEST RESCHEDULE (Citizen)
// ─────────────────────────────────────────
export const requestReschedule = async (req, res) => {
  try {
    const { reason } = req.body;

    const hearing = await Hearing.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!hearing) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Allow reschedule request for Scheduled OR Postponed
    if (!["Scheduled", "Postponed"].includes(hearing.status)) {
      return res.status(400).json({
        message: "Only scheduled or postponed consultations can request rescheduling",
      });
    }

    await Activity.create({
      citizen: req.user.id,
      case: hearing.case,
      text: `Reschedule requested for consultation on ${new Date(hearing.hearingDate).toLocaleDateString("en-IN")}. Reason: ${reason || "Not specified"}`,
      type: "general",
    });

    res.json({
      success: true,
      message: "Reschedule request submitted. Our team will review and update the consultation.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};