// backend/controllers/lawyerController.js

import User from "../models/User.js";
import LawyerRequest from "../models/LawyerRequest.js";
import Case from "../models/Case.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";

// Browse all approved lawyers
export const browseLawyers = async (req, res) => {
  try {
    const { specialization, search, experience, page = 1, limit = 10 } = req.query;

    const filter = {
      role: "lawyer",
      verificationStatus: "approved",
    };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (experience) {
      filter.experience = { $gte: parseInt(experience) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lawyers = await User.find(filter)
      .select("-password")
      .sort({ experience: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get unique specializations for filter dropdown
    const specializations = await User.distinct("specialization", {
      role: "lawyer",
      verificationStatus: "approved",
      specialization: { $ne: null, $ne: "" },
    });

    res.json({
      lawyers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      specializations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single lawyer profile
export const getLawyerProfile = async (req, res) => {
  try {
    const lawyer = await User.findOne({
      _id: req.params.id,
      role: "lawyer",
      verificationStatus: "approved",
    }).select("-password");

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // Count how many active cases this lawyer has
    const activeCases = await Case.countDocuments({
      assignedLawyer: lawyer._id,
      status: { $in: ["Active", "Pending"] },
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

    res.json({
      lawyer,
      activeCases,
      alreadyRequested: !!existingRequest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send request to a lawyer
export const sendRequest = async (req, res) => {
  try {
    const { lawyerId, caseId, message } = req.body;

    if (!lawyerId || !message) {
      return res.status(400).json({
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
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // Check if citizen already has a pending request to this lawyer
    const existingRequest = await LawyerRequest.findOne({
      citizen: req.user.id,
      lawyer: lawyerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
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
        return res.status(404).json({ message: "Case not found" });
      }

      // Check if case already has a lawyer
      if (caseDoc.assignedLawyer) {
        return res.status(400).json({
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
      message: "Request sent successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      .populate("lawyer", "name email specialization experience")
      .populate("case", "caseId title caseType status")
      .sort({ createdAt: -1 });

    const counts = {
      total: await LawyerRequest.countDocuments({ citizen: req.user.id }),
      pending: await LawyerRequest.countDocuments({ citizen: req.user.id, status: "pending" }),
      accepted: await LawyerRequest.countDocuments({ citizen: req.user.id, status: "accepted" }),
      rejected: await LawyerRequest.countDocuments({ citizen: req.user.id, status: "rejected" }),
    };

    res.json({ requests, counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
        message: "Request not found or already responded to",
      });
    }

    await LawyerRequest.findByIdAndDelete(req.params.id);

    res.json({ message: "Request cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};