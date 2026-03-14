// backend/controllers/documentController.js
import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import path from "path";

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { caseId } = req.body;

    // Calculate file size string
    const sizeInBytes = req.file.size;
    let fileSize;
    if (sizeInBytes >= 1024 * 1024) {
      fileSize = (sizeInBytes / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      fileSize = (sizeInBytes / 1024).toFixed(1) + " KB";
    }

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
      fileSize,
    });

    await document.save();

    // Log activity
    await Activity.create({
      citizen: req.user.id,
      case: caseId || null,
      text: `Document uploaded: ${req.file.originalname}`,
      type: "document_uploaded",
    });

    // Notification
    await Notification.create({
      citizen: req.user.id,
      title: "Document Uploaded",
      message: `Your document "${req.file.originalname}" has been uploaded and is pending verification.`,
      type: "document",
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all documents for logged-in citizen
export const getMyDocuments = async (req, res) => {
  try {
    const { caseId, status } = req.query;

    const filter = { citizen: req.user.id };

    if (caseId) {
      filter.case = caseId;
    }

    if (status) {
      filter.status = status;
    }

    const documents = await Document.find(filter)
      .populate("case", "caseId title")
      .sort({ createdAt: -1 });

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("case", "caseId title");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      citizen: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};