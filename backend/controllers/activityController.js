// backend/controllers/activityController.js
import Activity from "../models/Activity.js";

// Get recent activity for logged-in citizen
export const getMyActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activities = await Activity.find({ citizen: req.user.id })
      .populate("case", "caseId title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Add relative time
    const now = new Date();
    const activitiesWithTime = activities.map((a) => {
      const diff = now - a.createdAt;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      let time;
      if (minutes < 1) time = "Just now";
      else if (minutes < 60) time = `${minutes}m ago`;
      else if (hours < 24) time = `${hours}h ago`;
      else time = `${days}d ago`;

      return {
        ...a.toObject(),
        time,
      };
    });

    res.json({ activities: activitiesWithTime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};