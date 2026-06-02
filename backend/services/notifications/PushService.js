// backend/services/notifications/PushService.js
// ══════════════════════════════════════════════════════════════════
// Handles sending Web Push notifications to users' browsers.
// ══════════════════════════════════════════════════════════════════

import webpush from "web-push";
import User from "../../models/User.js";

// ── Configure VAPID once at startup ───────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.warn("[PushService] ⚠️  VAPID keys missing in .env — push disabled");
} else {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log("[PushService] ✅ VAPID configured");
}

class PushService {

  async sendToUser(userId, payload) {
    try {
      const user = await User.findById(userId).select("pushSubscriptions notificationPreferences");

      if (!user) {
        return { sent: 0, failed: 0 };
      }

      if (!user.notificationPreferences?.pushEnabled) {
        return { sent: 0, failed: 0, skipped: true };
      }

      if (!user.pushSubscriptions?.length) {
        return { sent: 0, failed: 0 };
      }

      return await this.sendToSubscriptions(user, payload);

    } catch (error) {
      console.error("[PushService] sendToUser failed:", error.message);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  async sendToSubscriptions(user, payload) {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon  || "/icon-192.png",
      badge: payload.badge || "/badge-72.png",
      tag:   payload.tag   || "default",
      url:   payload.url   || "/",
      data:  payload.data  || {},
    });

    let sent     = 0;
    let failed   = 0;
    const validSubs = [];

    const vapidPub  = process.env.VAPID_PUBLIC_KEY;
    const vapidPriv = process.env.VAPID_PRIVATE_KEY;
    const vapidSub  = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys:     sub.keys,
          },
          notificationPayload,
          {
            vapidDetails: {
              subject:    vapidSub,
              publicKey:  vapidPub,
              privateKey: vapidPriv,
            },
            TTL: 86400,
          }
        );
        sent++;
        validSubs.push(sub);

      } catch (err) {
        failed++;

        // 410 Gone / 404 Not Found → subscription expired, remove silently
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Don't push to validSubs — let it get cleaned up
        } else {
          console.error(`[PushService] Send failed for ${sub.deviceLabel}: ${err.statusCode} ${err.message}`);
          validSubs.push(sub);   // keep for retry
        }
      }
    }

    if (validSubs.length !== user.pushSubscriptions.length) {
      user.pushSubscriptions = validSubs;
      await user.save();
    }

    return { sent, failed };
  }

  async sendTestNotification(userId) {
    return await this.sendToUser(userId, {
      title: "🔔 Test Notification",
      body:  "Push notifications are working perfectly!",
      tag:   "test",
      url:   "/dashboard",
      data:  { type: "test" },
    });
  }
}

export default new PushService();