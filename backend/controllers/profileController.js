import User from "../models/User.js";
import bcrypt from "bcrypt";

// ======================
// Get Profile
// ======================

export const getProfile =
async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password"
      );

    if (
      !user
    ) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    res.json({
      user,
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
// Update Profile
// ======================

export const updateProfile =
async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      bio,
    } =
      req.body;

    const user =
      await User.findById(
        req.user.id
      );

    if (
      !user
    ) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    // Email uniqueness

    if (
      email &&
      email !==
        user.email
    ) {
      const exists =
        await User.findOne(
          {
            email,
          }
        );

      if (
        exists
      ) {
        return res
          .status(
            400
          )
          .json({
            message:
              "Email already in use",
          });
      }

      user.email =
        email;
    }

    if (
      name !==
      undefined
    ) {
      user.name =
        name;
    }

    if (
      phone !==
      undefined
    ) {
      user.phone =
        phone;
    }

    if (
      address !==
      undefined
    ) {
      user.address =
        address;
    }

    if (
      bio !==
      undefined
    ) {
      user.bio =
        bio;
    }

    await user.save();

    const updated =
      user.toObject();

    delete updated.password;

    res.json({
      message:
        "Profile updated successfully",

      user:
        updated,
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
// Change Password
// ======================

export const changePassword =
async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } =
      req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res
        .status(
          400
        )
        .json({
          message:
            "Current and new password are required",
        });
    }

    if (
      newPassword.length <
      6
    ) {
      return res
        .status(
          400
        )
        .json({
          message:
            "Password must be at least 6 characters",
        });
    }

    const user =
      await User.findById(
        req.user.id
      );

    if (
      !user
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "User not found",
        });
    }

    const valid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (
      !valid
    ) {
      return res
        .status(
          400
        )
        .json({
          message:
            "Current password is incorrect",
        });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    res.json({
      message:
        "Password updated successfully",
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
// Upload Avatar
// ======================

export const uploadAvatar =
async (
  req,
  res
) => {
  try {
    if (
      !req.file
    ) {
      return res
        .status(
          400
        )
        .json({
          message:
            "No file uploaded",
        });
    }

    const user =
      await User.findById(
        req.user.id
      );

    if (
      !user
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "User not found",
        });
    }

    user.avatar =
      req.file.filename;

    await user.save();

    res.json({
      message:
        "Avatar uploaded successfully",

      avatar:
        req.file.filename,
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
// Update Preferred Language
// ======================

export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    const validLanguages = ["english", "telugu", "hindi"];

    if (!language || !validLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Choose english, telugu, or hindi.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.preferredLanguage = language.toLowerCase();
    await user.save();

    res.json({
      success: true,
      message: "Language preference saved",
      language: user.preferredLanguage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// Get Preferred Language
// ======================

export const getLanguage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("preferredLanguage");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      language: user.preferredLanguage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ══════════════════════════════════════════════════════════
// Get Notification Preferences
// ══════════════════════════════════════════════════════════
export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "notificationPreferences pushSubscriptions"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        hearingReminders: true,
        caseUpdates:      true,
        pushEnabled:      false,
        reminderDays:     [7, 1, 0],
      },
      devices: (user.pushSubscriptions || []).map((sub) => ({
        deviceLabel: sub.deviceLabel,
        createdAt:   sub.createdAt,
        endpoint:    sub.endpoint,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// Update Notification Preferences
// ══════════════════════════════════════════════════════════
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { hearingReminders, caseUpdates, reminderDays } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        hearingReminders: true,
        caseUpdates:      true,
        pushEnabled:      false,
        reminderDays:     [7, 1, 0],
      };
    }

    if (hearingReminders !== undefined) {
      user.notificationPreferences.hearingReminders = hearingReminders;
    }
    if (caseUpdates !== undefined) {
      user.notificationPreferences.caseUpdates = caseUpdates;
    }
    if (Array.isArray(reminderDays)) {
      user.notificationPreferences.reminderDays = reminderDays;
    }

    await user.save();

    res.json({
      success: true,
      message: "Notification preferences updated",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// Remove A Specific Device
// ══════════════════════════════════════════════════════════
export const removeDevice = async (req, res) => {
  try {
    const { endpoint } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const before = user.pushSubscriptions.length;
    user.pushSubscriptions = user.pushSubscriptions.filter(
      (sub) => sub.endpoint !== endpoint
    );

    if (user.pushSubscriptions.length === 0) {
      user.notificationPreferences.pushEnabled = false;
    }

    await user.save();

    res.json({
      success: true,
      removed:   before - user.pushSubscriptions.length,
      remaining: user.pushSubscriptions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};