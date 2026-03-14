// backend/routes/documentRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("document"), uploadDocument);
router.get("/", getMyDocuments);
router.get("/:id", getDocumentById);
router.delete("/:id", deleteDocument);

export default router;