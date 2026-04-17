// backend/controllers/hearingController.js
import Hearing from "../models/Hearing.js";
import Case from "../models/Case.js";
import Notification from "../models/Notification.js";
import Activity from "../models/Activity.js";
import { addTimelineEvent } from "../helpers/timelineHelper.js";

// Get all hearings for logged-in citizen
export const getMyHearings = async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    const filter = { citizen: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (upcoming === "true") {
      filter.hearingDate = { $gte: new Date() };
      filter.status = "Scheduled";
    }

    const hearings = await Hearing.find(filter)
      .populate("case", "caseId title caseType status")
      .sort({ hearingDate: 1 });

    res.json({ hearings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get next upcoming hearing
export const getNextHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      citizen: req.user.id,
      hearingDate: { $gte: new Date() },
      status: "Scheduled",
    })
      .populate("case", "caseId title caseType")
      .sort({ hearingDate: 1 });

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get hearing by ID
export const getHearingById = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("case", "caseId title caseType status");

    if (!hearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Court staff: Create a hearing
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
        message: "Case ID, hearing date, and purpose are required",
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
    });

    // Update case nextHearingDate
    caseDoc.nextHearingDate = hearingDate;
    await caseDoc.save();

    // Add to timeline
    await addTimelineEvent({
      caseId: caseDoc._id,
      citizenId: caseDoc.citizen,
      event: "Hearing Scheduled",
      description: `Hearing scheduled for ${new Date(hearingDate).toLocaleDateString("en-IN")} — ${purpose}`,
      type: "hearing_scheduled",
    });

    // Notify citizen
    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Hearing Scheduled",
      message: `A hearing has been scheduled for your case "${caseDoc.title}" on ${new Date(hearingDate).toLocaleDateString("en-IN")}`,
      type: "hearing",
    });

    res.status(201).json({
      success: true,
      message: "Hearing scheduled successfully",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Court staff: Update a hearing
export const updateHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    const { hearingDate, hearingTime, courtRoom, judgeName, purpose, status, notes } = req.body;

    if (hearingDate) hearing.hearingDate = hearingDate;
    if (hearingTime) hearing.hearingTime = hearingTime;
    if (courtRoom !== undefined) hearing.courtRoom = courtRoom;
    if (judgeName !== undefined) hearing.judgeName = judgeName;
    if (purpose) hearing.purpose = purpose;
    if (status) hearing.status = status;
    if (notes !== undefined) hearing.notes = notes;

    await hearing.save();

    // Notify citizen of update
    await Notification.create({
      citizen: hearing.citizen,
      title: "Hearing Updated",
      message: `Your hearing details have been updated. Please check the latest schedule.`,
      type: "hearing",
    });

    res.json({
      success: true,
      message: "Hearing updated successfully",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Court staff: Cancel a hearing
export const cancelHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    hearing.status = "Cancelled";
    await hearing.save();

    // Notify citizen
    await Notification.create({
      citizen: hearing.citizen,
      title: "Hearing Cancelled",
      message: `Your hearing scheduled for ${new Date(hearing.hearingDate).toLocaleDateString("en-IN")} has been cancelled.`,
      type: "hearing",
    });

    res.json({
      success: true,
      message: "Hearing cancelled",
      hearing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Citizen: Request reschedule
export const requestReschedule = async (req, res) => {
  try {
    const { reason } = req.body;

    const hearing = await Hearing.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!hearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    if (hearing.status !== "Scheduled") {
      return res.status(400).json({
        message: "Only scheduled hearings can be rescheduled",
      });
    }

    // Log activity — court staff will handle actual reschedule
    await Activity.create({
      citizen: req.user.id,
      case: hearing.case,
      text: `Reschedule requested for hearing on ${new Date(hearing.hearingDate).toLocaleDateString("en-IN")}. Reason: ${reason || "Not specified"}`,
      type: "general",
    });

    res.json({
      success: true,
      message: "Reschedule request submitted. Court staff will review and update the hearing.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};