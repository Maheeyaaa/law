import Case from "../models/Case.js";
import CaseTimeline from "../models/CaseTimeline.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import Document from "../models/Document.js";
import Hearing from "../models/Hearing.js"; 
import { addTimelineEvent } from "../helpers/timelineHelper.js";

export const createCase = async (req, res) => {
  try {
    
    const { title, description, caseType, priority, notes, district, courtName } = req.body;

    if (!title || !description || !caseType) {
      console.log("❌ Validation failed - missing fields");
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
      state: "Telangana",
      district: district || "",
      courtName: courtName || "",
      status: "Draft",
      cnrNumber: null,
    });

    await newCase.save();
    if (req.files?.length) {
      const docs = req.files.map((file) => ({
        citizen: req.user.id,
        case: newCase._id,

        name: file.originalname,
        originalName: file.originalname,

        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,

        status: "Pending",
      }));

      await Document.insertMany(docs);
    }
    await addTimelineEvent({
      caseId: newCase._id,
      citizenId: req.user.id,
      event: "Case Created",
      description: `Case "${title}" has been created and is awaiting court filing.`,
      type: "case_created",
    });

    await Activity.create({
      citizen: req.user.id,
      case: newCase._id,
      text: `New case created: ${title}`,
      type: "case_created",
    });

    await Notification.create({
      citizen: req.user.id,
      title: "Case Created Successfully",
      message: `Your case "${title}" has been created and is awaiting court filing.`,
      type: "case",
    });

    res.status(201).json({
      message: "Case filed successfully",
      case: newCase,
    });
  } catch (error) {
    console.log("❌ ERROR in createCase:", error);  // ← This will show the real error
    res.status(500).json({ error: error.message });
  }
};

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

export const getCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("assignedLawyer", "name email specialization experience phone");

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    const timeline = await CaseTimeline.find({ case: caseDoc._id })
      .sort({ completedAt: 1 });

    const documents = await Document.find({
      case: caseDoc._id,
      citizen: req.user.id,
    }).sort({ createdAt: -1 });

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

export const getCaseStats = async (req, res) => {
  try {
    const citizenId = req.user.id;

    const [total, draft, filed, active, pending, resolved, hearings] = await Promise.all([
      Case.countDocuments({ citizen: citizenId }),
      Case.countDocuments({ citizen: citizenId, status: "Draft" }),
      Case.countDocuments({ citizen: citizenId, status: "Filed" }),
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
      draft,
      filed,
      active,
      pending,
      resolved,
      hearings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCaseTimeline = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    const timeline = await CaseTimeline.find({ case: req.params.id })
      .sort({ completedAt: 1 });

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

export const updateCNR = async (req, res) => {
  try {
    if (req.user.role !== "court_staff") {
      return res.status(403).json({
        message: "Access denied. Only court_staff can file cases in court.",
      });
    }

    const { cnrNumber } = req.body;

    if (!cnrNumber) {
      return res.status(400).json({
        message: "CNR number is required",
      });
    }

    const cnrRegex = /^[A-Z]{4}\d{12}$/;
    if (!cnrRegex.test(cnrNumber)) {
      return res.status(400).json({
        message: "Invalid CNR number format",
        format: "Must be 4 letters + 12 digits (e.g., TSHY012345678901)",
      });
    }

    const existingCase = await Case.findOne({ cnrNumber });
    if (existingCase) {
      return res.status(400).json({
        message: "This CNR number is already assigned to another case",
        existingCaseId: existingCase.caseId,
      });
    }

    const caseDoc = await Case.findById(req.params.id);

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseDoc.cnrNumber) {
      return res.status(400).json({
        message: "Case already has CNR number assigned",
        cnrNumber: caseDoc.cnrNumber,
      });
    }

    caseDoc.cnrNumber = cnrNumber;
    caseDoc.status = "Filed";
    caseDoc.courtFilingDate = new Date();

    await caseDoc.save();

    await addTimelineEvent({
      caseId: caseDoc._id,
      citizenId: caseDoc.citizen,
      event: "Case Filed in Court",
      description: `Case officially filed in court with CNR: ${cnrNumber}`,
      type: "case_filed",
    });

    await Activity.create({
      citizen: caseDoc.citizen,
      case: caseDoc._id,
      text: `Case filed in court with CNR: ${cnrNumber}`,
      type: "case_filed",
    });

    await Notification.create({
      citizen: caseDoc.citizen,
      title: "Case Filed in Court",
      message: `Your case "${caseDoc.title}" has been officially filed in court. CNR: ${cnrNumber}`,
      type: "case",
    });

    res.json({
      message: "Case filed successfully in court",
      case: caseDoc,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};