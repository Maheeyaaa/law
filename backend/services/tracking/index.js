// backend/services/tracking/index.js
// ══════════════════════════════════════════════════════════════════
// PROVIDER ROUTER — Strategy Pattern
//
// This is the ONLY file trackController.js imports.
// It reads the court name → looks up the registry → 
// instantiates the correct service → returns it.
//
// Adding a new court system = add entry to courtRegistry.js
// + create a new Service class. Zero changes to controller.
// ══════════════════════════════════════════════════════════════════

import {
  PROVIDERS,
  getCourtConfig,
  isCourtSupported,
} from "../../constants/courtRegistry.js";

import TelanganaHCService  from "./TelanganaHCService.js";
import ECourtsService      from "./ECourtsService.js";
import ConsumerCourtService from "./ConsumerCourtService.js";
import TribunalService     from "./TribunalService.js";

// ── Service factory ───────────────────────────────────────────────

/**
 * Get the correct tracking service for a given court name.
 * 
 * @param {string} courtName - exact court name from frontend dropdown
 * @returns {BaseTrackingService} - instantiated service ready to use
 * @throws {Error} if court is unknown or unsupported
 */
export const getTrackingService = (courtName) => {
  if (!courtName) {
    throw new Error("Court name is required");
  }

  const config = getCourtConfig(courtName);

  if (!config) {
    throw new Error(
      `Court "${courtName}" is not registered. ` +
      `Please select a valid Telangana court.`
    );
  }

  // Map provider string → service class
  switch (config.provider) {

    case PROVIDERS.TELANGANA_HC:
      return new TelanganaHCService(config);

    case PROVIDERS.ECOURTS:
      return new ECourtsService(config);

    case PROVIDERS.CONSUMER_COURT:
      return new ConsumerCourtService(config);

    case PROVIDERS.TRIBUNAL:
      return new TribunalService(config);

    case PROVIDERS.UNSUPPORTED:
      // Return a service that explains it's not supported
      return {
        courtConfig: config,
        getCaptcha: async () => ({
          success:    false,
          comingSoon: true,
          provider:   PROVIDERS.UNSUPPORTED,
          message:    `"${courtName}" tracking is coming soon. No public API is currently available.`,
        }),
        trackByCredentials: async () => {
          throw new Error(`Tracking for "${courtName}" is not yet available. Coming soon.`);
        },
        trackByCNR: async () => null,
      };

    default:
      throw new Error(
        `No tracking service configured for provider: ${config.provider}`
      );
  }
};

/**
 * Get the correct captcha service for a court.
 * Separated so frontend can request captcha independently.
 * 
 * @param {string} courtName
 * @returns {BaseTrackingService}
 */
export const getCaptchaService = (courtName) => {
  return getTrackingService(courtName);
};

/**
 * Check if a court is supported before attempting to track.
 * Use this for fast validation before heavy operations.
 */
export const validateCourtSupport = (courtName) => {
  const config = getCourtConfig(courtName);
  if (!config) {
    return {
      supported: false,
      reason:    "Court not found in registry",
    };
  }
  if (!isCourtSupported(courtName)) {
    return {
      supported:  false,
      comingSoon: config.comingSoon || false,
      reason:     `${courtName} tracking is coming soon`,
      provider:   config.provider,
    };
  }
  return { supported: true };
};