import FAQ from "../models/FAQ.js";
import SupportMessage from "../models/SupportMessage.js";
import Notification from "../models/Notification.js";

// ======================
// Get FAQs
// ======================

export const getFAQs =
async (req, res) => {
  try {
    const filter = {};

    if (
      req.query.category
    ) {
      filter.category =
        req.query.category;
    }

    const [
      faqs,
      categories,
    ] =
      await Promise.all([
        FAQ.find(
          filter
        ).sort({
          category: 1,
          order: 1,
        }),

        FAQ.distinct(
          "category"
        ),
      ]);

    res.json({
      faqs,
      categories,
    });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Submit Support
// ======================

export const submitSupportMessage =
async (
  req,
  res
) => {
  try {
    const {
      subject,
      message,
    } =
      req.body;

    if (
      !subject ||
      !message
    ) {
      return res
        .status(400)
        .json({
          message:
            "Subject and message are required",
        });
    }

    const ticket =
      await SupportMessage.create(
        {
          citizen:
            req.user.id,

          subject,

          message,
        }
      );

    res
      .status(201)
      .json({
        message:
          "Support request submitted",

        supportMessage:
          ticket,
      });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// My Support
// ======================

export const getMySupportMessages =
async (
  req,
  res
) => {
  try {
    const messages =
      await SupportMessage.find(
        {
          citizen:
            req.user.id,
        }
      ).sort({
        createdAt:
          -1,
      });

    res.json({
      count:
        messages.length,

      messages,
    });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Single Ticket
// ======================

export const getSupportMessageById =
async (
  req,
  res
) => {
  try {
    const message =
      await SupportMessage.findOne(
        {
          _id:
            req.params.id,

          citizen:
            req.user.id,
        }
      );

    if (
      !message
    ) {
      return res
        .status(404)
        .json({
          message:
            "Support message not found",
        });
    }

    res.json({
      message,
    });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Admin Update Status
// ======================

export const updateSupportStatus =
async (
  req,
  res
) => {
  try {
    const {
      status,
    } =
      req.body;

    const allowed =
      [
        "open",
        "in_progress",
        "resolved",
      ];

    if (
      !allowed.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status",
        });
    }

    const ticket =
      await SupportMessage.findByIdAndUpdate(
        req.params.id,

        {
          status,
        },

        {
          new:
            true,
        }
      );

    if (
      !ticket
    ) {
      return res
        .status(404)
        .json({
          message:
            "Support ticket not found",
        });
    }

    await Notification.create(
      {
        citizen:
          ticket.citizen,

        title:
          "Support Updated",

        message:
          `Your support request is now ${status}.`,

        type:
          "system",
      }
    );

    res.json({
      success:
        true,

      supportMessage:
        ticket,
    });
  } catch (
    error
  ) {
    res
      .status(500)
      .json({
        message:
          error.message,
      });
  }
};