// backend/controllers/trackController.js

import Case from "../models/Case.js";

// Track case by Case ID string (e.g. #LM-2025-0041)
export const trackCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required",
      });
    }

    const caseDoc = await Case.findOne({
      caseId: caseId,
      citizen: req.user.id,
    });

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found. Please check the Case ID and try again.",
      });
    }

    // Status-based tracking steps
    // No court workflow, no lawyer assignment steps, no hearing steps
    const trackingSteps = [
      {
        step: 1,
        event: "Case Registered",
        type: "registered",
        icon: "📝",
        description: "Your case ID has been registered in the system",
        completed: true, // Always true if case exists
        date: caseDoc.createdAt,
      },
      {
        step: 2,
        event: "Under Review",
        type: "under_review",
        icon: "🔍",
        description: "Case is currently being reviewed",
        completed: ["Active", "Pending", "Resolved", "Closed"].includes(
          caseDoc.status
        ),
        date: caseDoc.updatedAt,
      },
      {
        step: 3,
        event: "Active",
        type: "active",
        icon: "⚡",
        description: "Case is actively in progress",
        completed: ["Active", "Resolved", "Closed"].includes(caseDoc.status),
        date: caseDoc.status === "Active" ? caseDoc.updatedAt : null,
      },
      {
        step: 4,
        event: "Resolved / Closed",
        type: "resolved",
        icon: "⚖️",
        description:
          caseDoc.status === "Resolved" || caseDoc.status === "Closed"
            ? "Case has been resolved"
            : "Awaiting resolution",
        completed: ["Resolved", "Closed"].includes(caseDoc.status),
        date:
          caseDoc.status === "Resolved" || caseDoc.status === "Closed"
            ? caseDoc.updatedAt
            : null,
      },
    ];

    const completedSteps = trackingSteps.filter((s) => s.completed).length;
    const currentStep =
      trackingSteps.find((s) => !s.completed)?.step || trackingSteps.length;

    res.json({
      success: true,
      case: {
        caseId: caseDoc.caseId,
        title: caseDoc.title,
        caseType: caseDoc.caseType,
        status: caseDoc.status,
        priority: caseDoc.priority,
        filingDate: caseDoc.filingDate,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt,
      },
      trackingSteps,
      currentStep,
      totalSteps: trackingSteps.length,
      completedSteps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Track by MongoDB _id (alternative)
export const trackCaseById = async (req, res) => {
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

    req.params.caseId = caseDoc.caseId;
    return trackCase(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};