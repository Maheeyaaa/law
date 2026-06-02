import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import BaseTrackingService from "./BaseTrackingService.js";

const ECOURTS_BASE = "https://services.ecourts.gov.in/ecourtindia_v6";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const BASE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
};

// ── Helper: merge set-cookie headers into existing cookie string ──
function mergeCookies(existingCookieStr = "", newSetCookieHeaders = []) {
  const cookieMap = {};

  existingCookieStr.split(";").forEach((c) => {
    const trimmed = c.trim();
    const idx     = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (key) cookieMap[key] = val;
    }
  });

  (newSetCookieHeaders || []).forEach((c) => {
    const part = c.split(";")[0].trim();
    const idx  = part.indexOf("=");
    if (idx > 0) {
      const key = part.substring(0, idx).trim();
      const val = part.substring(idx + 1).trim();
      if (key) cookieMap[key] = val;
    }
  });

  return Object.entries(cookieMap)
    .filter(([k]) => k)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export default class ECourtsService extends BaseTrackingService {

  async getCaptcha() {
    try {
      const homeRes = await axios.get(`${ECOURTS_BASE}/`, {
        httpsAgent,
        timeout: 30000,
        headers: {
          ...BASE_HEADERS,
          Accept:  "text/html,application/xhtml+xml,*/*;q=0.8",
          Referer: "https://services.ecourts.gov.in/",
        },
      });

      let cookies = mergeCookies("", homeRes.headers["set-cookie"]);

      const captchaRes = await axios.post(
        `${ECOURTS_BASE}/?p=casestatus/getCaptcha`,
        new URLSearchParams({ ajax_req: "true" }),
        {
          httpsAgent,
          timeout: 30000,
          headers: {
            ...BASE_HEADERS,
            "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Accept:             "application/json, text/javascript, */*; q=0.01",
            Cookie:             cookies,
            Referer:            `${ECOURTS_BASE}/`,
            Origin:             "https://services.ecourts.gov.in",
          },
        }
      );

      cookies = mergeCookies(cookies, captchaRes.headers["set-cookie"]);

      const divCaptcha = captchaRes.data?.div_captcha || captchaRes.data || "";
      const $          = cheerio.load(divCaptcha);
      const imgSrc     =
        $("#captcha_image").attr("src") ||
        $("img").first().attr("src")    ||
        "";

      if (!imgSrc) throw new Error("Could not extract captcha image URL");

      const securimageSessionId = imgSrc.split("?")[1] || "";

      const imageUrl = imgSrc.startsWith("http")
        ? imgSrc
        : `https://services.ecourts.gov.in${imgSrc}`;

      const imageRes = await axios.get(imageUrl, {
        httpsAgent,
        timeout: 30000,
        responseType: "arraybuffer",
        headers: {
          ...BASE_HEADERS,
          Accept:           "image/png,image/*,*/*",
          Cookie:           cookies,
          Referer:          `${ECOURTS_BASE}/`,
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      cookies = mergeCookies(cookies, imageRes.headers["set-cookie"]);

      if (!cookies) throw new Error("No session cookies captured");

      const imageBase64 = Buffer.from(imageRes.data).toString("base64");
      const contentType = imageRes.headers["content-type"] || "image/png";

      return {
        success:       true,
        provider:      this.providerName,
        image:         `data:${contentType};base64,${imageBase64}`,
        captchaId:     securimageSessionId,
        sessionCookie: cookies,
      };

    } catch (error) {
      this.logError("getCaptcha failed:", error.message);
      throw new Error(`Failed to fetch eCourts captcha: ${error.message}`);
    }
  }

  async trackByCredentials({
    caseType, caseNumber, year, mtype,
    cnrNumber, captcha, captchaId, sessionCookie,
    distCode, complexCode,
  }) {
    if (!sessionCookie) {
      this.logError("No sessionCookie — cannot track");
      return null;
    }

    if (cnrNumber && cnrNumber.trim().length >= 16) {
      const result = await this.trackByCNR(
        cnrNumber.trim().toUpperCase(),
        captcha,
        sessionCookie
      );
      if (result) return result;
    }

    return await this.searchByCaseNumber({
      caseNumber, year, mtype, captcha, sessionCookie, distCode, complexCode
    });
  }

  async trackByCNR(cnrNumber, captcha = "", sessionCookie = "") {
    try {
      const res = await axios.post(
        `${ECOURTS_BASE}/?p=cnr_status/searchByCNR/`,
        new URLSearchParams({
          cino:          cnrNumber,
          fcaptcha_code: captcha || "",
          ajax_req:      "true",
          app_token:     "",
        }),
        {
          httpsAgent,
          timeout: 30000,
          headers: {
            ...BASE_HEADERS,
            "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Accept:             "application/json, text/javascript, */*; q=0.01",
            Cookie:             sessionCookie,
            Referer:            "https://services.ecourts.gov.in/",
            Origin:             "https://services.ecourts.gov.in",
          },
        }
      );

      if (this.isInvalidCaptcha(res.data)) {
        throw new Error("INVALID_CAPTCHA");
      }

      if (this.isErrorResponse(res.data)) {
        return null;
      }

      return this.parseECourtsResponse(res.data, cnrNumber);

    } catch (e) {
      if (e.message === "INVALID_CAPTCHA") throw e;
      this.logError("CNR search failed:", e.message);
      return null;
    }
  }

  async searchByCaseNumber({ caseNumber, year, mtype, captcha, sessionCookie, distCode, complexCode }) {
    // ✅ Use codes from request first, fallback to courtConfig
    const stateCode    = this.courtConfig.stateCode        || "29";
    const finalDist    = distCode    || this.courtConfig.distCode         || "";
    const finalComplex = complexCode || this.courtConfig.courtComplexCode || "";

    try {
      const res = await axios.post(
        `${ECOURTS_BASE}/?p=casestatus/searchByCaseNo/`,
        new URLSearchParams({
          state_code:         stateCode,
          dist_code:          finalDist,
          court_complex_code: finalComplex,
          court_code:         "1",
          case_type:          String(mtype),
          reg_no:             String(caseNumber),
          reg_year:           String(year),
          fcaptcha_code:      captcha || "",
          ajax_req:           "true",
          app_token:          "",
        }),
        {
          httpsAgent,
          timeout: 30000,
          headers: {
            ...BASE_HEADERS,
            "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Accept:             "application/json, text/javascript, */*; q=0.01",
            Cookie:             sessionCookie,
            Referer:            "https://services.ecourts.gov.in/",
            Origin:             "https://services.ecourts.gov.in",
          },
        }
      );

      if (this.isInvalidCaptcha(res.data)) throw new Error("INVALID_CAPTCHA");
      if (this.isErrorResponse(res.data))  return null;

      return this.parseECourtsResponse(res.data, caseNumber);

    } catch (e) {
      if (e.message === "INVALID_CAPTCHA") throw e;
      this.logError("Case search failed:", e.message);
      return null;
    }
  }

  isInvalidCaptcha(data) {
    if (!data) return false;
    const str           = JSON.stringify(data).toLowerCase();
    const hasError      = str.includes("invalid captcha") ||
                          str.includes("captcha entered is wrong") ||
                          str.includes("wrong captcha");
    const hasNewCaptcha = data?.div_captcha !== undefined;
    return hasError || (data?.errormsg && hasNewCaptcha);
  }

  isErrorResponse(data) {
    if (!data) return true;
    const str = JSON.stringify(data).toLowerCase();
    return (
      str.includes("page not found")  ||
      str.includes("no record found") ||
      (typeof data === "string" && data.length > 5000 && data.includes("navbar"))
    );
  }

  parseECourtsResponse(data, identifier) {
    try {
      let html = "";
      if (data?.casetype_list) {
        html = data.casetype_list;
      } else if (data?.case_details) {
        html = data.case_details;
      } else if (typeof data === "string") {
        html = data;
      } else {
        return null;
      }

      if (!html || html.trim().length < 50) {
        return null;
      }

      const $ = cheerio.load(html);

      const courtName =
        $("h2").first().text().trim() ||
        $(".h4").first().text().trim() || "";

      let district = this.courtConfig.displayName?.split(",")[1]?.trim() || "";
      if (!district && courtName) {
        const match = courtName.match(/,\s*([^,\-]+?)(?:\s*-|$)/);
        if (match) district = match[1].trim();
      }

      const getThTd = (keywords) => {
        let result = "";
        $("tr").each((_, row) => {
          const th = $(row).find("th").text().trim().toLowerCase();
          const td = $(row).find("td").first().text().replace(/&nbsp;/g, " ").trim();
          if (keywords.some((k) => th.includes(k)) && td) {
            result = td;
            return false;
          }
        });
        return result;
      };

      const caseType     = getThTd(["case type"]);
      const filingNumber = getThTd(["filing number"]);
      const filingDate   = getThTd(["filing date"]);
      const regNumber    = getThTd(["registration number"]);
      const regDate      = getThTd(["registration date"]);
      const cnrNumber    =
        $(".text-danger").first().text().trim() || getThTd(["cnr"]);
      const status       = getThTd(["case stage", "stage of case", "case status", "status"]);
      const judge        = getThTd(["judge", "bench", "presiding", "before", "coram"]);
      const nextDate     = getThTd(["next date", "next hearing", "adjourned", "listed on"]);
      const lastDate     = getThTd(["last date", "last hearing"]);

      // ── Petitioner / Respondent extraction ──────────────────────────
      // eCourts uses <ul class="Petitioner_Advocate_table"> containing <li>
      // with "1) Name<br>&nbsp;Advocate- AdvName<br>2) Name<br>..." format
      const parsePartyList = (selector) => {
        const html = $(selector).html() || "";
        if (!html) return { parties: [], advocates: [] };

        const text = html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/&nbsp;/gi, " ")
          .replace(/<[^>]+>/g, "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const parties   = [];
        const advocates = [];

        text.forEach((line) => {
          if (/^\d+\)/.test(line)) {
            parties.push(line.replace(/^\d+\)\s*/, "").trim());
          }
          else if (/^advocate[-:]/i.test(line)) {
            advocates.push(line.replace(/^advocate[-:]\s*/i, "").trim());
          }
        });

        return { parties, advocates };
      };

      const petData = parsePartyList(".Petitioner_Advocate_table");
      const resData = parsePartyList(".Respondent_Advocate_table");

      // ✅ Dedupe advocate names (same advocate often listed per party)
      const uniq = (arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))];

      const petitioner  = petData.parties.join(", ")          || "";
      const respondent  = resData.parties.join(", ")          || "";
      const petAdvocate = uniq(petData.advocates).join(", ")  || "";
      const resAdvocate = uniq(resData.advocates).join(", ")  || "";

      const history = [];
      $("table").each((_, table) => {
        const headers = $(table)
          .find("th")
          .map((_, th) => $(th).text().trim().toLowerCase())
          .get();
        if (
          headers.some((h) => h.includes("date")) &&
          headers.some((h) =>
            h.includes("purpose") || h.includes("business") || h.includes("cause")
          )
        ) {
          $(table)
            .find("tr")
            .slice(1)
            .each((_, row) => {
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

      if (!cnrNumber && !petitioner && !status) {
        return null;
      }

      return this.buildSuccessResponse({
        caseNumber:  regNumber || filingNumber || identifier,
        caseType,
        petitioner,
        respondent,
        caseStatus:  status || "Pending",
        judge,
        nextHearing: nextDate,
        lastHearing:
          lastDate ||
          (history.length > 0 ? history[history.length - 1].date : null),
        cnrNumber,
        district,
        caseHistory: history,
        source:      courtName || "eCourts India",
        rawData: {
          filingNumber,
          filingDate,
          regNumber,
          regDate,
          petAdvocate,
          resAdvocate,
          courtName,
          district,
        },
      });

    } catch (e) {
      this.logError("parseECourtsResponse error:", e.message);
      return null;
    }
  }

  getCaseTypes() {
    return [];
  }
}