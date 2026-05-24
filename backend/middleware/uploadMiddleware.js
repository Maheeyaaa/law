import multer from "multer";
import path from "path";
import fs from "fs";

// ======================
// Ensure Upload Folder
// ======================

const uploadPath =
  "uploads/";

if (
  !fs.existsSync(
    uploadPath
  )
) {
  fs.mkdirSync(
    uploadPath,
    {
      recursive:
        true,
    }
  );
}

// ======================
// Storage
// ======================

const storage =
  multer.diskStorage(
    {
      destination:
        (
          req,
          file,
          cb
        ) => {
          cb(
            null,
            uploadPath
          );
        },

      filename:
        (
          req,
          file,
          cb
        ) => {
          const unique =
            `${Date.now()}-${Math.round(
              Math.random() *
                1e9
            )}`;

          cb(
            null,

            unique +
              path.extname(
                file.originalname
              )
          );
        },
    }
  );

// ======================
// Allowed Types
// ======================

const allowed =
  [
    "application/pdf",

    "image/jpeg",

    "image/jpg",

    "image/png",

    "text/plain",

    "audio/wav",

    "audio/mpeg",

    "audio/mp3",

    "audio/webm",
  ];

const fileFilter =
(
  req,
  file,
  cb
) => {
  if (
    allowed.includes(
      file.mimetype
    )
  ) {
    return cb(
      null,
      true
    );
  }

  cb(
    new Error(
      "Unsupported file type"
    ),
    false
  );
};

// ======================
// Upload Middleware
// ======================

const upload =
  multer({
    storage,

    fileFilter,

    limits:
      {
        fileSize:
          10 *
          1024 *
          1024,
      },
  });

export default upload;