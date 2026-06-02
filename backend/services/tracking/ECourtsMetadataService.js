// backend/services/tracking/ECourtsMetadataService.js
// ══════════════════════════════════════════════════════════════════
// Fetches dropdown data from eCourts (districts, complexes, case types)
// Caches results in MongoDB to avoid repeated hits.
//
// All Telangana queries use stateCode = "29"
// ══════════════════════════════════════════════════════════════════

import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import ECourtsMetadata from "../../models/ECourtsMetadata.js";

const ECOURTS_BASE = "https://services.ecourts.gov.in/ecourtindia_v6";
const TELANGANA_STATE_CODE = "29";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const BASE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept":             "application/json, text/javascript, */*; q=0.01",
  "X-Requested-With":  "XMLHttpRequest",
  "Content-Type":      "application/x-www-form-urlencoded; charset=UTF-8",
  Referer:             `${ECOURTS_BASE}/`,
  Origin:              "https://services.ecourts.gov.in",
};

// ── Helper: parse <option> tags into [{ code, name }] ────────────
function parseOptions(html) {
  if (!html) return [];
  const $ = cheerio.load(`<select>${html}</select>`);
  const result = [];
  $("option").each((_, el) => {
    const code = ($(el).attr("value") || "").trim();
    const name = $(el).text().trim();
    if (code && name && !name.toLowerCase().startsWith("select")) {
      result.push({ code, name });
    }
  });
  return result;
}

// ── Helper: get cached or fetch fresh ─────────────────────────────
async function getOrFetch(cacheKey, type, extraFields, fetcher) {
  // Try cache first
  const cached = await ECourtsMetadata.findOne({ cacheKey });
  if (cached?.data?.length > 0) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetcher();

  if (!data || data.length === 0) {
    return [];
  }

  // Save to cache
  try {
    await ECourtsMetadata.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        type,
        ...extraFields,
        data,
        fetchedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (e) {
    console.error(`[ECourtsMetadata] Cache write failed:`, e.message);
  }

  return data;
}

// ══════════════════════════════════════════════════════════════════
// 1. GET DISTRICTS (for Telangana)
// ══════════════════════════════════════════════════════════════════

export const getDistricts = async () => {
  const cacheKey = `state_${TELANGANA_STATE_CODE}`;

  return getOrFetch(
    cacheKey,
    "districts",
    { stateCode: TELANGANA_STATE_CODE },
    async () => {
      const res = await axios.post(
        `${ECOURTS_BASE}/?p=casestatus/fillDistrict`,
        new URLSearchParams({
          state_code: TELANGANA_STATE_CODE,
          ajax_req:   "true",
          app_token:  "",
        }),
        { httpsAgent, timeout: 30000, headers: BASE_HEADERS }
      );

      const html = res.data?.dist_list || "";
      return parseOptions(html);
    }
  );
};

// ══════════════════════════════════════════════════════════════════
// 2. GET COURT COMPLEXES (for a district)
// ══════════════════════════════════════════════════════════════════

export const getCourtComplexes = async (distCode) => {
  if (!distCode) throw new Error("distCode is required");

  const cacheKey = `state_${TELANGANA_STATE_CODE}_dist_${distCode}`;

  return getOrFetch(
    cacheKey,
    "complexes",
    { stateCode: TELANGANA_STATE_CODE, distCode: String(distCode) },
    async () => {
      const res = await axios.post(
        `${ECOURTS_BASE}/?p=casestatus/fillcomplex`,
        new URLSearchParams({
          state_code: TELANGANA_STATE_CODE,
          dist_code:  String(distCode),
          ajax_req:   "true",
          app_token:  "",
        }),
        { httpsAgent, timeout: 30000, headers: BASE_HEADERS }
      );

      const html = res.data?.complex_list || "";
      const parsed = parseOptions(html);

      // Code format: "1290019@2,6,11,20@N"
      //   - 1290019 = complex ID
      //   - 2,6,11,20 = establishment codes inside
      //   - N = flag
      return parsed.map((opt) => {
        const parts = opt.code.split("@");
        return {
          code:               parts[0]  || opt.code,
          name:               opt.name,
          establishmentCodes: parts[1]  || "",
          fullCode:           opt.code,
          flag:               parts[2]  || "N",
        };
      });
    }
  );
};

// ══════════════════════════════════════════════════════════════════
// 3. GET CASE TYPES (for a court complex)
// ══════════════════════════════════════════════════════════════════

export const getCaseTypes = async (distCode, courtComplexCode) => {
  if (!distCode)         throw new Error("distCode is required");
  if (!courtComplexCode) throw new Error("courtComplexCode is required");

  const cacheKey = `state_${TELANGANA_STATE_CODE}_dist_${distCode}_complex_${courtComplexCode}`;

  return getOrFetch(
    cacheKey,
    "caseTypes",
    {
      stateCode:        TELANGANA_STATE_CODE,
      distCode:         String(distCode),
      courtComplexCode: String(courtComplexCode),
    },
    async () => {
      const res = await axios.post(
        `${ECOURTS_BASE}/?p=casestatus/fillCaseType`,
        new URLSearchParams({
          state_code:         TELANGANA_STATE_CODE,
          dist_code:          String(distCode),
          court_complex_code: String(courtComplexCode),
          est_code:           "",
          search_type:        "c_no",
          ajax_req:           "true",
          app_token:          "",
        }),
        { httpsAgent, timeout: 30000, headers: BASE_HEADERS }
      );

      const html = res.data?.casetype_list || "";
      const parsed = parseOptions(html);

      // Code format: "6^20"
      //   - 6  = case type ID (mtype)
      //   - 20 = establishment code
      return parsed.map((opt) => {
        const parts = opt.code.split("^");
        return {
          code:              parts[0] || opt.code,
          name:              opt.name,
          establishmentCode: parts[1] || "",
          fullCode:          opt.code,
        };
      });
    }
  );
};

// ══════════════════════════════════════════════════════════════════
// 4. CLEAR CACHE (admin/debug helper)
// ══════════════════════════════════════════════════════════════════

export const clearCache = async (type = null) => {
  const filter = type ? { type } : {};
  const result = await ECourtsMetadata.deleteMany(filter);
  console.log(`[ECourtsMetadata] Cleared ${result.deletedCount} cache entries (type=${type || "ALL"})`);
  return result.deletedCount;
};