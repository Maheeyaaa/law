// backend/routes/documentRoutes.js
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

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("document"), uploadDocument);
router.get("/", getMyDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/download", downloadDocument);
router.delete("/:id", deleteDocument);

export default router;