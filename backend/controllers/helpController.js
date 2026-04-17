// backend/controllers/helpController.js

import FAQ from "../models/FAQ.js";
import SupportMessage from "../models/SupportMessage.js";
import Notification from "../models/Notification.js";

// Get all FAQs
export const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    const faqs = await FAQ.find(filter).sort({ category: 1, order: 1 });

    // Get unique categories
    const categories = await FAQ.distinct("category");

    res.json({ faqs, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit support message
export const submitSupportMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required",
      });
    }

    const supportMessage = await SupportMessage.create({
      citizen: req.user.id,
      subject,
      message,
    });

    res.status(201).json({
      message: "Support message submitted successfully. We'll get back to you soon.",
      supportMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my support messages
export const getMySupportMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ citizen: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single support message by ID
export const getSupportMessageById = async (req, res) => {
  try {
    const message = await SupportMessage.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Court staff: Update support message status
export const updateSupportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        message: "Status must be: open, in_progress, or resolved",
      });
    }

    const message = await SupportMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Support message not found" });
    }

    // Notify citizen of status update
    await Notification.create({
      citizen: message.citizen,
      title: "Support Ticket Updated",
      message: `Your support ticket "${message.subject}" status has been updated to: ${status}`,
      type: "system",
    });

    res.json({
      success: true,
      message: "Status updated",
      supportMessage: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};