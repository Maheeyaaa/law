// backend/controllers/trackController.js
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import SavedCase from "../models/SavedCase.js";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const ecourtsAxios = axios.create({
  httpsAgent,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-IN,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ══════════════════════════════════════════════════════════
// CNR SEARCH
// ══════════════════════════════════════════════════════════
const searchByCNR = async (cnrNumber) => {
  try {
    console.log("Searching by CNR:", cnrNumber);

    // Step 1 — Get session cookies and token
    const homeRes = await ecourtsAxios.get(
      "https://services.ecourts.gov.in/ecourtindia_v6/",
      {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "X-Requested-With": undefined,
        },
      }
    );

    const $home = cheerio.load(homeRes.data);
    const appToken =
      $home('input[name="app_token"]').val() ||
      $home('input[name="_token"]').val() ||
      $home('meta[name="csrf-token"]').attr("content") || "";

    const cookies = (homeRes.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");

    console.log("Session - token:", appToken ? "found" : "not found");
    console.log("Session - cookies:", cookies ? "found" : "not found");

    // Log all hidden inputs for debugging
    const hiddenInputs = [];
    $home("input[type='hidden']").each((_, el) => {
      hiddenInputs.push({
        name: $home(el).attr("name"),
        value: ($home(el).val() || "").substring(0, 30),
      });
    });
    console.log("Hidden inputs found:", JSON.stringify(hiddenInputs));

    // Step 2 — Try all known CNR endpoints
    const cnrEndpoints = [
      // Most likely correct endpoints based on eCourts v6 structure
      {
        url: "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/getCNRDetails",
        body: { cino: cnrNumber, ajax_req: "true", app_token: appToken },
      },
      {
        url: "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/viewCase",
        body: { cino: cnrNumber, ajax_req: "true", app_token: appToken },
      },
      {
        url: "https://services.ecourts.gov.in/ecourtindia_v6/",
        body: { p: "casestatus/getCNRDetails", cino: cnrNumber, ajax_req: "true", app_token: appToken },
      },
      {
        url: "https://services.ecourts.gov.in/ecourtindia_v6/",
        body: { p: "casestatus/submitCNRSearch", cino: cnrNumber, ajax_req: "true", app_token: appToken },
      },
    ];

    for (const ep of cnrEndpoints) {
      try {
        console.log("Trying:", ep.url);

        const res = await ecourtsAxios.post(
          ep.url,
          new URLSearchParams(ep.body),
          {
            headers: {
              "Content-Type":     "application/x-www-form-urlencoded",
              "Referer":          "https://services.ecourts.gov.in/ecourtindia_v6/",
              "Cookie":           cookies,
              "Origin":           "https://services.ecourts.gov.in",
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );

        const preview = JSON.stringify(res.data).substring(0, 200);
        console.log("Response:", preview);

        // Skip error responses
        const dataStr = JSON.stringify(res.data).toLowerCase();
        if (
          dataStr.includes('"errormsg"') ||
          dataStr.includes("page not found") ||
          dataStr.includes("404")
        ) {
          console.log("→ Error response, skipping");
          continue;
        }

        // Skip if it's just the homepage HTML
        if (
          typeof res.data === "string" &&
          res.data.includes("e-committee") &&
          res.data.includes("supreme court")
        ) {
          console.log("→ Homepage returned, skipping");
          continue;
        }

        // Looks like a valid response
        console.log("→ Valid response found!");
        const parsed = parseCNRResponse(res.data, cnrNumber);
        if (parsed) return parsed;

      } catch (e) {
        console.log("→ Failed:", e.message);
        continue;
      }
    }

    // Step 3 — Try High Court services if CNR starts with H
    console.log("Trying High Court services...");
    const hcResult = await searchHCByCNR(cnrNumber, appToken, cookies);
    if (hcResult) return hcResult;

    console.log("All endpoints exhausted");
    return null;

  } catch (error) {
    console.error("CNR search error:", error.message);
    return null;
  }
};

// ── High Court CNR Search ──────────────────────────────────
const searchHCByCNR = async (cnrNumber, appToken, cookies) => {
  try {
    console.log("HC CNR search for:", cnrNumber);

    // Get HC session
    const hcHomeRes = await ecourtsAxios.get(
      "https://hcservices.ecourts.gov.in/hcservices/main.php",
      {
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "X-Requested-With": undefined,
        },
      }
    );

    const $hc = cheerio.load(hcHomeRes.data);
    const hcToken =
      $hc('input[name="app_token"]').val() ||
      $hc('input[name="_token"]').val() || appToken || "";

    const hcCookies = (hcHomeRes.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");

    console.log("HC token:", hcToken ? "found" : "not found");

    const hcEndpoints = [
      "https://hcservices.ecourts.gov.in/hcservices/main.php?p=hcs_casestatus/getCNRDetails",
      "https://hcservices.ecourts.gov.in/hcservices/main.php?p=hcs_casestatus/submitCNRSearch",
      "https://hcservices.ecourts.gov.in/hcservices/main.php?p=hcs_casestatus/viewCase",
    ];

    for (const endpoint of hcEndpoints) {
      try {
        console.log("Trying HC endpoint:", endpoint);

        const res = await ecourtsAxios.post(
          endpoint,
          new URLSearchParams({
            cino:       cnrNumber.trim().toUpperCase(),
            ajax_req:   "true",
            app_token:  hcToken,
            state_code: "18",
          }),
          {
            headers: {
              "Content-Type":     "application/x-www-form-urlencoded",
              "Referer":          "https://hcservices.ecourts.gov.in/hcservices/main.php",
              "Cookie":           hcCookies || cookies,
              "Origin":           "https://hcservices.ecourts.gov.in",
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );

        console.log("HC response preview:", JSON.stringify(res.data).substring(0, 200));

        const dataStr = JSON.stringify(res.data).toLowerCase();
        if (
          dataStr.includes('"errormsg"') ||
          dataStr.includes("page not found") ||
          dataStr.includes("404")
        ) {
          console.log("→ HC Error response, skipping");
          continue;
        }

        if (
          typeof res.data === "string" &&
          res.data.includes("e-committee")
        ) {
          console.log("→ HC Homepage returned, skipping");
          continue;
        }

        console.log("→ HC Valid response!");
        return res.data;

      } catch (e) {
        console.log("→ HC endpoint failed:", e.message);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("HC CNR search error:", error.message);
    return null;
  }
};

// ── Parse CNR Response ─────────────────────────────────────
const parseCNRResponse = (data, cnrNumber) => {
  try {
    let htmlContent = "";

    if (typeof data === "string") {
      htmlContent = data;
    } else if (data?.case_details) {
      htmlContent = data.case_details;
    } else if (data?.data) {
      htmlContent = data.data;
    } else if (data?.html) {
      htmlContent = data.html;
    } else {
      htmlContent = JSON.stringify(data);
    }

    const $ = cheerio.load(htmlContent);
    const fullText = $.text().toLowerCase();

    console.log("Parsed HTML text sample:", fullText.substring(0, 300));

    // Check for no record
    if (
      fullText.includes("no record") ||
      fullText.includes("not found") ||
      fullText.includes("invalid cnr") ||
      fullText.includes("page not found") ||
      fullText.includes("errormsg")
    ) {
      console.log("CNR: No record found in parsed response");
      return null;
    }

    // Extract using table row search
    const extractRow = (keywords) => {
      let result = "";
      $("tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
          const label = $(cells[0]).text().trim().toLowerCase();
          if (keywords.some((k) => label.includes(k))) {
            result = $(cells[cells.length - 1]).text().trim();
            return false;
          }
        }
      });
      return result;
    };

    const getSelector = (selectors) => {
      for (const sel of selectors) {
        const el = $(sel);
        if (el.length && el.text().trim()) {
          return el.text().trim();
        }
      }
      return "";
    };

    const petitioner = getSelector([
      ".Petitioner_Advocate_table td",
      ".pet_name",
      "#petitioner_name",
    ]) || extractRow(["petitioner", "appellant", "plaintiff", "applicant"]);

    const respondent = getSelector([
      ".Respondent_Advocate_table td",
      ".res_name",
      "#respondent_name",
    ]) || extractRow(["respondent", "defendant", "opposite party"]);

    const status   = getSelector([".case_status_table td", "#case_status", ".status"]) ||
                     extractRow(["status", "stage", "case stage"]);
    const judge    = extractRow(["judge", "bench", "coram", "presiding"]);
    const nextDate = extractRow(["next date", "next hearing", "adjourned to", "listed on"]);
    const lastDate = extractRow(["last date", "previous date", "last hearing"]);

    // Hearing history
    const history = [];
    $("table").each((_, table) => {
      const headers = $(table).find("th")
        .map((_, th) => $(th).text().trim().toLowerCase()).get();
      if (
        headers.some((h) => h.includes("date")) &&
        headers.some((h) =>
          h.includes("purpose") || h.includes("business") ||
          h.includes("order")   || h.includes("stage")
        )
      ) {
        $(table).find("tr").slice(1).each((_, row) => {
          const cols = $(row).find("td");
          if (cols.length >= 2 && $(cols[0]).text().match(/\d/)) {
            history.push({
              date:    $(cols[0]).text().trim(),
              purpose: $(cols[1]).text().trim(),
              result:  cols.length >= 3 ? $(cols[2]).text().trim() : "",
            });
          }
        });
        return false;
      }
    });

    console.log("CNR parse result:", {
      petitioner: petitioner || "not found",
      status:     status     || "not found",
      judge:      judge      || "not found",
      history:    history.length,
    });

    if (!petitioner && !status && !judge && history.length === 0) {
      console.log("CNR: No meaningful data in response");
      return null;
    }

    return {
      found:       true,
      source:      "eCourts India",
      cnrNumber,
      caseStatus:  status      || "Pending",
      petitioner:  petitioner  || "As per court records",
      respondent:  respondent  || "As per court records",
      nextHearing: nextDate    || "Not yet fixed",
      lastHearing: lastDate    || (history.length > 0 ? history[0].date : null),
      judge:       judge       || "As per court records",
      courtHall:   "As per cause list",
      caseHistory: history,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("CNR parse error:", error.message);
    return null;
  }
};

// ══════════════════════════════════════════════════════════
// CONTROLLERS
// ══════════════════════════════════════════════════════════

export const trackByCNR = async (req, res) => {
  try {
    const { cnrNumber } = req.body;
    if (!cnrNumber || cnrNumber.trim().length < 16) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 16-character CNR number",
      });
    }
    const data = await searchByCNR(cnrNumber.trim());
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const trackByCredentials = async (req, res) => {

  console.log("=== TRACK BY CREDENTIALS ===");
  console.log(req.body);

  try {
    const { court, caseType, caseNumber, year, cnrNumber, captcha, captchaId, sessionCookie, mtype } = req.body;
    console.log("Received mtype:", mtype);
    if (!captcha || !captchaId || !sessionCookie) {
      return res.status(400).json({
        success: false,
        message: "Captcha is required"
      });
}

    try {
      console.log("Sending request to TSHC...");
      const response = await axios.post(
        "https://csis.tshc.gov.in/getCaseDetails",
        new URLSearchParams({
          mtype: String(mtype),
          mno: String(caseNumber),
          myear: String(year),
          captcha,
          captchaId,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: sessionCookie,
            Referer: "https://csis.tshc.gov.in/",
            Origin: "https://csis.tshc.gov.in",
          },
        }
      );
       console.log("Request completed");
        console.log("TSHC Response:");
        console.log(response.data);

      return res.json({
        success: true,
        court,
        caseType,
        caseNumber,
        year,

        petitioner: response.data.primary.petitioner,
        respondent: response.data.primary.respondent,
        caseStatus: response.data.primary.casestatus,
        judge: response.data.primary.judges,
        nextHearing: response.data.primary.listingdate,
        district: response.data.primary.district,

        rawData: response.data,
      });

    } catch (error) {

        console.log("===== TSHC ERROR =====");
        console.log(error.response?.status);
        console.log(error.response?.data);
        console.log(error.message);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch case details",
        });
      }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const trackSavedCase = async (req, res) => {
  try {
    const savedCase = await SavedCase.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    console.log("Saved Case Found:", savedCase);

    if (!savedCase) {
      return res.status(404).json({
        success: false,
        message: "Saved case not found",
      });
    }

    const savedCaseInfo = {
      _id:        savedCase._id,
      label:      savedCase.label,
      court:      savedCase.court,
      caseType:   savedCase.caseType,
      mtype:      savedCase.mtype,
      caseNumber: savedCase.caseNumber,
      year:       savedCase.year,
      cnrNumber:  savedCase.cnrNumber,
    };

    return res.json({
      success: true,
      savedCase: savedCaseInfo,
      credentials: {
        court: savedCase.court,
        caseType: savedCase.caseType,
        mtype: savedCase.mtype,
        caseNumber: savedCase.caseNumber,
        year: savedCase.year,
        cnrNumber: savedCase.cnrNumber || ""
      },
      message: "Case loaded successfully"
    });
  } catch (error) {
    console.error("trackSavedCase error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const trackCase = async (req, res) => {
  return res.status(410).json({ message: "Deprecated. Use POST /api/cases/track instead." });
};

export const trackCaseById = async (req, res) => {
  return res.status(410).json({ message: "Deprecated. Use POST /api/cases/track instead." });
};

export const getCaptcha = async (req, res) => {
  try {
    const response = await axios.get(
      "https://csis.tshc.gov.in/generateCaptcha",
      {
        responseType: "arraybuffer",
      }
    );

    const captchaId = response.headers["captcha-id"];

    const cookie =
      response.headers["set-cookie"]?.[0]?.split(";")[0] || "";

    const imageBase64 = Buffer.from(response.data).toString("base64");

    res.json({
      success: true,
      captchaId,
      sessionCookie: cookie,
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("Captcha error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch captcha",
    });
  }
};