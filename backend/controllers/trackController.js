// backend/controllers/trackController.js

import SavedCase from "../models/SavedCase.js";
import {
  getTrackingService,
  validateCourtSupport,
} from "../services/tracking/index.js";
import { getCourtConfig } from "../constants/courtRegistry.js";
import ChangeDetector from "../services/notifications/ChangeDetector.js";
import NotificationService from "../services/notifications/NotificationService.js";

// ══════════════════════════════════════════════════════════════════
// GET CAPTCHA
// ══════════════════════════════════════════════════════════════════

export const getCaptcha = async (req, res) => {
  try {
    const courtName = req.query.court || "Telangana High Court, Hyderabad";

    let service;
    if (courtName.toLowerCase().includes("high court")) {
      service = getTrackingService("Telangana High Court, Hyderabad");
    } else {
      const ECourtsService = (await import("../services/tracking/ECourtsService.js")).default;
      service = new ECourtsService({
        displayName:     courtName,
        provider:        "ECOURTS",
        captchaProvider: "ECOURTS",
        supported:       true,
      });
    }

    const result = await service.getCaptcha();
    return res.json(result);

  } catch (error) {
    console.error("[getCaptcha] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch captcha",
    });
  }
};

// ══════════════════════════════════════════════════════════════════
// TRACK BY CREDENTIALS
// ══════════════════════════════════════════════════════════════════

export const trackByCredentials = async (req, res) => {
  try {
    const {
      court,
      caseType,
      caseNumber,
      year,
      mtype,
      captcha,
      captchaId,
      sessionCookie,
      cnrNumber,
      distCode,
      complexCode,
    } = req.body;

    if (!court) {
      return res.status(400).json({ success: false, message: "Please select a court" });
    }
    if (!caseType || !caseNumber || !year) {
      return res.status(400).json({ success: false, message: "Case type, case number, and year are required" });
    }

    // Detect provider
    let service;
    let provider;

    if (court.toLowerCase().includes("high court")) {
      service = getTrackingService("Telangana High Court, Hyderabad");
      provider = "TELANGANA_HC";
    } else {
      const ECourtsService = (await import("../services/tracking/ECourtsService.js")).default;
      service = new ECourtsService({
        displayName:      court,
        provider:         "ECOURTS",
        captchaProvider:  "ECOURTS",
        supported:        true,
        stateCode:        "29",
        distCode:         distCode    || "",
        courtComplexCode: complexCode || "",
      });
      provider = "ECOURTS";
    }

    // ── Fetch fresh data from court ──────────────────────────────
    const result = await service.trackByCredentials({
      court,
      caseType,
      caseNumber:    String(caseNumber).trim(),
      year:          Number(year),
      mtype:         mtype !== undefined ? mtype : 0,
      captcha:       captcha       || "",
      captchaId:     captchaId     || "",
      sessionCookie: sessionCookie || "",
      cnrNumber:     cnrNumber     || "",
      distCode:      distCode      || "",
      complexCode:   complexCode   || "",
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Case not found. Please verify the case details and try again.",
        court,
      });
    }

    // ══════════════════════════════════════════════════════════════
    // CHANGE DETECTION
    // Find the saved case, compare old vs new, create notifications
    // ══════════════════════════════════════════════════════════════
    if (req.user?.id) {
      try {
        const savedCase = await SavedCase.findOne({
          user:       req.user.id,
          court,
          caseType,
          caseNumber: String(caseNumber).trim(),
          year:       Number(year),
        });

        if (savedCase) {
          const changes = ChangeDetector.detect(
            savedCase.cachedTrackingData,
            result
          );

          if (changes.length > 0) {
            // Check user's preferences before sending
            const User = (await import("../models/User.js")).default;
            const user = await User.findById(req.user.id).select("notificationPreferences");
            const caseUpdatesEnabled = user?.notificationPreferences?.caseUpdates !== false;

            if (caseUpdatesEnabled) {
              const caseLabel = savedCase.label || `${savedCase.caseType} ${savedCase.caseNumber}/${savedCase.year}`;
              const link      = `/citizen/track?savedCase=${savedCase._id}`;

              for (const change of changes) {
                let title = "📋 Case Updated";
                if (change.subType === "status_change")     title = "🔄 Status Changed";
                if (change.subType === "next_date_change")  title = "📆 Hearing Date Changed";
                if (change.subType === "judge_change")      title = "👨‍⚖️ Judge Changed";
                if (change.subType === "new_history_entry") title = "📝 New Court Entry";

                await NotificationService.send({
                  userId:        req.user.id,
                  title,
                  message:       `${caseLabel}: ${change.message}`,
                  type:          "case_update",
                  subType:       change.subType,
                  relatedCase:   savedCase._id,
                  link,
                  changeDetails: change,
                });
              }

              console.log(`[trackByCredentials] Sent ${changes.length} change notification(s) to user ${req.user.id}`);
            }
          }
        }
      } catch (changeErr) {
        console.error("[trackByCredentials] Change detection failed:", changeErr.message);
        // Don't fail the request — change detection is non-critical
      }
    }

    // ── Update cache with fresh data ──────────────────────────────
    if (cnrNumber || caseNumber) {
      SavedCase.findOneAndUpdate(
        { court, caseNumber: String(caseNumber), year: Number(year) },
        { lastTrackedAt: new Date(), cachedTrackingData: result }
      ).catch((e) => console.error("[trackByCredentials] Cache update failed:", e.message));
    }

    return res.json({ success: true, ...result });

  } catch (error) {
    console.error("[trackByCredentials] Error:", error.message);

    if (error.message === "INVALID_CAPTCHA") {
      return res.status(422).json({
        success:        false,
        invalidCaptcha: true,
        message:        "Invalid captcha. Please refresh and try again.",
      });
    }

    if (error.message.includes("coming soon") || error.message.includes("not yet implemented")) {
      return res.status(422).json({
        success:    false,
        comingSoon: true,
        message:    error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch case details",
    });
  }
};

// ══════════════════════════════════════════════════════════════════
// TRACK BY CNR
// ══════════════════════════════════════════════════════════════════

export const trackByCNR = async (req, res) => {
  try {
    const { cnrNumber, court } = req.body;

    if (!cnrNumber || cnrNumber.trim().length < 16) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 16-character CNR number",
      });
    }

    const courtName = court || resolveCNRCourt(cnrNumber);
    const service   = getTrackingService(courtName);

    const result = await service.trackByCNR(cnrNumber.trim().toUpperCase());

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Case not found for this CNR number",
      });
    }

    return res.json({ success: true, ...result });

  } catch (error) {
    console.error("[trackByCNR] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "CNR search failed",
    });
  }
};

// ══════════════════════════════════════════════════════════════════
// TRACK SAVED CASE
// ══════════════════════════════════════════════════════════════════

export const trackSavedCase = async (req, res) => {
  try {
    const savedCase = await SavedCase.findOne({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!savedCase) {
      return res.status(404).json({
        success: false,
        message: "Saved case not found",
      });
    }

    const courtConfig = getCourtConfig(savedCase.court);

    return res.json({
      success: true,
      savedCase: {
        _id:        savedCase._id,
        label:      savedCase.label,
        court:      savedCase.court,
        caseType:   savedCase.caseType,
        mtype:      savedCase.mtype,
        caseNumber: savedCase.caseNumber,
        year:       savedCase.year,
        cnrNumber:  savedCase.cnrNumber,
        provider:   savedCase.provider,
        courtCode:  savedCase.courtCode,
      },
      credentials: {
        court:      savedCase.court,
        caseType:   savedCase.caseType,
        mtype:      savedCase.mtype,
        caseNumber: savedCase.caseNumber,
        year:       savedCase.year,
        cnrNumber:  savedCase.cnrNumber || "",
        provider:   savedCase.provider  || courtConfig?.provider,
        distCode:     savedCase.distCode    || "",
        distName:     savedCase.distName    || "",
        complexCode:  savedCase.complexCode || "",
        complexName:  savedCase.complexName || "",
      },
      courtConfig: courtConfig ? {
        provider:        courtConfig.provider,
        captchaProvider: courtConfig.captchaProvider,
        caseTypeSet:     courtConfig.caseTypeSet,
        supported:       courtConfig.supported,
        comingSoon:      courtConfig.comingSoon || false,
      } : null,
      message: "Case loaded successfully",
    });

  } catch (error) {
    console.error("[trackSavedCase] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ══════════════════════════════════════════════════════════════════
// GET COURT INFO
// ══════════════════════════════════════════════════════════════════

export const getCourtInfo = async (req, res) => {
  try {
    const courtName = req.query.court;

    if (!courtName) {
      return res.status(400).json({
        success: false,
        message: "court query param is required",
      });
    }

    const config = getCourtConfig(courtName);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Court "${courtName}" not found in registry`,
      });
    }

    const service   = getTrackingService(courtName);
    const caseTypes = service.getCaseTypes?.() || [];

    return res.json({
      success: true,
      court:   courtName,
      config: {
        provider:        config.provider,
        captchaProvider: config.captchaProvider,
        caseTypeSet:     config.caseTypeSet,
        supported:       config.supported,
        comingSoon:      config.comingSoon || false,
        stateCode:       config.stateCode,
        districtCode:    config.districtCode,
      },
      caseTypes,
    });

  } catch (error) {
    console.error("[getCourtInfo] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ══════════════════════════════════════════════════════════════════
// DEPRECATED
// ══════════════════════════════════════════════════════════════════

export const trackCase = async (req, res) => {
  return res.status(410).json({
    message: "Deprecated. Use POST /api/track/credentials instead.",
  });
};

export const trackCaseById = async (req, res) => {
  return res.status(410).json({
    message: "Deprecated. Use POST /api/track/credentials instead.",
  });
};

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

const resolveCNRCourt = (cnrNumber) => {
  const prefix = cnrNumber.toUpperCase().substring(0, 4);

  const prefixMap = {
    TSHC: "Telangana High Court, Hyderabad",
    TSHY: "District Court, Hyderabad",
    TSRR: "District Court, Rangareddy",
    TSMM: "District Court, Medchal-Malkajgiri",
    TSSR: "District Court, Sangareddy",
    TSWU: "District Court, Warangal",
    TSKR: "District Court, Karimnagar",
    TSNZ: "District Court, Nizamabad",
    TSKM: "District Court, Khammam",
    TSNL: "District Court, Nalgonda",
    TSAD: "District Court, Adilabad",
    TSMB: "District Court, Mahabubnagar",
  };

  return prefixMap[prefix] || "Telangana High Court, Hyderabad";
};