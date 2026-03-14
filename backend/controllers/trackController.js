// backend/controllers/trackController.js

import Case from "../models/Case.js";
import CaseTimeline from "../models/CaseTimeline.js";

// Track case by case ID string (e.g. #LM-2025-0041)
export const trackCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({ message: "Case ID is required" });
    }

    // Find case by caseId string
    const caseDoc = await Case.findOne({
      caseId: caseId,
      citizen: req.user.id,
    })
      .populate("assignedLawyer", "name specialization");

    if (!caseDoc) {
      return res.status(404).json({
        message: "Case not found. Please check the Case ID and try again.",
      });
    }

    // Get timeline events
    const timeline = await CaseTimeline.find({ case: caseDoc._id })
      .sort({ completedAt: 1 });

    const completedTypes = timeline.map((t) => t.type);

    // Build tracking steps
    const trackingSteps = [
      {
        step: 1,
        event: "Case Filed",
        type: "case_filed",
        icon: "📝",
        completed: completedTypes.includes("case_filed"),
        date: timeline.find((t) => t.type === "case_filed")?.completedAt || null,
        description: "Your case has been submitted to the court",
      },
      {
        step: 2,
        event: "Under Review",
        type: "under_review",
        icon: "🔍",
        completed: completedTypes.includes("under_review"),
        date: timeline.find((t) => t.type === "under_review")?.completedAt || null,
        description: "Court is reviewing your case details",
      },
      {
        step: 3,
        event: "Lawyer Assigned",
        type: "lawyer_assigned",
        icon: "👤",
        completed: completedTypes.includes("lawyer_assigned"),
        date: timeline.find((t) => t.type === "lawyer_assigned")?.completedAt || null,
        description: caseDoc.assignedLawyer
          ? `Assigned to ${caseDoc.assignedLawyer.name}`
          : "Awaiting lawyer assignment",
      },
      {
        step: 4,
        event: "Hearing Scheduled",
        type: "hearing_scheduled",
        icon: "📅",
        completed: completedTypes.includes("hearing_scheduled"),
        date: timeline.find((t) => t.type === "hearing_scheduled")?.completedAt || null,
        description: caseDoc.nextHearingDate
          ? `Hearing on ${caseDoc.nextHearingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
          : "Awaiting hearing schedule",
      },
      {
        step: 5,
        event: "Hearing Completed",
        type: "hearing_completed",
        icon: "✅",
        completed: completedTypes.includes("hearing_completed"),
        date: timeline.find((t) => t.type === "hearing_completed")?.completedAt || null,
        description: "Court hearing has been conducted",
      },
      {
        step: 6,
        event: "Judgment / Resolution",
        type: "resolved",
        icon: "⚖️",
        completed: completedTypes.includes("resolved"),
        date: timeline.find((t) => t.type === "resolved")?.completedAt || null,
        description:
          caseDoc.status === "Resolved"
            ? "Case has been resolved"
            : "Awaiting judgment",
      },
    ];

    // Find current step (first incomplete step)
    const currentStep =
      trackingSteps.find((s) => !s.completed)?.step ||
      trackingSteps.length;

    res.json({
      case: {
        caseId: caseDoc.caseId,
        title: caseDoc.title,
        caseType: caseDoc.caseType,
        status: caseDoc.status,
        priority: caseDoc.priority,
        filingDate: caseDoc.filingDate,
        assignedLawyer: caseDoc.assignedLawyer,
        nextHearingDate: caseDoc.nextHearingDate,
      },
      trackingSteps,
      currentStep,
      totalSteps: trackingSteps.length,
      completedSteps: trackingSteps.filter((s) => s.completed).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track by MongoDB _id (alternative)
export const trackCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("assignedLawyer", "name specialization");

    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Reuse same logic — redirect to track by caseId
    req.params.caseId = caseDoc.caseId;
    return trackCase(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};