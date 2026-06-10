import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const MAX_PDF_PAGES = 25;
const MAX_DOCX_PAGES = 25;
const MAX_TXT_CHARS = 50000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ======================
// Helpers
// ======================

const formatFileSize = (
  bytes
) => {
  if (
    bytes >=
    1024 *
      1024
  ) {
    return (
      (
        bytes /
        (
          1024 *
          1024
        )
      ).toFixed(
        1
      ) +
      " MB"
    );
  }

  return (
    (
      bytes /
      1024
    ).toFixed(
      1
    ) +
    " KB"
  );
};

async function getPdfPageCount(buffer) {
  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(buffer);
    return result.numpages;
  } catch {
    return null;
  }
}

async function getDocxPageCount(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Estimate: roughly 300 words per page
    const estimatedPages = Math.ceil(wordCount / 300);
    return estimatedPages;
  } catch {
    return null;
  }
}

const detectType =
(
  filename
) => {
  const ext =
    path
      .extname(
        filename
      )
      .toLowerCase();

  const map =
    {
      ".pdf":
        "PDF",

      ".doc":
        "DOC",

      ".docx":
        "DOCX",

      ".jpg":
        "JPG",

      ".jpeg":
        "JPEG",

      ".png":
        "PNG",

      ".txt":
        "TXT",
    };

  return (
    map[
      ext
    ] ||
    "FILE"
  );
};

// ======================
// Upload
// ======================

export const uploadDocument =
async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join(process.cwd(), "uploads", req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(req.file.originalname).toLowerCase();

    // PDF check
    if (ext === ".pdf") {
      const pageCount = await getPdfPageCount(fileBuffer);
      if (pageCount !== null && pageCount > MAX_PDF_PAGES) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: `PDF has ${pageCount} pages. Maximum allowed is ${MAX_PDF_PAGES} pages.`,
        });
      }
    }

    // DOC/DOCX check
    if (ext === ".doc" || ext === ".docx") {
      const pageCount = await getDocxPageCount(fileBuffer);
      if (pageCount !== null && pageCount > MAX_DOCX_PAGES) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: `Document has approximately ${pageCount} pages. Maximum allowed is ${MAX_DOCX_PAGES} pages.`,
        });
      }
    }

    // Image size check
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
      if (req.file.size > MAX_IMAGE_SIZE) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: `Image size is ${formatFileSize(req.file.size)}. Maximum allowed is 5MB.`,
        });
      }
    }

    // TXT character check
    if (ext === ".txt") {
      const text = fileBuffer.toString("utf-8");
      if (text.length > MAX_TXT_CHARS) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: `Text file is too long (${text.length.toLocaleString()} characters). Maximum allowed is ${MAX_TXT_CHARS.toLocaleString()} characters.`,
        });
      }
    }

    const doc = await Document.create({
          citizen:
            req.user.id,

          case:
            req.body
              .caseId ||
            null,

          name:
            req.file
              .originalname,

          originalName:
            req.file
              .originalname,

          filePath:
            req.file
              .filename,

          fileType:
            detectType(
              req.file
                .originalname
            ),

          fileSize:
            req.file
              .size,

          status:
            "uploaded",
        }
      );

    await Activity.create(
      {
        citizen:
          req.user.id,

        text:
          `Uploaded ${doc.originalName}`,

        type:
          "document",
      }
    );

    await Notification.create(
      {
        citizen:
          req.user.id,

        title:
          "Document Uploaded",

        message:
          `${doc.originalName} uploaded successfully`,

        type:
          "document",
      }
    );

    res
      .status(
        201
      )
      .json({
        message:
          "Upload successful",

        document:
          {
            ...doc.toObject(),

            fileSizeFormatted:
              formatFileSize(
                doc.fileSize
              ),
          },
      });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Get Documents
// ======================

export const getMyDocuments =
async (
  req,
  res
) => {
  try {
    const filter =
      {
        citizen:
          req.user.id,
      };

    if (
      req.query
        .caseId
    ) {
      filter.case =
        req.query
          .caseId;
    }

    const docs =
      await Document.find(
        filter
      )
        .sort(
          {
            createdAt:
              -1,
          }
        );

    res.json({
      documents:
        docs.map(
          (
            d
          ) => ({
            ...d.toObject(),

            fileSizeFormatted:
              formatFileSize(
                d.fileSize
              ),
          })
        ),
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Get One
// ======================

export const getDocumentById =
async (
  req,
  res
) => {
  try {
    const doc =
      await Document.findOne(
        {
          _id:
            req.params
              .id,

          citizen:
            req.user.id,
        }
      );

    if (
      !doc
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "Document not found",
        });
    }

    res.json({
      document:
        {
          ...doc.toObject(),

          fileSizeFormatted:
            formatFileSize(
              doc.fileSize
            ),
        },
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Delete
// ======================

export const deleteDocument =
async (
  req,
  res
) => {
  try {
    const doc =
      await Document.findOne(
        {
          _id:
            req.params
              .id,

          citizen:
            req.user.id,
        }
      );

    if (
      !doc
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "Document not found",
        });
    }

    const file =
      path.join(
        process.cwd(),
        "uploads",
        doc.filePath
      );

    if (
      fs.existsSync(
        file
      )
    ) {
      fs.unlinkSync(
        file
      );
    }

    await doc.deleteOne();

    res.json({
      message:
        "Document deleted",
    });
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};

// ======================
// Download
// ======================

export const downloadDocument =
async (
  req,
  res
) => {
  try {
    const doc =
      await Document.findOne(
        {
          _id:
            req.params
              .id,

          citizen:
            req.user.id,
        }
      );

    if (
      !doc
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "Document not found",
        });
    }

    const file =
      path.join(
        process.cwd(),
        "uploads",
        doc.filePath
      );

    if (
      !fs.existsSync(
        file
      )
    ) {
      return res
        .status(
          404
        )
        .json({
          message:
            "File missing",
        });
    }

    res.download(
      file,
      doc.originalName
    );
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        message:
          error.message,
      });
  }
};