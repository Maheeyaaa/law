// backend/controllers/documentController.js

import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import path from "path";
import fs from "fs";

// Helper — format bytes for display
const formatFileSize = (bytes) => {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  return (bytes / 1024).toFixed(1) + " KB";
};

// ─────────────────────────────────────────
// Upload document
// ─────────────────────────────────────────
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { caseId } = req.body;

    // Determine file type from extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    const typeMap = {
      ".pdf": "PDF",
      ".doc": "DOC",
      ".docx": "DOCX",
      ".jpg": "JPG",
      ".jpeg": "JPEG",
      ".png": "PNG",
      ".txt": "TXT",
    };
    const fileType = typeMap[ext] || "FILE";

    const document = new Document({
      citizen: req.user.id,
      case: caseId || null,
      name: req.file.originalname,
      originalName: req.file.originalname,
      filePath: req.file.filename,
      fileType,
      fileSize: req.file.size, // ← store raw bytes as Number
    });

    await document.save();

    await Activity.create({
      citizen: req.user.id,
      case: caseId || null,
      text: `Document uploaded: ${req.file.originalname}`,
      type: "document_uploaded",
    });

    await Notification.create({
      citizen: req.user.id,
      title: "Document Uploaded",
      message: `Your document "${req.file.originalname}" has been uploaded and is pending verification.`,
      type: "document",
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document: {
        ...document.toObject(),
        fileSizeFormatted: formatFileSize(req.file.size), // ← formatted for frontend
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Get all documents for logged-in citizen
// ─────────────────────────────────────────
export const getMyDocuments = async (req, res) => {
  try {
    const { caseId, status } = req.query;

    const filter = { citizen: req.user.id };
    if (caseId) filter.case = caseId;
    if (status) filter.status = status;

    const documents = await Document.find(filter)
      .populate("case", "caseId title")
      .sort({ createdAt: -1 });

    // Add formatted size to each document
    const documentsWithSize = documents.map((doc) => ({
      ...doc.toObject(),
      fileSizeFormatted: formatFileSize(doc.fileSize),
    }));

    res.json({ documents: documentsWithSize });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Get document by ID
// ─────────────────────────────────────────
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("case", "caseId title");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      document: {
        ...document.toObject(),
        fileSizeFormatted: formatFileSize(document.fileSize),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Delete document
// ─────────────────────────────────────────
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Prevent deletion of verified documents
    if (document.status === "Verified") {
      return res.status(400).json({
        message: "Cannot delete a verified document. Contact court staff.",
      });
    }

    // Delete physical file from disk
    const filePath = path.join(process.cwd(), "uploads", document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);

    // Log activity
    await Activity.create({
      citizen: req.user.id,
      case: document.case || null,
      text: `Document deleted: ${document.originalName}`,
      type: "general",
    });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Download document
// ─────────────────────────────────────────
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Use absolute path to avoid relative path issues
    const filePath = path.join(process.cwd(), "uploads", document.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found on server. It may have been deleted.",
      });
    }

    res.download(filePath, document.originalName, (err) => {
      if (err) {
        console.error("Download error:", err);
        // Only send error if headers not already sent
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file" });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};