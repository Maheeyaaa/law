// backend/controllers/lawyerController.js

import User from "../models/User.js";
import LawyerRequest from "../models/LawyerRequest.js";
import Case from "../models/Case.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import Appointment from "../models/Appointment.js";
import Review from "../models/Review.js";

// Browse all approved lawyers with advanced filtering
export const browseLawyers = async (req, res) => {
  try {
    const {
      specialization,
      search,
      experience,
      language,
      district,
      availability,
      minExperience,
      maxExperience,
      minRating,
      sortBy = "rating",
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    const filter = {
      role: "lawyer",
      verificationStatus: "approved",
    };

    // Specialization filter
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    // District filter
    if (district) {
      filter.district = district;
      console.log(`🔍 Filtering by district: ${district}`);
    }

    // Language filter
    if (language) {
      filter.languages = { $in: [language] };
    }

    // Availability filter
    if (availability) {
      filter.availability = availability;
    }

    // Search filter (name or specialization)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    // Experience range filter
    if (minExperience || maxExperience) {
      filter.experience = {};
      if (minExperience) filter.experience.$gte = parseInt(minExperience);
      if (maxExperience) filter.experience.$lte = parseInt(maxExperience);
    } else if (experience) {
      // Legacy support for single experience filter
      filter.experience = { $gte: parseInt(experience) };
    }

    // Minimum rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "rating":
        sort = { rating: -1, totalReviews: -1 };
        break;
      case "experience":
        sort = { experience: -1 };
        break;
      case "casesHandled":
        sort = { casesHandled: -1 };
        break;
      case "name":
        sort = { name: 1 };
        break;
      default:
        sort = { rating: -1, experience: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const lawyers = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get unique values for filter dropdowns
    const allSpecializations = await User.distinct("specialization", {
      role: "lawyer",
      verificationStatus: "approved",
    });

     const specializations = allSpecializations.filter(s => s && s.trim() !== "");

    const allDistricts = await User.distinct("district", {
      role: "lawyer",
      verificationStatus: "approved",
      district: { $nin: [null, ""] },
    });
     const districts = allDistricts.filter(d => d && d.trim() !== "");

    const allLanguages = await User.distinct("languages", {
      role: "lawyer",
      verificationStatus: "approved",
    });
     const languages = allLanguages.filter(l => l && l.trim() !== "");

    res.json({
      success: true,
      lawyers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      specializations,
      districts,
      languages: languages.filter(Boolean),
    });
  } catch (error) {
    console.error("Browse lawyers error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single lawyer profile with enhanced details
export const getLawyerProfile = async (req, res) => {
  try {
    const lawyer = await User.findOne({
      _id: req.params.id,
      role: "lawyer",
      verificationStatus: "approved",
    }).select("-password");

    if (!lawyer) {
      return res.status(404).json({ 
        success: false, 
        message: "Lawyer not found" 
      });
    }

    // Count active cases
    const activeCases = await Case.countDocuments({
      assignedLawyer: lawyer._id,
      status: { $in: ["Active", "Pending", "Open", "Under Review", "In Progress"] },
    });

    // Check if current citizen already sent a request to this lawyer
    let existingRequest = null;
    if (req.user) {
      existingRequest = await LawyerRequest.findOne({
        citizen: req.user.id,
        lawyer: lawyer._id,
        status: "pending",
      });
    }

    // Get recent cases (anonymized for privacy)
    const recentCases = await Case.find({
      assignedLawyer: lawyer._id,
      status: { $in: ["Resolved", "Closed"] },
    })
      .select("caseType status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      lawyer,
      activeCases,
      alreadyRequested: !!existingRequest,
      recentCases,
    });
  } catch (error) {
    console.error("Get lawyer profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send request to a lawyer
export const sendRequest = async (req, res) => {
  try {
    const { lawyerId, caseId, message } = req.body;

    if (!lawyerId || !message) {
      return res.status(400).json({
        success: false,
        message: "Lawyer ID and message are required",
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
        message: "Lawyer not found" 
      });
    }

    // Check availability
    if (lawyer.availability === "unavailable") {
      return res.status(400).json({
        success: false,
        message: "This lawyer is currently unavailable",
      });
    }

    // Check if citizen already has a pending request to this lawyer
    const existingRequest = await LawyerRequest.findOne({
      citizen: req.user.id,
      lawyer: lawyerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request to this lawyer",
      });
    }

    // If caseId provided, verify the case belongs to this citizen
    if (caseId) {
      const caseDoc = await Case.findOne({
        _id: caseId,
        citizen: req.user.id,
      });

      if (!caseDoc) {
        return res.status(404).json({ 
          success: false, 
          message: "Case not found" 
        });
      }

      // Check if case already has a lawyer
      if (caseDoc.assignedLawyer) {
        return res.status(400).json({
          success: false,
          message: "This case already has an assigned lawyer",
        });
      }
    }

    const request = await LawyerRequest.create({
      citizen: req.user.id,
      lawyer: lawyerId,
      case: caseId || null,
      message,
    });

    // Log activity
    await Activity.create({
      citizen: req.user.id,
      case: caseId || null,
      text: `Lawyer request sent to ${lawyer.name}`,
      type: "general",
    });

    // Notify the lawyer
    await Notification.create({
      citizen: lawyerId, // notification goes to lawyer
      title: "New Client Request",
      message: `A citizen has requested your legal assistance`,
      type: "lawyer",
    });

    // Notify the citizen
    await Notification.create({
      citizen: req.user.id,
      title: "Request Sent",
      message: `Your request has been sent to ${lawyer.name}`,
      type: "lawyer",
    });

    res.status(201).json({
      success: true,
      message: "Request sent successfully",
      request,
    });
  } catch (error) {
    console.error("Send request error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get my sent requests (citizen view)
export const getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { citizen: req.user.id };

    if (status) {
      filter.status = status;
    }

    const requests = await LawyerRequest.find(filter)
      .populate("lawyer", "name email specialization experience district rating")
      .populate("case", "caseId title caseType status")
      .sort({ createdAt: -1 });

    const counts = {
      total: await LawyerRequest.countDocuments({ citizen: req.user.id }),
      pending: await LawyerRequest.countDocuments({ 
        citizen: req.user.id, 
        status: "pending" 
      }),
      accepted: await LawyerRequest.countDocuments({ 
        citizen: req.user.id, 
        status: "accepted" 
      }),
      rejected: await LawyerRequest.countDocuments({ 
        citizen: req.user.id, 
        status: "rejected" 
      }),
    };

    res.json({ 
      success: true, 
      requests, 
      counts 
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel a pending request
export const cancelRequest = async (req, res) => {
  try {
    const request = await LawyerRequest.findOne({
      _id: req.params.id,
      citizen: req.user.id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already responded to",
      });
    }

    await LawyerRequest.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: "Request cancelled successfully" 
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const { lawyerId, caseId, appointmentDate, appointmentTime, mode, notes } = req.body;

    if (!lawyerId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "Lawyer ID, date, and time are required",
      });
    }

    const lawyer = await User.findOne({
      _id: lawyerId,
      role: "lawyer",
      verificationStatus: "approved",
    });

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // Check if accepted request exists
    const acceptedRequest = await LawyerRequest.findOne({
      citizen: req.user.id,
      lawyer: lawyerId,
      status: "accepted",
    });

    if (!acceptedRequest) {
      return res.status(400).json({
        message: "You can only book an appointment after the lawyer accepts your request",
      });
    }

    const appointment = await Appointment.create({
      citizen: req.user.id,
      lawyer: lawyerId,
      case: caseId || null,
      lawyerRequest: acceptedRequest._id,
      appointmentDate,
      appointmentTime,
      mode: mode || "in_person",
      notes: notes || "",
    });

    await Notification.create({
      citizen: req.user.id,
      title: "Appointment Booked",
      message: `Your appointment with ${lawyer.name} has been booked for ${new Date(appointmentDate).toLocaleDateString("en-IN")}`,
      type: "lawyer",
    });

    await Notification.create({
      citizen: lawyerId,
      title: "New Appointment",
      message: `A client has booked an appointment with you on ${new Date(appointmentDate).toLocaleDateString("en-IN")}`,
      type: "lawyer",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Get my appointments (citizen)
// ─────────────────────────────────────────
export const getMyAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { citizen: req.user.id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate("lawyer", "name email specialization experience phone avatar")
      .populate("case", "caseId title caseType status")
      .sort({ appointmentDate: -1 });

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Cancel appointment
// ─────────────────────────────────────────
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      citizen: req.user.id,
      status: "scheduled",
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or already cancelled",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Submit review for lawyer
// ─────────────────────────────────────────
export const submitReview = async (req, res) => {
  try {
    const { rating, comment, caseId } = req.body;
    const lawyerId = req.params.lawyerId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const lawyer = await User.findOne({
      _id: lawyerId,
      role: "lawyer",
    });

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // Check duplicate review
    const existing = await Review.findOne({
      citizen: req.user.id,
      lawyer: lawyerId,
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this lawyer",
      });
    }

    await Review.create({
      citizen: req.user.id,
      lawyer: lawyerId,
      case: caseId || null,
      rating,
      comment: comment || "",
    });

    // Recalculate lawyer's average rating
    const allReviews = await Review.find({ lawyer: lawyerId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    lawyer.rating = Math.round(avgRating * 10) / 10;
    lawyer.totalReviews = allReviews.length;
    await lawyer.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      newRating: lawyer.rating,
      totalReviews: lawyer.totalReviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Get reviews for a lawyer
// ─────────────────────────────────────────
export const getLawyerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ lawyer: req.params.lawyerId })
      .populate("citizen", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    const lawyer = await User.findById(req.params.lawyerId)
      .select("name rating totalReviews");

    res.json({
      success: true,
      reviews,
      summary: {
        averageRating: lawyer?.rating || 0,
        totalReviews: lawyer?.totalReviews || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};