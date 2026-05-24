import express from "express";

import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

import UserAnalytics from "../models/UserAnalytics.js";
import ScamReport from "../models/ScamReport.js";
import ScamPattern from "../models/ScamPattern.js";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";

const router =
  express.Router();

// ======================
// My Stats
// ======================

router.get(
  "/my-stats",

  protect,

  async (
    req,
    res
  ) => {
    try {
      let analytics =
        await UserAnalytics.findOne(
          {
            user:
              req.user.id,
          }
        );

      if (
        !analytics
      ) {
        analytics =
          await UserAnalytics.create(
            {
              user:
                req.user.id,
            }
          );
      }

      const [
        chats,
        sessions,
        reports,
      ] =
        await Promise.all([
          ChatMessage.countDocuments(
            {
              user:
                req.user.id,
            }
          ),

          ChatMessage.distinct(
            "sessionId",
            {
              user:
                req.user.id,
            }
          ),

          ScamReport.find(
            {
              reportedBy:
                req.user.id,
            }
          )
            .sort({
              createdAt:
                -1,
            })
            .limit(
              5
            ),
        ]);

      res.json({
        user: {
          name:
            req.user
              .name,

          email:
            req.user
              .email,

          memberSince:
            req.user
              .createdAt,
        },

        analytics: {
          featureUsage:
            analytics.featureUsage,

          scamStats:
            analytics.scamStats,

          totalMessages:
            chats,

          totalSessions:
            sessions.length,

          totalDocumentsUploaded:
            analytics.totalDocumentsUploaded,

          totalDocumentsProcessed:
            analytics.totalDocumentsProcessed,

          lastActive:
            analytics.lastActive,

          lastFeatureUsed:
            analytics.lastFeatureUsed,
        },

        recentScamReports:
          reports,
      });
    } catch (
      error
    ) {
      res
        .status(
          500
        )
        .json({
          error:
            error.message,
        });
    }
  }
);

// ======================
// Global Admin Stats
// ======================

router.get(
  "/global-stats",

  protect,

  restrictTo(
    "admin"
  ),

  async (
    req,
    res
  ) => {
    try {
      const [
        users,
        chats,
        analytics,
        patterns,
      ] =
        await Promise.all([
          User.countDocuments(),

          ChatMessage.countDocuments(),

          UserAnalytics.find(),

          ScamPattern.find()
            .sort({
              reportCount:
                -1,
            })
            .limit(
              10
            ),
        ]);

      const featureUsage =
        {};

      analytics.forEach(
        (
          item
        ) => {
          Object.keys(
            item.featureUsage
          ).forEach(
            (
              k
            ) => {
              featureUsage[
                k
              ] =
                (
                  featureUsage[
                    k
                  ] ||
                  0
                ) +
                item
                  .featureUsage[
                  k
                ];
            }
          );
        }
      );

      const scam =
        analytics.reduce(
          (
            acc,
            a
          ) => {
            acc.total +=
              a
                .scamStats
                .totalScansPerformed ||
              0;

            acc.detected +=
              a
                .scamStats
                .scamsDetected ||
              0;

            return acc;
          },

          {
            total:
              0,

            detected:
              0,
          }
        );

      res.json({
        users,

        chats,

        featureUsage,

        scam,

        patterns,

        generatedAt:
          new Date(),
      });
    } catch (
      error
    ) {
      res
        .status(
          500
        )
        .json({
          error:
            error.message,
        });
    }
  }
);

// ======================
// Scam Trends
// ======================

router.get(
  "/scam-trends",

  protect,

  async (
    req,
    res
  ) => {
    try {
      const date =
        new Date();

      date.setDate(
        date.getDate() -
          30
      );

      const reports =
        await ScamReport.find(
          {
            createdAt:
              {
                $gte:
                  date,
              },
          }
        );

      const trends =
        {};

      reports.forEach(
        (
          r
        ) => {
          const day =
            r.createdAt
              .toISOString()
              .split(
                "T"
              )[0];

          trends[
            day
          ] ||= {
            scam:
              0,

            genuine:
              0,
          };

          if (
            r.isScam
          ) {
            trends[
              day
            ].scam++;
          } else {
            trends[
              day
            ]
              .genuine++;
          }
        }
      );

      res.json({
        trends,
      });
    } catch (
      error
    ) {
      res
        .status(
          500
        )
        .json({
          error:
            error.message,
        });
    }
  }
);

export default router;