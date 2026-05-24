import Notification from "../models/Notification.js";

// ======================
// Get Notifications
// ======================

export const getMyNotifications =
async (req, res) => {
  try {
    const filter = {
      citizen:
        req.user.id,
    };

    if (
      req.query
        .unreadOnly ===
      "true"
    ) {
      filter.read =
        false;
    }

    const [
      notifications,
      unreadCount,
    ] =
      await Promise.all([
        Notification.find(
          filter
        )
          .sort({
            createdAt:
              -1,
          })
          .limit(
            50
          ),

        Notification.countDocuments(
          {
            citizen:
              req.user.id,

            read:
              false,
          }
        ),
      ]);

    res.json({
      notifications,

      unreadCount,
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
// Mark Read
// ======================

export const markAsRead =
async (
  req,
  res
) => {
  try {
    const item =
      await Notification.findOneAndUpdate(
        {
          _id:
            req.params
              .id,

          citizen:
            req.user.id,
        },

        {
          read:
            true,
        },

        {
          new:
            true,
        }
      );

    if (
      !item
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "Notification not found",
        });
    }

    res.json({
      message:
        "Notification updated",

      notification:
        item,
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Mark All
// ======================

export const markAllAsRead =
async (
  req,
  res
) => {
  try {
    const result =
      await Notification.updateMany(
        {
          citizen:
            req.user.id,

          read:
            false,
        },

        {
          read:
            true,
        }
      );

    res.json({
      message:
        "Notifications updated",

      modified:
        result.modifiedCount,
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Delete One
// ======================

export const deleteNotification =
async (
  req,
  res
) => {
  try {
    const deleted =
      await Notification.findOneAndDelete(
        {
          _id:
            req.params
              .id,

          citizen:
            req.user.id,
        }
      );

    if (
      !deleted
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "Notification not found",
        });
    }

    res.json({
      message:
        "Notification deleted",
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Clear Read
// ======================

export const clearAllRead =
async (
  req,
  res
) => {
  try {
    const result =
      await Notification.deleteMany(
        {
          citizen:
            req.user.id,

          read:
            true,
        }
      );

    res.json({
      message:
        "Read notifications cleared",

      deleted:
        result.deletedCount,
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};