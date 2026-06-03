// backend/utils/scrapeProbono.js

import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const BASE_URL = "https://www.probono-doj.in/list-of-advocates.html";
const TELANGANA_BAR_COUNCIL_ID = 21;
const PASSWORD = "lawyer@123";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────────────
// Scrape ALL pages until no more lawyers
// ──────────────────────────────────────────────────────────────────
async function scrapePages() {
  const lawyers = [];
  let page = 1;
  const MAX_PAGES = 100; // safety limit (~5000 lawyers max)

  console.log(`📋 Scraping all Telangana Pro Bono lawyers...`);

  while (page <= MAX_PAGES) {
    try {
      const url = `${BASE_URL}?AdvocateSearch%5Bbar_council%5D=${TELANGANA_BAR_COUNCIL_ID}&page=${page}&per-page=50`;

      if (page > 1) await sleep(1200); // be polite

      const response = await axios.get(url, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const $ = cheerio.load(response.data);
      const rows = $("table tbody tr");

      if (rows.length === 0) {
        console.log(`   Page ${page}: empty, stopping`);
        break;
      }

      let pageCount = 0;
      rows.each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 4) return;

        const name = $(cells[1]).text().trim();
        if (!name) return;

        lawyers.push({
          name,
          enrollmentNo:   $(cells[2]).text().trim(),
          registrationNo: $(cells[3]).text().trim(),
        });
        pageCount++;
      });

      console.log(`   Page ${page}: ${pageCount} lawyers (total: ${lawyers.length})`);

      // If less than 50, this was the last page
      if (pageCount < 50) {
        console.log(`   ✓ Last page reached`);
        break;
      }

      page++;
    } catch (error) {
      console.log(`   ❌ Page ${page} failed: ${error.message}`);
      break;
    }
  }

  return lawyers;
}

// ──────────────────────────────────────────────────────────────────
// Normalize lawyer for DB
// ──────────────────────────────────────────────────────────────────
function mapLawyer(lawyer, index) {
  const cleanName = lawyer.name.startsWith("Adv.")
    ? lawyer.name
    : `Adv. ${lawyer.name}`;

  return {
    name:                  cleanName,
    email:                 `probono.${index}@advocate.in`,
    role:                  "lawyer",
    password:              PASSWORD,
    state:                 "Telangana",
    district:              "",  // ✅ Removed fake "Hyderabad" — DoJ doesn't provide this
    barCouncilNumber:      lawyer.enrollmentNo || "",
    specialization:        "General Practice",
    experience:            0,
    languages:             ["English", "Telugu"],
    education:             ["LL.B."],
    courtsPracticing:      [],
    verificationStatus:    "approved",
    isVerified:            true,
    isProfileComplete:     true,
    importedFrom:          "DoJ Pro Bono",
    scrapedFrom:           "DoJ Pro Bono Portal",
    dataSource:            BASE_URL,
    proBonoRegistrationNo: lawyer.registrationNo,
    consultationFee:       0,
    rating:                0,
    totalReviews:          0,
    casesHandled:          0,
    casesWon:              0,
    availability:          "available",
  };
}

// ──────────────────────────────────────────────────────────────────
// Save to DB
// ──────────────────────────────────────────────────────────────────
async function saveLawyers(lawyers) {
  let count = 0;
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (let i = 0; i < lawyers.length; i++) {
    const lawyer = mapLawyer(lawyers[i], i);
    lawyer.password = hashedPassword;

    try {
      await User.findOneAndUpdate(
        {
          importedFrom:     "DoJ Pro Bono",
          barCouncilNumber: lawyer.barCouncilNumber,
        },
        lawyer,
        { upsert: true }
      );
      count++;
    } catch (err) {
      if (!err.message.includes("duplicate")) {
        console.log(`   ⚠️  Skipped ${lawyer.name}: ${err.message}`);
      }
    }
  }

  return count;
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
export async function scrapeProBono() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║  🔄 TELANGANA PRO BONO LAWYERS SYNC            ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  try {
    const startTime = Date.now();

    const lawyers = await scrapePages();

    if (lawyers.length === 0) {
      return { success: false, count: 0, error: "No lawyers scraped" };
    }

    console.log(`\n💾 Saving ${lawyers.length} lawyers to database...`);
    const saved = await saveLawyers(lawyers);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║  ✅ SYNC COMPLETE                              ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log(`   Scraped: ${lawyers.length}`);
    console.log(`   Saved:   ${saved}`);
    console.log(`   Time:    ${duration}s\n`);

    return { success: true, count: saved, source: "DoJ Pro Bono" };
  } catch (error) {
    console.error("\n❌ Scrape failed:", error.message);
    return { success: false, error: error.message, count: 0 };
  }
}

export default scrapeProBono;