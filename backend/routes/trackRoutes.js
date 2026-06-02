// backend/routes/trackRoutes.js
import express from "express";
import {
  getCaptcha,
  trackByCredentials,
  trackByCNR,
  trackSavedCase,
  getCourtInfo,
} from "../controllers/trackController.js";
import {
  getDistricts,
  getCourtComplexes,
  getCaseTypes,
  clearCache,
} from "../services/tracking/ECourtsMetadataService.js";
import protect from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js"; 

const router = express.Router();

// ── Public ─────────────────────────────────────────────────
router.get("/captcha",      getCaptcha);
router.get("/court-info",   getCourtInfo);
router.post("/credentials", optionalAuth, trackByCredentials);   // ✅ Optional auth
router.post("/cnr",         optionalAuth, trackByCNR);     

// ── Protected ──────────────────────────────────────────────
router.get("/saved/:id",    protect, trackSavedCase);

// ══════════════════════════════════════════════════════════════════
// eCOURTS DROPDOWN APIs — for cascading court selector
// ══════════════════════════════════════════════════════════════════

// GET /api/track/ecourts/districts
router.get("/ecourts/districts", async (req, res) => {
  try {
    const data = await getDistricts();
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    console.error("[/ecourts/districts] Error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/track/ecourts/complexes?distCode=2
router.get("/ecourts/complexes", async (req, res) => {
  try {
    const { distCode } = req.query;
    if (!distCode) {
      return res.status(400).json({ success: false, message: "distCode is required" });
    }
    const data = await getCourtComplexes(distCode);
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    console.error("[/ecourts/complexes] Error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/track/ecourts/case-types?distCode=2&complexCode=1290019
router.get("/ecourts/case-types", async (req, res) => {
  try {
    const { distCode, complexCode } = req.query;
    if (!distCode || !complexCode) {
      return res.status(400).json({ success: false, message: "distCode and complexCode required" });
    }
    const data = await getCaseTypes(distCode, complexCode);
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    console.error("[/ecourts/case-types] Error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/track/ecourts/clear-cache  (debug)
router.post("/ecourts/clear-cache", async (req, res) => {
  try {
    const { type } = req.body;
    const count = await clearCache(type);
    res.json({ success: true, deletedCount: count });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Debug (temporary) ──────────────────────────────────────
router.get("/debug-ecourts", async (req, res) => {
  try {
    const { default: axios } = await import("axios");
    const { default: https } = await import("https");
    const { load }           = await import("cheerio");

    const response = await axios.get(
      "https://services.ecourts.gov.in/ecourtindia_v6/",
      {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          Accept:       "text/html,application/xhtml+xml,*/*",
        },
      }
    );

    const $ = load(response.data);

    const hiddenInputs = [];
    $("input[type='hidden']").each((_, el) => {
      hiddenInputs.push({
        name:  $(el).attr("name"),
        value: ($(el).val() || "").substring(0, 60),
      });
    });

    const metaTags = [];
    $("meta").each((_, el) => {
      if ($(el).attr("name") || $(el).attr("property")) {
        metaTags.push({
          name:    $(el).attr("name") || $(el).attr("property"),
          content: ($(el).attr("content") || "").substring(0, 60),
        });
      }
    });

    return res.json({
      status:      response.status,
      htmlLength:  response.data.length,
      cookies:     response.headers["set-cookie"] || [],
      hiddenInputs,
      metaTags,
      htmlSample:  response.data.substring(0, 1000),
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Add to trackRoutes.js temporarily
router.get("/debug-ecourts-token", async (req, res) => {
  try {
    const { default: axios } = await import("axios");
    const { default: https } = await import("https");
    const { load }           = await import("cheerio");

    const agent = new https.Agent({ rejectUnauthorized: false });

    // Step 1: Get session cookie
    const homeRes = await axios.get(
      "https://services.ecourts.gov.in/ecourtindia_v6/",
      {
        httpsAgent: agent,
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          Accept:       "text/html,application/xhtml+xml,*/*",
        },
      }
    );

    const cookies = (homeRes.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");

    const results = {};

    // Step 2: Try known token-generation endpoints
    const tokenEndpoints = [
      "?p=home/index",
      "?p=casestatus/index",
      "?p=casestatus/getCNRDetails",
      "?p=home/getToken",
      "?p=home/generateToken",
      "?p=casestatus/getToken",
    ];

    for (const ep of tokenEndpoints) {
      try {
        const r = await axios.get(
          `https://services.ecourts.gov.in/ecourtindia_v6/${ep}`,
          {
            httpsAgent: agent,
            timeout: 10000,
            headers: {
              "User-Agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
              Accept:             "application/json, text/javascript, */*; q=0.01",
              "X-Requested-With": "XMLHttpRequest",
              Cookie:             cookies,
              Referer:            "https://services.ecourts.gov.in/ecourtindia_v6/",
            },
          }
        );

        const $ = load(typeof r.data === "string" ? r.data : JSON.stringify(r.data));
        const token = $('input[name="app_token"]').val() || "";

        results[ep] = {
          status:    r.status,
          tokenFound: !!token,
          token:     token.substring(0, 40),
          dataType:  typeof r.data,
          preview:   JSON.stringify(r.data).substring(0, 150),
        };
      } catch (e) {
        results[ep] = { error: e.message };
      }
    }

    // Step 3: Try POST to get token
    const postEndpoints = [
      { p: "home/index",              body: { ajax_req: "true" } },
      { p: "casestatus/index",        body: { ajax_req: "true" } },
      { p: "home/getAppToken",        body: { ajax_req: "true" } },
      { p: "casestatus/getAppToken",  body: { ajax_req: "true" } },
    ];

    const postResults = {};
    for (const ep of postEndpoints) {
      try {
        const r = await axios.post(
          "https://services.ecourts.gov.in/ecourtindia_v6/",
          new URLSearchParams({ p: ep.p, ...ep.body }),
          {
            httpsAgent: agent,
            timeout: 10000,
            headers: {
              "Content-Type":     "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",
              Accept:             "application/json, text/javascript, */*; q=0.01",
              Cookie:             cookies,
              Referer:            "https://services.ecourts.gov.in/ecourtindia_v6/",
              Origin:             "https://services.ecourts.gov.in",
            },
          }
        );

        const $ = load(typeof r.data === "string" ? r.data : "");
        const token = $('input[name="app_token"]').val() || "";

        postResults[ep.p] = {
          status:    r.status,
          tokenFound: !!token,
          token:     token.substring(0, 40),
          dataType:  typeof r.data,
          isObject:  typeof r.data === "object",
          keys:      typeof r.data === "object" ? Object.keys(r.data) : [],
          preview:   JSON.stringify(r.data).substring(0, 200),
        };
      } catch (e) {
        postResults[ep.p] = { error: e.message };
      }
    }

    return res.json({
      sessionCookies: cookies,
      getEndpoints:   results,
      postEndpoints:  postResults,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Add to trackRoutes.js
router.get("/debug-mobile-api", async (req, res) => {
  try {
    const { default: axios } = await import("axios");
    const { default: https } = await import("https");

    const agent = new https.Agent({ rejectUnauthorized: false });
    const cnr   = req.query.cnr || "TSHC010000772026";
    const results = {};

    // eCourts mobile app API endpoints
    const mobileEndpoints = [
      // API v1
      `https://services.ecourts.gov.in/ecourtindia_v6/cases/caseStatus?cino=${cnr}`,
      `https://services.ecourts.gov.in/ecourtindia_v6/api/cnr/${cnr}`,
      `https://services.ecourts.gov.in/ecourtindia_v6/api/case/${cnr}`,

      // eCourts app API
      `https://app.ecourts.gov.in/eCourtsAppNew/index.php?p=showRecords/caseDet&caseNo=${cnr}`,
      `https://app.ecourts.gov.in/eCourtsAppNew/api/cnr?cino=${cnr}`,

      // Alternative domains
      `https://hcservices.ecourts.gov.in/ecourtindia/cases/caseStatus?cino=${cnr}`,
    ];

    for (const url of mobileEndpoints) {
      try {
        const r = await axios.get(url, {
          httpsAgent: agent,
          timeout: 10000,
          headers: {
            "User-Agent": "eCourts/3.0 (Android)",
            Accept:       "application/json",
          },
        });
        results[url] = {
          status:   r.status,
          dataType: typeof r.data,
          preview:  JSON.stringify(r.data).substring(0, 300),
        };
      } catch (e) {
        results[url] = { error: `${e.response?.status} — ${e.message}` };
      }
    }

    // Also test the eCourts services REST API
    const restEndpoints = [
      {
        url: "https://services.ecourts.gov.in/ecourtindia_v6/",
        body: { p: "casestatus/getCNRDetails", cino: cnr, ajax_req: "true" },
        label: "REST-no-token",
      },
    ];

    const restResults = {};
    for (const ep of restEndpoints) {
      try {
        const r = await axios.post(
          ep.url,
          new URLSearchParams(ep.body),
          {
            httpsAgent: agent,
            timeout: 10000,
            headers: {
              "Content-Type":     "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",
              Accept:             "application/json, */*",
              "User-Agent":       "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/113.0 Firefox/113.0",
            },
          }
        );
        restResults[ep.label] = {
          status:  r.status,
          preview: JSON.stringify(r.data).substring(0, 300),
        };
      } catch (e) {
        restResults[ep.label] = { error: e.message };
      }
    }

    return res.json({ mobileEndpoints: results, restResults });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
// ── NO deprecated catch-all routes ─────────────────────────

export default router;