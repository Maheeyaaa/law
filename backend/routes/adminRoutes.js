import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import User from "../models/User.js";

import {
  scrapeAndSaveLawyers,
} from "../utils/scrapeLawyers.js";

import {
  scrapeProBono,
} from "../utils/scrapeProbono.js";

import protect from "../middleware/authMiddleware.js";
import {
  restrictTo,
} from "../middleware/roleMiddleware.js";

const router =
  express.Router();

// ======================
// Protection
// ======================

router.use(
  protect
);

router.use(
  restrictTo(
    "admin"
  )
);

// ======================
// CSV Upload
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
          const dir =
            "./uploads/csv";

          if (
            !fs.existsSync(
              dir
            )
          ) {
            fs.mkdirSync(
              dir,
              {
                recursive:
                  true,
              }
            );
          }

          cb(
            null,
            dir
          );
        },

      filename:
        (
          req,
          file,
          cb
        ) => {
          cb(
            null,
            `lawyers-${Date.now()}.csv`
          );
        },
    }
  );

const upload =
  multer({
    storage,

    fileFilter:
      (
        req,
        file,
        cb
      ) => {
        const ok =
          file.mimetype ===
            "text/csv" ||
          file.originalname.endsWith(
            ".csv"
          );

        cb(
          ok
            ? null
            : new Error(
                "Only CSV allowed"
              ),

          ok
        );
      },
  });

// ======================
// Import Lawyers
// ======================

router.post(
  "/import-lawyers",

  upload.single(
    "file"
  ),

  async (
    req,
    res
  ) => {
    try {
      if (
        !req.file
      ) {
        return res
          .status(
            400
          )
          .json({
            message:
              "CSV required",
          });
      }

      const rows =
        [];

      await new Promise(
        (
          resolve,
          reject
        ) => {
          fs.createReadStream(
            req.file.path
          )
            .pipe(
              csv()
            )

            .on(
              "data",

              (
                row
              ) =>
                rows.push(
                  row
                )
            )

            .on(
              "end",

              resolve
            )

            .on(
              "error",

              reject
            );
        }
      );

      let imported =
        0;

      for (
        const row of rows
      ) {
        if (
          !row.name
        ) {
          continue;
        }

        await User.findOneAndUpdate(
          {
            email:
              row.email ||
              generateEmail(
                row.name,
                imported
              ),
          },

          {
            name:
              row.name,

            email:
              row.email ||
              generateEmail(
                row.name,
                imported
              ),

            role:
              "lawyer",

            state:
              "Telangana",

            district:
              row.district ||
              "Hyderabad",

            specialization:
              row.specialization ||
              "",

            experience:
              parseInt(
                row.experience
              ) || 0,

            barCouncilNumber:
              row.barCouncilNumber ||
              "",

            languages:
              row.languages
                ?.split(
                  ","
                )
                .map(
                  (
                    l
                  ) =>
                    l.trim()
                ) ||
              [],

            phone:
              row.phone ||
              "",

            address:
              row.address ||
              "",

            importedFrom:
              "CSV",

            isVerified:
              true,
          },

          {
            upsert:
              true,
          }
        );

        imported++;
      }

      fs.unlinkSync(
        req.file.path
      );

      res.json({
        success:
          true,

        imported,
      });
    } catch (
      error
    ) {
      res
        .status(
          500
        )
        .json({
          error:
            error.message,
        });
    }
  }
);

// ======================
// Stats
// ======================

router.get(
  "/lawyers-stats",

  async (
    req,
    res
  ) => {
    try {
      const total =
        await User.countDocuments(
          {
            role:
              "lawyer",
          }
        );

      const csvImported =
        await User.countDocuments(
          {
            role:
              "lawyer",

            importedFrom:
              "CSV",
          }
        );

      const proBono =
        await User.countDocuments(
          {
            role:
              "lawyer",

            importedFrom:
              "DoJ Pro Bono",
          }
        );

      res.json({
        success:
          true,

        stats:
          {
            total,

            csvImported,

            proBono,
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
          error:
            error.message,
        });
    }
  }
);

// ======================
// Scrapers
// ======================

router.post(
  "/scrape-lawyers",

  async (
    req,
    res
  ) => {
    res.json(
      await scrapeAndSaveLawyers()
    );
  }
);

router.post(
  "/scrape-probono",

  async (
    req,
    res
  ) => {
    res.json(
      await scrapeProBono()
    );
  }
);

// ======================
// Cleanup
// ======================

router.delete(
  "/delete-all-lawyers",

  async (
    req,
    res
  ) => {
    const result =
      await User.deleteMany(
        {
          role:
            "lawyer",
        }
      );

    res.json({
      deleted:
        result.deletedCount,
    });
  }
);

// ======================
// Helpers
// ======================

function generateEmail(
  name,
  index
) {
  return (
    name
      .toLowerCase()
      .replace(
        /\s+/g,
        "."
      ) +
    index +
    "@advocate.in"
  );
}

export default router;