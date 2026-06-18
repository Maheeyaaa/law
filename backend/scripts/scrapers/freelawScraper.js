import axios from "axios";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import ScrapedLawyer from "../../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────
const URLS = [
  { url: "https://www.freelaw.in/advocates-in-hyderabad", district: "Hyderabad" },
  { url: "https://www.freelaw.in/advocates-in-telangana", district: null }, // varies
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const DELAY_MS = 1500;

// ─── Helpers ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cleanText = (text) => text?.replace(/\s+/g, " ").trim() || "";

/**
 * Decode Cloudflare's email obfuscation
 * Input:  "186b71767f70"
 * Output: "abc@xyz.com"
 */
function decodeCloudflareEmail(hex) {
  try {
    const r = parseInt(hex.substr(0, 2), 16);
    let email = "";
    for (let n = 2; n < hex.length; n += 2) {
      email += String.fromCharCode(parseInt(hex.substr(n, 2), 16) ^ r);
    }
    return email;
  } catch {
    return null;
  }
}

/**
 * Extract email from FreeLaw card
 */
function extractEmail($, card) {
  // Method 1: Cloudflare obfuscated link
  const emailLink = card.find('a[href*="/cdn-cgi/l/email-protection"]').attr("href");
  if (emailLink) {
    const hash = emailLink.split("#")[1];
    if (hash) {
      const decoded = decodeCloudflareEmail(hash);
      if (decoded) return decoded;
    }
  }

  // Method 2: __cf_email__ span with data-cfemail attribute
  const cfSpan = card.find(".__cf_email__");
  const cfData = cfSpan.attr("data-cfemail");
  if (cfData) {
    const decoded = decodeCloudflareEmail(cfData);
    if (decoded) return decoded;
  }

  // Method 3: Direct mailto
  const mailto = card.find('a[href^="mailto:"]').attr("href");
  if (mailto) return mailto.replace("mailto:", "");

  return null;
}

/**
 * Extract district from location text like "Hyderabad, Telangana"
 */
function extractDistrict(locationText) {
  if (!locationText) return "Hyderabad";

  const districtMap = {
    "hyderabad":     "Hyderabad",
    "rangareddy":    "Rangareddy",
    "ranga reddy":   "Rangareddy",
    "secunderabad":  "Hyderabad",
    "warangal":      "Warangal Urban",
    "hanamkonda":    "Hanamkonda",
    "karimnagar":    "Karimnagar",
    "nizamabad":     "Nizamabad",
    "khammam":       "Khammam",
    "nalgonda":      "Nalgonda",
    "medchal":       "Medchal-Malkajgiri",
    "malkajgiri":    "Medchal-Malkajgiri",
    "sangareddy":    "Sangareddy",
    "adilabad":      "Adilabad",
    "mahabubnagar":  "Mahabubnagar",
    "mahbubnagar":   "Mahabubnagar",
    "siddipet":      "Siddipet",
    "yadadri":       "Yadadri Bhuvanagiri",
    "bhuvanagiri":   "Yadadri Bhuvanagiri",
    "suryapet":      "Suryapet",
    "jagtial":       "Jagtial",
    "mancherial":    "Mancherial",
    "kamareddy":     "Kamareddy",
    "peddapalli":    "Peddapalli",
    "nagarkurnool":  "Nagarkurnool",
    "medak":         "Medak",
    "vikarabad":     "Vikarabad",
    "wanaparthy":    "Wanaparthy",
    "gadwal":        "Jogulamba Gadwal",
    "narayanpet":    "Narayanpet",
    "kothagudem":    "Bhadradri Kothagudem",
    "bhadradri":     "Bhadradri Kothagudem",
    "mulugu":        "Mulugu",
    "bhupalpally":   "Jayashankar Bhupalpally",
    "sircilla":      "Rajanna Sircilla",
    "jangaon":       "Jangaon",
    "nirmal":        "Nirmal",
    "asifabad":      "Kumuram Bheem Asifabad",
  };

  const lower = locationText.toLowerCase();
  for (const [key, value] of Object.entries(districtMap)) {
    if (lower.includes(key)) return value;
  }

  return "Hyderabad"; // default
}

/**
 * Guess specialization from education/qualifications (limited info)
 * Listing pages don't have specialization, so we infer from degree
 */
function inferSpecialization(education) {
  if (!education) return "General Practice";

  const lower = education.toLowerCase();
  if (lower.includes("criminal"))      return "Criminal Law";
  if (lower.includes("corporate"))     return "Corporate Law";
  if (lower.includes("tax"))           return "Tax Law";
  if (lower.includes("family"))        return "Family Law";
  if (lower.includes("constitutional"))return "Constitutional Law";

  // Default for general LLB/MBA-LLB etc
  return "General Practice";
}

// ─── Page Scraper ─────────────────────────────────────────────────
async function scrapePage(url, defaultDistrict, pageNum = 1) {
  const pageUrl = pageNum > 1 ? `${url}?page=${pageNum}` : url;

  console.log(`\n  📄 Page ${pageNum}: ${pageUrl}`);

  try {
    const res = await axios.get(pageUrl, { headers: HEADERS, timeout: 20000 });
    const $   = cheerio.load(res.data);
    const lawyers = [];

    $(".card").each((i, el) => {
      try {
        const card = $(el);

        const onclick = card.attr("onclick") || "";

        const idMatch = onclick.match(
          /showUserDetails\('([^']+)'\)/
        );

        const advocateId = idMatch?.[1] || null;

        const profileUrl = advocateId
          ? `https://www.freelaw.in/Advocates/AdvocateDetail?id=${advocateId}`
          : null;

        // ── Name ────────────────────────────────────────────
        const rawName = cleanText(card.find("h6.fw-bold").text());
        if (!rawName) return; // skip if no name

        // Remove "Advocate" prefix for cleaner name
        const name = rawName.replace(/^Advocate\s+/i, "").trim();

        // ── Location ─────────────────────────────────────────
        const location = cleanText(card.find("span.fw-lighter.fs-12").text());
        const district = defaultDistrict || extractDistrict(location);

        // ── Education / Qualifications ───────────────────────
        const education = cleanText(card.find("small.text-white").text());

        // ── Phone ────────────────────────────────────────────
        const phones = [];
        card.find('a[href^="tel:"]').each((_, a) => {
          const num = $(a).attr("href").replace("tel:", "").trim();
          if (num) phones.push(num);
        });
        const phone = phones[0] || null;

        // ── Email (Cloudflare decoded) ───────────────────────
        const email = extractEmail($, card);

        // ── Verified status ──────────────────────────────────
        const isVerified =
          card.find('img[src*="verifiedadvocate"]').length > 0;

        // ── Photo ────────────────────────────────────────────
        const photoImg = card.find("img").first().attr("src");
        const photo = photoImg && !photoImg.includes("verifiedadvocate")
          ? `https://www.freelaw.in${photoImg}`
          : null;

        // ── Build lawyer object ──────────────────────────────
        const lawyer = {
          name,
          email,
          phone,
          phones, // all phone numbers
          advocateId,
          profileUrl,
          district,
          city: location.split(",")[0]?.trim() || "Hyderabad",
          state: "Telangana",
          education: education ? [education] : [],
          specialization: inferSpecialization(education),
          experience: 0, // not on listing page
          photo,
          isVerified,
          source: ["freelaw"],
          sourceUrl: pageUrl,
          isActive: true,
          lastScraped: new Date(),
        };

        lawyers.push(lawyer);
      } catch (err) {
        console.warn(`    ⚠️  Card ${i} parse error:`, err.message);
      }
    });

    // Detect pagination
    const hasNextPage =
      $(`a:contains("${pageNum + 1}")`).length > 0 ||
      $(".pagination .next:not(.disabled)").length > 0 ||
      $(`a[href*="page=${pageNum + 1}"]`).length > 0;

    console.log(`    ✅ Found ${lawyers.length} lawyers on page ${pageNum}`);

    return { lawyers, hasNextPage };
  } catch (err) {
    if (err.response?.status === 404) {
      console.log(`    ℹ️  Page ${pageNum} doesn't exist (404)`);
      return { lawyers: [], hasNextPage: false };
    }
    console.error(`    ❌ Failed:`, err.message);
    return { lawyers: [], hasNextPage: false };
  }
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("\n🕷️  FreeLaw.in Scraper Starting...");
  console.log("═".repeat(60));

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 50000,
    family: 4,
  });
  console.log("✅ Connected to MongoDB");

  let totalAdded   = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const { url, district } of URLS) {
    console.log(`\n🌐 Scraping: ${url}`);
    console.log("─".repeat(60));

    let pageNum   = 1;
    let hasMore   = true;
    const maxPages = 1; // safety cap

    while (hasMore && pageNum <= maxPages) {
      const { lawyers, hasNextPage } = await scrapePage(url, district, pageNum);

      for (const lawyer of lawyers) {
        try {
          let existing = null;

          // ── Case 1: Has phone → match by name + phone ──────
          if (lawyer.name && lawyer.phone) {
            existing = await ScrapedLawyer.findOne({
              name:  lawyer.name,
              phone: lawyer.phone,
            });
          }

          // ── Case 2: Has email → match by name + email ──────
          if (!existing && lawyer.name && lawyer.email) {
            existing = await ScrapedLawyer.findOne({
              name:  lawyer.name,
              email: lawyer.email,
            });
          }

          // ── Case 3: No contact info → always create new ─────
          // (Don't try to dedup against other contact-less lawyers)
          if (!lawyer.phone && !lawyer.email) {
            await ScrapedLawyer.create(lawyer);
            totalAdded++;
            continue;
          }

          if (existing) {
            await ScrapedLawyer.updateOne(
              { _id: existing._id },
              { $set: { ...lawyer } }
            );
            totalUpdated++;
          } else {
            await ScrapedLawyer.create(lawyer);
            totalAdded++;
          }
        } catch (err) {
          console.warn(`    ⚠️  DB error for ${lawyer.name}:`, err.message);
          totalSkipped++;
        }
      }

      hasMore = hasNextPage && lawyers.length > 0;
      pageNum++;

      if (hasMore) await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ FreeLaw Scraping Complete!");
  console.log(`   📦 Added:   ${totalAdded}`);
  console.log(`   🔄 Updated: ${totalUpdated}`);
  console.log(`   ⚠️  Skipped: ${totalSkipped}`);

  const total = await ScrapedLawyer.countDocuments();
  console.log(`   📊 Total in DB: ${total}`);
  console.log("═".repeat(60));

  // Sample preview
  const sample = await ScrapedLawyer.find().limit(3).lean();
  console.log("\n📋 Sample data:");
  sample.forEach((l, i) => {
    console.log(`\n${i + 1}. ${l.name}`);
    console.log(`   📍 ${l.district}, ${l.state}`);
    console.log(`   📧 ${l.email || "no email"}`);
    console.log(`   📞 ${l.phone || "no phone"}`);
    console.log(`   🎓 ${l.education.join(", ") || "no education"}`);
    console.log(`   ⚖️  ${l.specialization}`);
    console.log(`   ✅ Verified: ${l.isVerified}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});