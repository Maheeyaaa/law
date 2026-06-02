// backend/controllers/pushController.js
// ══════════════════════════════════════════════════════════════════
// Handles browser push subscription management.
// Endpoints: subscribe, unsubscribe, test, get-public-key
// ══════════════════════════════════════════════════════════════════

import User from "../models/User.js";
import PushService from "../services/notifications/PushService.js";

// ══════════════════════════════════════════════════════════════════
// GET PUBLIC KEY — Frontend needs this to create subscription
// ══════════════════════════════════════════════════════════════════

export const getPublicKey = async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: "Push notifications not configured on server",
      });
    }
    return res.json({ success: true, publicKey });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// SUBSCRIBE — Save browser subscription to user profile
// ══════════════════════════════════════════════════════════════════

export const subscribe = async (req, res) => {
  try {
    const { subscription, deviceLabel } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription object",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if this endpoint already exists (prevent duplicates)
    const exists = user.pushSubscriptions.find(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (exists) {
      console.log("[Push subscribe] Subscription already exists");
      // Still mark push as enabled
      user.notificationPreferences.pushEnabled = true;
      await user.save();
      return res.json({
        success: true,
        message: "Already subscribed",
        alreadyExists: true,
      });
    }

    // Add new subscription
    user.pushSubscriptions.push({
      endpoint:    subscription.endpoint,
      keys:        subscription.keys,
      deviceLabel: deviceLabel || "Unknown Device",
      userAgent:   req.headers["user-agent"] || "",
      createdAt:   new Date(),
    });

    user.notificationPreferences.pushEnabled = true;
    await user.save();

    console.log(`[Push subscribe] User ${user._id} subscribed (${deviceLabel})`);

    return res.json({
      success: true,
      message: "Subscribed successfully",
      totalDevices: user.pushSubscriptions.length,
    });

  } catch (error) {
    console.error("[Push subscribe] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// UNSUBSCRIBE — Remove subscription
// ══════════════════════════════════════════════════════════════════

export const unsubscribe = async (req, res) => {
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

    // If no subscriptions left, disable push
    if (user.pushSubscriptions.length === 0) {
      user.notificationPreferences.pushEnabled = false;
    }

    await user.save();

    return res.json({
      success: true,
      removed: before - user.pushSubscriptions.length,
      remaining: user.pushSubscriptions.length,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// SEND TEST — Trigger a test notification to user's devices
// ══════════════════════════════════════════════════════════════════

export const sendTest = async (req, res) => {
  try {
    const result = await PushService.sendTestNotification(req.user.id);

    if (result.sent === 0) {
      return res.status(400).json({
        success: false,
        message: result.skipped
          ? "Push notifications are disabled. Please enable them first."
          : "No devices subscribed. Please enable notifications.",
        result,
      });
    }

    return res.json({
      success: true,
      message: `Test sent to ${result.sent} device(s)`,
      result,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// GET SUBSCRIPTIONS — List user's devices
// ══════════════════════════════════════════════════════════════════

export const getSubscriptions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("pushSubscriptions notificationPreferences");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      pushEnabled:   user.notificationPreferences?.pushEnabled || false,
      subscriptions: user.pushSubscriptions.map((sub) => ({
        deviceLabel: sub.deviceLabel,
        createdAt:   sub.createdAt,
        endpoint:    sub.endpoint.substring(0, 50) + "...",  // truncate for security
      })),
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};