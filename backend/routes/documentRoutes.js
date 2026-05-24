import express from "express";

import protect from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  downloadDocument,
} from "../controllers/documentController.js";

const router =
  express.Router();

router.use(
  protect
);

// Upload

router.post(
  "/upload",

  upload.single(
    "document"
  ),

  uploadDocument
);

// List

router.get(
  "/",

  getMyDocuments
);

// Download BEFORE :id

router.get(
  "/:id/download",

  downloadDocument
);

// Get one

router.get(
  "/:id",

  getDocumentById
);

// Delete

router.delete(
  "/:id",

  deleteDocument
);

export default router;