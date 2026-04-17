// backend/controllers/lawyerPanelController.js

import User from "../models/User.js";
import LawyerRequest from "../models/LawyerRequest.js";
import Case from "../models/Case.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import Activity from "../models/Activity.js";
import CaseTimeline from "../models/CaseTimeline.js";
import { addTimelineEvent } from "../helpers/timelineHelper.js";

// ─────────────────────────────────────────
// GET LAWYER DASHBOARD
// ─────────────────────────────────────────
export const getLawyerDashboard = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const now = new Date();

    const [
      pendingRequests,
      acceptedRequests,
      totalCases,
      activeCases,
      resolvedCases,
      upcomingAppointments,
      recentRequests,
      assignedCases,
      unreadNotifications,
    ] = await Promise.all([
      // Request counts
      LawyerRequest.countDocuments({ lawyer: lawyerId, status: "pending" }),
      LawyerRequest.countDocuments({ lawyer: lawyerId, status: "accepted" }),

      // Case counts
      Case.countDocuments({ assignedLawyer: lawyerId }),
      Case.countDocuments({
        assignedLawyer: lawyerId,
        status: { $in: ["Active", "Filed", "Pending"] },
      }),
      Case.countDocuments({
        assignedLawyer: lawyerId,
        status: "Resolved",
      }),

      // Upcoming appointments
      Appointment.countDocuments({
        lawyer: lawyerId,
        appointmentDate: { $gte: now },
        status: "scheduled",
      }),

      // Recent 5 requests
      LawyerRequest.find({ lawyer: lawyerId })
        .populate("citizen", "name email phone district")
        .populate("case", "caseId title caseType status")
        .sort({ createdAt: -1 })
        .limit(5),

      // Recent 5 assigned cases
      Case.find({ assignedLawyer: lawyerId })
        .populate("citizen", "name email phone")
        .sort({ updatedAt: -1 })
        .limit(5),

      // Unread notifications
      Notification.countDocuments({
        citizen: lawyerId,
        read: false,
      }),
    ]);

    res.json({
      success: true,
      stats: {
        pendingRequests,
        acceptedRequests,
        totalCases,
        activeCases,
        resolvedCases,
        upcomingAppointments,
        unreadNotifications,
      },
      recentRequests,
      assignedCases,
    });
  } catch (error) {
    console.error("Lawyer dashboard error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL INCOMING REQUESTS
// ─────────────────────────────────────────
export const getIncomingRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { lawyer: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await LawyerRequest.find(filter)
      .populate("citizen", "name email phone district avatar")
      .populate("case", "caseId title caseType status priority district")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LawyerRequest.countDocuments(filter);

    const counts = {
      total: await LawyerRequest.countDocuments({ lawyer: req.user.id }),
      pending: await LawyerRequest.countDocuments({
        lawyer: req.user.id,
        status: "pending",
      }),
      accepted: await LawyerRequest.countDocuments({
        lawyer: req.user.id,
        status: "accepted",
      }),
      rejected: await LawyerRequest.countDocuments({
        lawyer: req.user.id,
        status: "rejected",
      }),
    };

    res.json({
      success: true,
      requests,
      counts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get incoming requests error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// ACCEPT A REQUEST
// ─────────────────────────────────────────
export const acceptRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;

    const request = await LawyerRequest.findOne({
      _id: req.params.id,
      lawyer: req.user.id,
      status: "pending",
    }).populate("citizen", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already responded to",
      });
    }

    // Update request status
    request.status = "accepted";
    request.responseMessage = responseMessage || "Your request has been accepted.";
    request.respondedAt = new Date();
    await request.save();

    // If request is linked to a case — assign lawyer to that case
    if (request.case) {
      const caseDoc = await Case.findById(request.case);
      if (caseDoc && !caseDoc.assignedLawyer) {
        caseDoc.assignedLawyer = req.user.id;
        caseDoc.status = "Active";
        await caseDoc.save();

        // Add timeline event
        await addTimelineEvent({
          caseId: caseDoc._id,
          citizenId: caseDoc.citizen,
          event: "Lawyer Assigned",
          description: `${req.user.name} has accepted your case and will be representing you.`,
          type: "lawyer_assigned",
        });

        // Log activity
        await Activity.create({
          citizen: caseDoc.citizen,
          case: caseDoc._id,
          text: `Lawyer ${req.user.name} accepted your request`,
          type: "lawyer_assigned",
        });
      }
    }

    // Update lawyer's casesHandled count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { casesHandled: 1 },
    });

    // Notify citizen
    await Notification.create({
      citizen: request.citizen._id,
      title: "Request Accepted! 🎉",
      message: `${req.user.name} has accepted your legal assistance request. ${responseMessage ? `Message: ${responseMessage}` : ""}`,
      type: "lawyer",
    });

    res.json({
      success: true,
      message: "Request accepted successfully",
      request,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// REJECT A REQUEST
// ─────────────────────────────────────────
export const rejectRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;

    const request = await LawyerRequest.findOne({
      _id: req.params.id,
      lawyer: req.user.id,
      status: "pending",
    }).populate("citizen", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already responded to",
      });
    }

    request.status = "rejected";
    request.responseMessage = responseMessage || "Sorry, I am unable to take your case at this time.";
    request.respondedAt = new Date();
    await request.save();

    // Notify citizen
    await Notification.create({
      citizen: request.citizen._id,
      title: "Request Update",
      message: `${req.user.name} is unable to take your request at this time. ${responseMessage ? `Reason: ${responseMessage}` : "Please try another lawyer."}`,
      type: "lawyer",
    });

    res.json({
      success: true,
      message: "Request rejected",
      request,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL ASSIGNED CASES
// ─────────────────────────────────────────
export const getMyCases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = { assignedLawyer: req.user.id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
        { caseType: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cases = await Case.find(filter)
      .populate("citizen", "name email phone district avatar")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    // Case stats
    const stats = {
      total: await Case.countDocuments({ assignedLawyer: req.user.id }),
      active: await Case.countDocuments({
        assignedLawyer: req.user.id,
        status: "Active",
      }),
      pending: await Case.countDocuments({
        assignedLawyer: req.user.id,
        status: "Pending",
      }),
      resolved: await Case.countDocuments({
        assignedLawyer: req.user.id,
        status: "Resolved",
      }),
    };

    res.json({
      success: true,
      cases,
      stats,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get my cases error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE CASE DETAILS
// ─────────────────────────────────────────
export const getCaseDetails = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      assignedLawyer: req.user.id,
    }).populate("citizen", "name email phone district address avatar");

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Get timeline
    const timeline = await CaseTimeline.find({ case: caseDoc._id })
      .sort({ completedAt: 1 });

    // Get documents for this case
    const Document = (await import("../models/Document.js")).default;
    const documents = await Document.find({ case: caseDoc._id })
      .sort({ createdAt: -1 });

    // Get hearings
    const Hearing = (await import("../models/Hearing.js")).default;
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
    console.error("Get case details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE CASE NOTES (lawyer adds notes)
// ─────────────────────────────────────────
export const updateCaseNotes = async (req, res) => {
  try {
    const { notes, status } = req.body;

    const caseDoc = await Case.findOne({
      _id: req.params.id,
      assignedLawyer: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Lawyer can only update notes and limited statuses
    const allowedStatuses = ["Active", "Pending", "Resolved"];

    if (notes !== undefined) caseDoc.notes = notes;

    if (status && allowedStatuses.includes(status)) {
      const oldStatus = caseDoc.status;
      caseDoc.status = status;

      // Add timeline event for status change
      if (oldStatus !== status) {
        await addTimelineEvent({
          caseId: caseDoc._id,
          citizenId: caseDoc.citizen,
          event: `Case Status Updated`,
          description: `Status changed from ${oldStatus} to ${status} by your lawyer.`,
          type: "status_changed",
        });

        // If resolved — update lawyer's casesWon
        if (status === "Resolved") {
          await User.findByIdAndUpdate(req.user.id, {
            $inc: { casesWon: 1 },
          });

          await addTimelineEvent({
            caseId: caseDoc._id,
            citizenId: caseDoc.citizen,
            event: "Case Resolved",
            description: "Your case has been resolved successfully.",
            type: "resolved",
          });
        }

        // Notify citizen of status change
        await Notification.create({
          citizen: caseDoc.citizen,
          title: "Case Status Updated",
          message: `Your case "${caseDoc.title}" status has been updated to: ${status}`,
          type: "case",
        });
      }
    }

    await caseDoc.save();

    res.json({
      success: true,
      message: "Case updated successfully",
      case: caseDoc,
    });
  } catch (error) {
    console.error("Update case notes error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET LAWYER'S APPOINTMENTS
// ─────────────────────────────────────────
export const getLawyerAppointments = async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    const filter = { lawyer: req.user.id };

    if (status) filter.status = status;

    if (upcoming === "true") {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = "scheduled";
    }

    const appointments = await Appointment.find(filter)
      .populate("citizen", "name email phone avatar district")
      .populate("case", "caseId title caseType status")
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Get lawyer appointments error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE APPOINTMENT STATUS
// ─────────────────────────────────────────
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, meetingLink } = req.body;

    const validStatuses = ["scheduled", "completed", "cancelled", "rescheduled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      lawyer: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = status;
    if (meetingLink) appointment.meetingLink = meetingLink;
    await appointment.save();

    // Notify citizen
    const statusMessages = {
      completed: "Your appointment has been marked as completed.",
      cancelled: "Your appointment has been cancelled by the lawyer.",
      rescheduled: "Your appointment has been rescheduled. Please check for updates.",
    };

    if (statusMessages[status]) {
      await Notification.create({
        citizen: appointment.citizen,
        title: "Appointment Update",
        message: statusMessages[status],
        type: "lawyer",
      });
    }

    res.json({
      success: true,
      message: "Appointment updated",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET LAWYER PROFILE (own profile)
// ─────────────────────────────────────────
export const getLawyerOwnProfile = async (req, res) => {
  try {
    const lawyer = await User.findById(req.user.id).select("-password");

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Get stats
    const totalCases = await Case.countDocuments({ assignedLawyer: req.user.id });
    const activeCases = await Case.countDocuments({
      assignedLawyer: req.user.id,
      status: { $in: ["Active", "Filed", "Pending"] },
    });
    const pendingRequests = await LawyerRequest.countDocuments({
      lawyer: req.user.id,
      status: "pending",
    });

    res.json({
      success: true,
      profile: lawyer,
      stats: {
        totalCases,
        activeCases,
        pendingRequests,
        casesHandled: lawyer.casesHandled,
        casesWon: lawyer.casesWon,
        rating: lawyer.rating,
        totalReviews: lawyer.totalReviews,
      },
    });
  } catch (error) {
    console.error("Get lawyer profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE LAWYER PROFILE
// ─────────────────────────────────────────
export const updateLawyerProfile = async (req, res) => {
  try {
    const {
      phone,
      address,
      bio,
      languages,
      availability,
      availableDays,
      consultationFee,
      specialization,
      courtsPracticing,
      education,
    } = req.body;

    const lawyer = await User.findById(req.user.id);

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update allowed fields
    if (phone !== undefined) lawyer.phone = phone;
    if (address !== undefined) lawyer.address = address;
    if (bio !== undefined) lawyer.bio = bio;
    if (languages) lawyer.languages = languages;
    if (availability) lawyer.availability = availability;
    if (availableDays) lawyer.availableDays = availableDays;
    if (consultationFee !== undefined) lawyer.consultationFee = consultationFee;
    if (specialization) lawyer.specialization = specialization;
    if (courtsPracticing) lawyer.courtsPracticing = courtsPracticing;
    if (education) lawyer.education = education;

    // Check if profile is complete
    lawyer.isProfileComplete = !!(
      lawyer.phone &&
      lawyer.bio &&
      lawyer.specialization &&
      lawyer.languages.length > 0
    );

    await lawyer.save();

    const updatedProfile = lawyer.toObject();
    delete updatedProfile.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update lawyer profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE AVAILABILITY ONLY (quick toggle)
// ─────────────────────────────────────────
export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    const validOptions = ["available", "busy", "unavailable"];
    if (!validOptions.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be: available, busy, or unavailable",
      });
    }

    await User.findByIdAndUpdate(req.user.id, { availability });

    res.json({
      success: true,
      message: `Availability updated to: ${availability}`,
      availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────
// GET LAWYER NOTIFICATIONS
// ─────────────────────────────────────────
export const getLawyerNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const filter = { citizen: req.user.id }; // notifications use "citizen" field for all users

    if (unreadOnly === "true") filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      citizen: req.user.id,
      read: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// MARK NOTIFICATION AS READ
// ─────────────────────────────────────────
export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, citizen: req.user.id },
      { read: true }
    );

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};