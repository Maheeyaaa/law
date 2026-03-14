// backend/controllers/dashboardController.js
import Case from "../models/Case.js";
import Hearing from "../models/Hearing.js";
import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get complete dashboard data in a single call
export const getDashboardData = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const now = new Date();

    // Run all queries in parallel
    const [
      totalCases,
      activeCases,
      pendingCases,
      resolvedCases,
      upcomingHearingsCount,
      recentCases,
      nextHearing,
      pendingDocs,
      recentActivities,
      unreadNotifications,
      assignedLawyerCases,
      recentDocuments,
    ] = await Promise.all([
      Case.countDocuments({ citizen: citizenId }),
      Case.countDocuments({ citizen: citizenId, status: "Active" }),
      Case.countDocuments({ citizen: citizenId, status: "Pending" }),
      Case.countDocuments({ citizen: citizenId, status: "Resolved" }),
      Hearing.countDocuments({
        citizen: citizenId,
        hearingDate: { $gte: now },
        status: "Scheduled",
      }),
      Case.find({ citizen: citizenId })
        .populate("assignedLawyer", "name specialization")
        .sort({ createdAt: -1 })
        .limit(6),
      Hearing.findOne({
        citizen: citizenId,
        hearingDate: { $gte: now },
        status: "Scheduled",
      })
        .populate("case", "caseId title caseType")
        .sort({ hearingDate: 1 }),
      Document.countDocuments({ citizen: citizenId, status: "Pending" }),
      Activity.find({ citizen: citizenId })
        .sort({ createdAt: -1 })
        .limit(5),
      Notification.countDocuments({ citizen: citizenId, read: false }),
      Case.find({
        citizen: citizenId,
        assignedLawyer: { $ne: null },
      })
        .populate("assignedLawyer", "name email specialization experience")
        .sort({ createdAt: -1 })
        .limit(4),
      Document.find({ citizen: citizenId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Build relative time for activities
    const activitiesWithTime = recentActivities.map((a) => {
      const diff = now - a.createdAt;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      let time;
      if (minutes < 1) time = "Just now";
      else if (minutes < 60) time = `${minutes}m ago`;
      else if (hours < 24) time = `${hours}h ago`;
      else time = `${days}d ago`;

      return { ...a.toObject(), time };
    });

    // Extract unique assigned lawyers
    const lawyerMap = new Map();
    assignedLawyerCases.forEach((c) => {
      if (c.assignedLawyer && !lawyerMap.has(c.assignedLawyer._id.toString())) {
        lawyerMap.set(c.assignedLawyer._id.toString(), {
          ...c.assignedLawyer.toObject(),
          caseName: c.title,
        });
      }
    });
    const assignedLawyers = Array.from(lawyerMap.values());

    // Format next hearing date for welcome message
    let nextHearingDate = null;
    if (nextHearing) {
      nextHearingDate = nextHearing.hearingDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
    }

    res.json({
      stats: {
        total: String(totalCases).padStart(2, "0"),
        active: String(activeCases).padStart(2, "0"),
        hearings: String(upcomingHearingsCount).padStart(2, "0"),
        resolved: String(resolvedCases).padStart(2, "0"),
      },
      welcome: {
        nextHearingDate,
        pendingDocs,
        totalActive: activeCases,
      },
      recentCases,
      nextHearing,
      activities: activitiesWithTime,
      assignedLawyers,
      recentDocuments: recentDocuments.map((d) => ({
        _id: d._id,
        name: d.name,
        fileType: d.fileType,
        fileSize: d.fileSize,
        date: d.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        status: d.status,
      })),
      unreadNotifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Global search across cases, hearings, documents
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query too short" });
    }

    const citizenId = req.user.id;
    const regex = { $regex: q, $options: "i" };

    const [cases, hearings, documents] = await Promise.all([
      Case.find({
        citizen: citizenId,
        $or: [
          { title: regex },
          { caseId: regex },
          { description: regex },
          { caseType: regex },
        ],
      })
        .select("caseId title status caseType")
        .limit(5),

      Hearing.find({
        citizen: citizenId,
        $or: [{ purpose: regex }, { courtRoom: regex }, { judgeName: regex }],
      })
        .populate("case", "caseId title")
        .select("hearingDate purpose status")
        .limit(5),

      Document.find({
        citizen: citizenId,
        $or: [{ name: regex }, { originalName: regex }],
      })
        .select("name fileType fileSize createdAt")
        .limit(5),
    ]);

    res.json({
      results: {
        cases,
        hearings,
        documents,
      },
      totalResults: cases.length + hearings.length + documents.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};