// backend/services/tracking/TelanganaHCService.js
// ══════════════════════════════════════════════════════════════════
// Handles ALL tracking for Telangana High Court
// Uses: csis.tshc.gov.in
// Extracted from old trackController.js — now isolated here
// ══════════════════════════════════════════════════════════════════

import axios from "axios";
import https from "https";
import BaseTrackingService from "./BaseTrackingService.js";

const TSHC_BASE = "https://csis.tshc.gov.in";

const tshcAxios = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 15000,
  headers: {
    "User-Agent":   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept":       "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export default class TelanganaHCService extends BaseTrackingService {

  // ── getCaptcha ─────────────────────────────────────────────────

  async getCaptcha() {
    try {
      this.log("Fetching captcha from TSHC...");

      const response = await tshcAxios.get(`${TSHC_BASE}/generateCaptcha`, {
        responseType: "arraybuffer",
      });

      const captchaId     = response.headers["captcha-id"];
      const sessionCookie = response.headers["set-cookie"]?.[0]?.split(";")[0] || "";
      const imageBase64   = Buffer.from(response.data).toString("base64");

      this.log("Captcha fetched. captchaId:", captchaId ? "ok" : "missing");

      return {
        success:       true,
        captchaId,
        sessionCookie,
        image:         `data:image/png;base64,${imageBase64}`,
        provider:      this.providerName,
      };
    } catch (error) {
      this.logError("getCaptcha failed:", error.message);
      throw new Error("Failed to fetch captcha from Telangana High Court");
    }
  }

  // ── trackByCredentials ────────────────────────────────────────

  async trackByCredentials({ caseType, caseNumber, year, mtype, captcha, captchaId, sessionCookie }) {
    this.log(`Tracking: type=${caseType} mtype=${mtype} no=${caseNumber} year=${year}`);

    if (!captcha || !captchaId || !sessionCookie) {
      throw new Error("Captcha is required for Telangana High Court tracking");
    }

    const response = await tshcAxios.post(
      `${TSHC_BASE}/getCaseDetails`,
      new URLSearchParams({
        mtype:   String(mtype),
        mno:     String(caseNumber),
        myear:   String(year),
        captcha,
        captchaId,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie:         sessionCookie,
          Referer:        `${TSHC_BASE}/`,
          Origin:         TSHC_BASE,
        },
      }
    );

    this.log("TSHC raw response received");

    const primary = response.data?.primary;

    if (!primary) {
      this.log("No primary data in response:", JSON.stringify(response.data).substring(0, 200));
      throw new Error("No case data returned from Telangana High Court");
    }

    // Build normalized response using base class helper
    return this.buildSuccessResponse({
      caseNumber,
      caseType,
      year,
      petitioner:  primary.petitioner,
      respondent:  primary.respondent,
      caseStatus:  primary.casestatus,
      judge:       primary.judges,
      nextHearing: primary.listingdate,
      district:    primary.district,
      cnrNumber:   primary.cnrno || "",
      rawData:     response.data,
      source:      "Telangana High Court",
    });
  }

  // ── trackByCNR ────────────────────────────────────────────────

  async trackByCNR(cnrNumber) {
    this.log("CNR search not directly supported by TSHC API — CNR embedded in credentials flow");
    // TSHC returns CNR in the credentials response (primary.cnrno)
    // Direct CNR search goes through eCourts
    return null;
  }

  // ── getCaseTypes ─────────────────────────────────────────────

  getCaseTypes() {
    // Dynamically import to avoid circular deps
    // Returns the full CASE_TYPES array from caseTypes.ts equivalent
    return []; // Frontend handles this via CASE_TYPE_SETS.TELANGANA_HC
  }
}