// backend/utils/scrapeProbono.js

import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const BASE_URL =
  "https://www.probono-doj.in/list-of-advocates.html";

const BAR_COUNCIL_ID = 21;

const PASSWORD =
  "lawyer@123";

// ─────────────────────────────────────────
// Sleep
// ─────────────────────────────────────────
const sleep = (ms) =>
  new Promise((r) =>
    setTimeout(r, ms)
  );

// ─────────────────────────────────────────
// Extract rows
// ─────────────────────────────────────────
async function scrapePages() {
  const lawyers = [];

  for (
    let page = 1;
    page <= 5;
    page++
  ) {
    try {
      const url =
        `${BASE_URL}?AdvocateSearch%5Bbar_council%5D=${BAR_COUNCIL_ID}&page=${page}&per-page=50`;

      if (page > 1) {
        await sleep(
          1500
        );
      }

      const response =
        await axios.get(
          url,
          {
            timeout:
              15000,

            headers: {
              "User-Agent":
                "Mozilla/5.0",
            },
          }
        );

      const $ =
        cheerio.load(
          response.data
        );

      const rows =
        $("table tr")
          .slice(1);

      if (
        rows.length ===
        0
      ) {
        break;
      }

      rows.each(
        (
          _,
          row
        ) => {
          const cells =
            $(row)
              .find(
                "td"
              );

          if (
            cells.length <
            4
          )
            return;

          const name =
            $(cells[1])
              .text()
              .trim();

          if (
            !name
          )
            return;

          lawyers.push(
            {
              name,

              enrollmentNo:
                $(
                  cells[2]
                )
                  .text()
                  .trim(),

              registrationNo:
                $(
                  cells[3]
                )
                  .text()
                  .trim(),
            }
          );
        }
      );
    } catch (
      error
    ) {
      console.log(
        `Page ${page} failed`
      );
    }
  }

  return lawyers;
}

// ─────────────────────────────────────────
// Normalize
// ─────────────────────────────────────────
function mapLawyer(
  lawyer,
  index
) {
  const cleanName =
    lawyer.name.startsWith(
      "Adv."
    )
      ? lawyer.name
      : `Adv. ${lawyer.name}`;

  return {
    name:
      cleanName,

    email:
      `probono.${index}@advocate.in`,

    role:
      "lawyer",

    password:
      PASSWORD,

    state:
      "Telangana",

    district:
      "Hyderabad",

    barCouncilNumber:
      lawyer.enrollmentNo ||
      "",

    specialization:
      "General Practice",

    experience:
      0,

    languages: [
      "Telugu",
      "English",
    ],

    education:
      [
        "LL.B.",
      ],

    courtsPracticing:
      [],

    verificationStatus:
      "approved",

    isVerified:
      true,

    isProfileComplete:
      true,

    importedFrom:
      "DoJ Pro Bono",

    scrapedFrom:
      "DoJ Pro Bono Portal",

    dataSource:
      BASE_URL,

    proBonoRegistrationNo:
      lawyer.registrationNo,

    consultationFee:
      0,

    rating:
      0,

    totalReviews:
      0,

    casesHandled:
      0,

    casesWon:
      0,

    availability:
      "available",
  };
}

// ─────────────────────────────────────────
// Save
// ─────────────────────────────────────────
async function saveLawyers(
  lawyers
) {
  let count =
    0;

  for (
    let i = 0;
    i <
    lawyers.length;
    i++
  ) {
    const lawyer =
      mapLawyer(
        lawyers[i],
        i
      );

    lawyer.password =
      await bcrypt.hash(
        lawyer.password,
        10
      );

    await User.findOneAndUpdate(
      {
        importedFrom:
          "DoJ Pro Bono",

        barCouncilNumber:
          lawyer.barCouncilNumber,
      },

      lawyer,

      {
        upsert:
          true,
      }
    );

    count++;
  }

  return count;
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────
export async function scrapeProBono() {
  try {
    console.log(
      "Starting Pro Bono sync..."
    );

    const lawyers =
      await scrapePages();

    if (
      lawyers.length ===
      0
    ) {
      return {
        success:
          false,

        count:
          0,

        error:
          "No lawyers found",
      };
    }

    const saved =
      await saveLawyers(
        lawyers
      );

    return {
      success:
        true,

      count:
        saved,
      source:
        "DoJ Pro Bono",
    };
  } catch (
    error
  ) {
    return {
      success:
        false,

      error:
        error.message,
      count:
        0,
    };
  }
}

export default
  scrapeProBono;