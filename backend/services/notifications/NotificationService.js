// backend/services/notifications/NotificationService.js
// ══════════════════════════════════════════════════════════════════
// Unified service for creating notifications.
// Creates DB record AND sends browser push in one call.
// ══════════════════════════════════════════════════════════════════

import Notification from "../../models/Notification.js";
import PushService from "./PushService.js";

class NotificationService {

  /**
   * Create a notification — saves to DB and sends browser push
   * 
   * @param {Object} params
   * @param {String} params.userId       - User to notify
   * @param {String} params.title        - Notification title
   * @param {String} params.message      - Notification body
   * @param {String} params.type         - Type: "hearing_reminder", "case_update", etc.
   * @param {String} params.subType      - Subtype for filtering
   * @param {String} params.relatedCase  - SavedCase _id (optional)
   * @param {String} params.link         - URL to navigate when clicked
   * @param {Object} params.changeDetails- Extra data about the change
   * @param {Boolean} params.sendPush    - Whether to send browser push (default true)
   */
  async send({
    userId,
    title,
    message,
    type = "system",
    subType = null,
    relatedCase = null,
    link = null,
    changeDetails = null,
    sendPush = true,
  }) {
    try {
      // 1. Create DB notification
      const notification = await Notification.create({
        citizen:       userId,
        title,
        message,
        type,
        subType,
        relatedCase,
        link,
        changeDetails,
        read:          false,
        pushSent:      false,
      });

      // 2. Send browser push (if enabled)
      if (sendPush) {
        const pushResult = await PushService.sendToUser(userId, {
          title,
          body: message,
          tag:  type,
          url:  link || "/",
          data: {
            notificationId: notification._id.toString(),
            type,
            subType,
            relatedCase: relatedCase?.toString(),
          },
        });

        // Update push delivery status
        notification.pushSent   = pushResult.sent > 0;
        notification.pushSentAt = pushResult.sent > 0 ? new Date() : null;
        notification.pushError  = pushResult.error || null;
        await notification.save();
      }

      return notification;

    } catch (error) {
      console.error("[NotificationService] send failed:", error.message);
      throw error;
    }
  }

  /**
   * Check if a similar notification was already sent recently (prevent duplicates)
   * 
   * @param {String} userId
   * @param {String} relatedCase
   * @param {String} subType
   * @param {Number} hoursAgo  - Look back this many hours
   */
  async wasRecentlySent(userId, relatedCase, subType, hoursAgo = 24) {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const existing = await Notification.findOne({
      citizen:     userId,
      relatedCase,
      subType,
      createdAt:   { $gte: cutoff },
    });

    return !!existing;
  }
}

export default new NotificationService();