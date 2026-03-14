// backend/controllers/helpController.js

import FAQ from "../models/FAQ.js";
import SupportMessage from "../models/SupportMessage.js";

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