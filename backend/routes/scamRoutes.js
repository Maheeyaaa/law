import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  restrictTo,
} from "../middleware/roleMiddleware.js";

import ScamPattern from "../models/ScamPattern.js";

import ScamReport from "../models/ScamReport.js";

const router =
  express.Router();

// ======================
// My Reports
// ======================

router.get(
  "/reports",

  protect,

  async (
    req,
    res
  ) => {
    try {
      const reports =
        await ScamReport.find(
          {
            reportedBy:
              req.user.id,
          }
        )
          .sort({
            createdAt:
              -1,
          });

      res.json({
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
// Admin Reports
// ======================

router.get(
  "/reports/all",

  protect,

  restrictTo(
    "admin"
  ),

  async (
    req,
    res
  ) => {
    try {
      const reports =
        await ScamReport.find()
          .populate(
            "reportedBy",

            "name email"
          )
          .sort({
            createdAt:
              -1,
          });

      res.json({
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
// Read Patterns
// ======================

router.get(
  "/patterns",

  protect,

  async (
    req,
    res
  ) => {
    try {
      const patterns =
        await ScamPattern.find(
          {
            isActive:
              true,
          }
        );

      res.json({
        patterns,
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
// Create Pattern
// ======================

router.post(
  "/patterns",

  protect,

  restrictTo(
    "admin"
  ),

  async (
    req,
    res
  ) => {
    try {
      const pattern =
        await ScamPattern.create(
          req.body
        );

      res
        .status(
          201
        )
        .json({
          pattern,
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
// Update
// ======================

router.put(
  "/patterns/:id",

  protect,

  restrictTo(
    "admin"
  ),

  async (
    req,
    res
  ) => {
    try {
      const pattern =
        await ScamPattern.findByIdAndUpdate(
          req.params.id,

          req.body,

          {
            new:
              true,
          }
        );

      res.json({
        pattern,
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
// Delete
// ======================

router.delete(
  "/patterns/:id",

  protect,

  restrictTo(
    "admin"
  ),

  async (
    req,
    res
  ) => {
    try {
      await ScamPattern.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Deleted",
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