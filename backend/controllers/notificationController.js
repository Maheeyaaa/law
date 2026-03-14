// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";

// Get all notifications for logged-in citizen
export const getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const filter = { citizen: req.user.id };

    if (unreadOnly === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      citizen: req.user.id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, citizen: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { citizen: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete single notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear all read notifications
export const clearAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      citizen: req.user.id,
      read: true,
    });

    res.json({
      message: "All read notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};