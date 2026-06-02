// backend/services/tracking/ConsumerCourtService.js
// ══════════════════════════════════════════════════════════════════
// Stub for Consumer Court tracking
// Portal: confonet.nic.in
// Status: NOT YET IMPLEMENTED
// To activate: implement getCaptcha(), trackByCredentials(), trackByCNR()
//              then set supported: true in courtRegistry.js
// ══════════════════════════════════════════════════════════════════

import BaseTrackingService from "./BaseTrackingService.js";

export default class ConsumerCourtService extends BaseTrackingService {

  async getCaptcha() {
    return {
      success:             false,
      provider:            this.providerName,
      comingSoon:          true,
      message:             "Consumer Court tracking coming soon",
      alternativeUrl:      "https://confonet.nic.in",
      alternativeUrlLabel: "Check status on CONFONET directly",
    };
  }

  async trackByCredentials() {
    throw new Error("Consumer Court tracking is not yet implemented. Coming soon.");
  }

  async trackByCNR() {
    throw new Error("Consumer Court CNR tracking is not yet implemented. Coming soon.");
  }

  getCaseTypes() {
    return [
      { label: "Consumer Complaint (CC)", value: "CC" },
      { label: "First Appeal (FA)",       value: "FA" },
      { label: "Revision Petition (RP)",  value: "RP" },
    ];
  }
}