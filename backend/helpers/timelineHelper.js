// backend/helpers/timelineHelper.js

import CaseTimeline from "../models/CaseTimeline.js";

export const addTimelineEvent = async ({
  caseId,
  citizenId,
  event,
  description,
  type,
}) => {
  try {
    await CaseTimeline.create({
      case: caseId,
      citizen: citizenId,
      event,
      description: description || "",
      type: type || "general",
      completed: true,
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("Timeline event creation failed:", error.message);
  }
};