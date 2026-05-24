// backend/controllers/dashboardController.js

import Case from "../models/Case.js";
import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";

// =========================
// Dashboard
// =========================

export const getDashboardData = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const now = new Date();

    const [
      totalCases,
      activeCases,
      resolvedCases,
      pendingDocuments,
      recentCases,
      recentActivities,
      unreadNotifications,
      recentDocuments,
    ] = await Promise.all([
      Case.countDocuments({
        citizen: citizenId,
      }),

      Case.countDocuments({
        citizen: citizenId,
        status: "Active",
      }),

      Case.countDocuments({
        citizen: citizenId,
        status: "Resolved",
      }),

      Document.countDocuments({
        citizen: citizenId,
        status: "Pending",
      }),

      Case.find({
        citizen: citizenId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(6),

      Activity.find({
        citizen: citizenId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5),

      Notification.countDocuments({
        citizen: citizenId,
        read: false,
      }),

      Document.find({
        citizen: citizenId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5),
    ]);

    const activities = recentActivities.map((item) => {
      const diff = now - item.createdAt;

      const minutes =
        Math.floor(diff / 60000);

      const hours =
        Math.floor(diff / 3600000);

      const days =
        Math.floor(diff / 86400000);

      let time = "Just now";

      if (minutes >= 1 && minutes < 60)
        time = `${minutes}m ago`;

      if (hours >= 1 && hours < 24)
        time = `${hours}h ago`;

      if (days >= 1)
        time = `${days}d ago`;

      return {
        ...item.toObject(),
        time,
      };
    });

    res.json({
      stats: {
        totalCases,
        activeCases,
        resolvedCases,
        documentsPending:
          pendingDocuments,
      },

      welcome: {
        activeCases,
        pendingDocuments,
      },

      recentCases,

      activities,

      recentDocuments:
        recentDocuments.map(
          (doc) => ({
            _id: doc._id,
            name: doc.name,
            fileType:
              doc.fileType,

            fileSize:
              doc.fileSize,

            status:
              doc.status,

            uploadedAt:
              doc.createdAt.toLocaleDateString(
                "en-US",
                {
                  month:
                    "short",

                  day:
                    "numeric",
                }
              ),
          })
        ),

      unreadNotifications,
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load dashboard",
    });
  }
};

// =========================
// Global Search
// =========================

export const globalSearch =
async (req, res) => {
  try {
    const { q } =
      req.query;

    if (
      !q ||
      q.trim().length < 2
    ) {
      return res
        .status(400)
        .json({
          message:
            "Search query too short",
        });
    }

    const citizenId =
      req.user.id;

    const regex = {
      $regex: q,
      $options: "i",
    };

    const [
      cases,
      documents,
    ] =
      await Promise.all([
        Case.find({
          citizen:
            citizenId,

          $or: [
            {
              title:
                regex,
            },

            {
              caseId:
                regex,
            },

            {
              description:
                regex,
            },

            {
              caseType:
                regex,
            },
          ],
        })
          .select(
            "caseId title status caseType"
          )
          .limit(
            5
          ),

        Document.find({
          citizen:
            citizenId,

          $or: [
            {
              name:
                regex,
            },

            {
              originalName:
                regex,
            },
          ],
        })
          .select(
            "name fileType fileSize createdAt"
          )
          .limit(
            5
          ),
      ]);

    res.json({
      results: {
        cases,
        documents,
      },

      totalResults:
        cases.length +
        documents.length,
    });
  } catch (error) {
    console.error(
      "Search error:",
      error
    );

    res.status(500).json({
      message:
        "Search failed",
    });
  }
};