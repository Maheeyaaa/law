// backend/services/tracking/BaseTrackingService.js
// ══════════════════════════════════════════════════════════════════
// Abstract base class that all court services must extend.
// Enforces a consistent interface so trackController.js
// never needs to know which court it is talking to.
// ══════════════════════════════════════════════════════════════════

export default class BaseTrackingService {

  constructor(courtConfig) {
    if (!courtConfig) {
      throw new Error("BaseTrackingService requires a courtConfig object");
    }
    this.courtConfig = courtConfig;
    this.providerName = courtConfig.provider;
  }

  // ── Must implement ─────────────────────────────────────────────

  /**
   * Track a case by credentials (case type + number + year)
   * @param {object} params
   * @param {string} params.caseType
   * @param {string} params.caseNumber
   * @param {number} params.year
   * @param {number|string} params.mtype
   * @param {string} params.captcha
   * @param {string} params.captchaId
   * @param {string} params.sessionCookie
   * @returns {Promise<TrackingResult>}
   */
  async trackByCredentials(params) {
    throw new Error(`${this.providerName} must implement trackByCredentials()`);
  }

  /**
   * Track a case by CNR number
   * @param {string} cnrNumber
   * @returns {Promise<TrackingResult>}
   */
  async trackByCNR(cnrNumber) {
    throw new Error(`${this.providerName} must implement trackByCNR()`);
  }

  /**
   * Get captcha for this court's portal
   * @returns {Promise<CaptchaResult>}
   */
  async getCaptcha() {
    throw new Error(`${this.providerName} must implement getCaptcha()`);
  }

  /**
   * Get case types supported by this court
   * @returns {Array<{label: string, value: string}>}
   */
  getCaseTypes() {
    throw new Error(`${this.providerName} must implement getCaseTypes()`);
  }

  // ── Shared helpers ─────────────────────────────────────────────

  /**
   * Build a standardized success response
   * All services return this shape so frontend never changes
   */
  buildSuccessResponse({
    caseNumber,
    caseType,
    year,
    petitioner,
    respondent,
    caseStatus,
    judge,
    nextHearing,
    lastHearing,
    district,
    cnrNumber,
    caseHistory = [],
    rawData = null,
    source = null,
  }) {
    return {
      found:       true,
      provider:    this.providerName,
      source:      source || this.courtConfig.displayName,
      court:       this.courtConfig.displayName,
      caseNumber,
      caseType,
      year,
      cnrNumber:   cnrNumber || "",
      petitioner:  petitioner  || "As per court records",
      respondent:  respondent  || "As per court records",
      caseStatus:  caseStatus  || "Pending",
      judge:       judge       || "As per court records",
      nextHearing: nextHearing || "Not yet fixed",
      lastHearing: lastHearing || null,
      district:    district    || null,
      caseHistory,
      rawData,
      lastUpdated: new Date(),
    };
  }

  /**
   * Build a standardized error response
   */
  buildErrorResponse(message, extra = {}) {
    return {
      found:    false,
      provider: this.providerName,
      court:    this.courtConfig.displayName,
      message,
      ...extra,
    };
  }

  /**
   * Log with provider prefix — keeps logs readable
   */
  log(...args) {
    console.log(`[${this.providerName}]`, ...args);
  }

  logError(...args) {
    console.error(`[${this.providerName}] ERROR:`, ...args);
  }
}