// backend/utils/scrapeLawyers.js

import axios from "axios";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const DEFAULT_PASSWORD = "lawyer@123";
const BATCH_SIZE = 50;

// ─────────────────────────────────────────
// Attempt external collection
// ─────────────────────────────────────────
async function attemptScraping() {
  try {
    const response = await axios.get(
      "https://www.indiamart.com/impcat/lawyer-services.html",
      {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0",
        },
      }
    );

    if (response.status !== 200) {
      return [];
    }

    // Reserved for future parsing
    return [];
  } catch (error) {
    console.log(
      "Scraping unavailable:",
      error.message
    );

    return [];
  }
}

// ─────────────────────────────────────────
// Prepare lawyer document
// ─────────────────────────────────────────
async function normalizeLawyer(
  lawyer
) {
  return {
    name:
      lawyer.name,

    email:
      lawyer.email,

    password:
      await bcrypt.hash(
        DEFAULT_PASSWORD,
        10
      ),

    role:
      "lawyer",

    state:
      "Telangana",

    district:
      lawyer.district,

    specialization:
      lawyer.specialization,

    experience:
      lawyer.experience,

    barCouncilNumber:
      lawyer.barCouncilNumber,

    languages:
      lawyer.languages || [],

    bio:
      lawyer.bio || "",

    education:
      lawyer.education || [],

    courtsPracticing:
      lawyer.courtsPracticing ||
      [],

    phone:
      lawyer.phone || "",

    consultationFee:
      lawyer.consultationFee ||
      0,

    rating:
      lawyer.rating || 0,

    totalReviews:
      lawyer.totalReviews || 0,

    casesHandled:
      lawyer.casesHandled || 0,

    casesWon:
      lawyer.casesWon || 0,

    availability:
      lawyer.availability ||
      "available",

    availableDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],

    verificationStatus:
      "approved",

    isVerified:
      true,

    isProfileComplete:
      true,

    scrapedFrom:
      "External",
  };
}

// ─────────────────────────────────────────
// Save lawyers
// ─────────────────────────────────────────
async function saveLawyers(
  lawyers
) {
  let inserted = 0;

  for (
    let i = 0;
    i < lawyers.length;
    i += BATCH_SIZE
  ) {
    const batch =
      lawyers.slice(
        i,
        i +
          BATCH_SIZE
      );

    try {
      const result =
        await User.insertMany(
          batch,
          {
            ordered:
              false,
          }
        );

      inserted +=
        result.length;
    } catch (
      error
    ) {
      if (
        error.writeErrors
      ) {
        inserted +=
          batch.length -
          error
            .writeErrors
            .length;
      }
    }
  }

  return inserted;
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────
export async function scrapeAndSaveLawyers() {
  try {
    console.log(
      "Starting lawyer sync..."
    );

    const raw =
      await attemptScraping();

    if (
      raw.length === 0
    ) {
      return {
        success:
          false,

        message:
          "No lawyer data available",
      };
    }

    const lawyers =
      await Promise.all(
        raw.map(
          normalizeLawyer
        )
      );

    await User.deleteMany({
      role:
        "lawyer",

      scrapedFrom:
        "External",
    });

    const inserted =
      await saveLawyers(
        lawyers
      );

    return {
      success:
        true,

      count:
        inserted,
    };
  } catch (
    error
  ) {
    console.error(
      error
    );

    return {
      success:
        false,

      error:
        error.message,
    };
  }
}

export default
  scrapeAndSaveLawyers;