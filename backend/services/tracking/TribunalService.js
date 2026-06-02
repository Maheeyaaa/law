// backend/services/tracking/TribunalService.js
// ══════════════════════════════════════════════════════════════════
// Stub for Tribunal tracking (TAT, Labour Courts, etc.)
// Status: NOT YET IMPLEMENTED
// ══════════════════════════════════════════════════════════════════

import BaseTrackingService from "./BaseTrackingService.js";

export default class TribunalService extends BaseTrackingService {

  async getCaptcha() {
    return {
      success:        false,
      provider:       this.providerName,
      comingSoon:     true,
      message:        "Tribunal tracking coming soon",
    };
  }

  async trackByCredentials() {
    throw new Error("Tribunal tracking is not yet implemented. Coming soon.");
  }

  async trackByCNR() {
    throw new Error("Tribunal CNR tracking is not yet implemented. Coming soon.");
  }

  getCaseTypes() {
    return [
      { label: "Original Application (OA)", value: "OA" },
      { label: "Transfer Application (TA)", value: "TA" },
      { label: "Review Petition (RP)",      value: "RP" },
    ];
  }
}