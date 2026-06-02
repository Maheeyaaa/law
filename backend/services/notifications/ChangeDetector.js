// backend/services/notifications/ChangeDetector.js
// ══════════════════════════════════════════════════════════════════
// Compares old vs new case tracking data and detects changes.
// Returns a list of change objects that can be turned into notifications.
// ══════════════════════════════════════════════════════════════════

class ChangeDetector {

  /**
   * Compare old and new tracking data
   * @param {Object} oldData - cachedTrackingData (previous state)
   * @param {Object} newData - freshly fetched tracking data
   * @returns {Array} - list of change objects
   */
  detect(oldData, newData) {
    // If there's no old data (first time tracking), no changes to report
    if (!oldData || typeof oldData !== "object") {
      return [];
    }

    if (!newData || typeof newData !== "object") {
      return [];
    }

    const changes = [];

    // ── 1. Status Change ─────────────────────────────────────────
    const oldStatus = this.normalize(oldData.caseStatus);
    const newStatus = this.normalize(newData.caseStatus);
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      changes.push({
        type:    "status_change",
        subType: "status_change",
        field:   "Case Status",
        old:     oldData.caseStatus,
        new:     newData.caseStatus,
        message: `Status changed from "${oldData.caseStatus}" to "${newData.caseStatus}"`,
      });
    }

    // ── 2. Next Hearing Date Change ──────────────────────────────
    const oldDate = this.normalize(oldData.nextHearing);
    const newDate = this.normalize(newData.nextHearing);
    if (oldDate && newDate && oldDate !== newDate) {
      changes.push({
        type:    "case_update",
        subType: "next_date_change",
        field:   "Next Hearing",
        old:     oldData.nextHearing,
        new:     newData.nextHearing,
        message: `Hearing date changed from "${oldData.nextHearing}" to "${newData.nextHearing}"`,
      });
    }

    // ── 3. Judge Change ──────────────────────────────────────────
    const oldJudge = this.normalize(oldData.judge);
    const newJudge = this.normalize(newData.judge);
    if (oldJudge && newJudge && oldJudge !== newJudge) {
      changes.push({
        type:    "case_update",
        subType: "judge_change",
        field:   "Judge",
        old:     oldData.judge,
        new:     newData.judge,
        message: `Judge changed from "${oldData.judge}" to "${newData.judge}"`,
      });
    }

    // ── 4. New History Entry ─────────────────────────────────────
    const oldHistory = Array.isArray(oldData.caseHistory) ? oldData.caseHistory : [];
    const newHistory = Array.isArray(newData.caseHistory) ? newData.caseHistory : [];

    if (newHistory.length > oldHistory.length) {
      const newEntries = newHistory.slice(oldHistory.length);
      const latest     = newEntries[newEntries.length - 1];

      changes.push({
        type:    "case_update",
        subType: "new_history_entry",
        field:   "Case History",
        old:     `${oldHistory.length} entries`,
        new:     `${newHistory.length} entries`,
        message: latest?.purpose 
          ? `New court entry: ${latest.purpose}${latest.date ? ` (${latest.date})` : ""}`
          : `${newEntries.length} new entries added to case history`,
        newEntries,
      });
    }

    return changes;
  }

  /**
   * Normalize string for comparison
   */
  normalize(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim().toLowerCase();
  }

  /**
   * Get human-readable summary of changes (for notification title)
   */
  getSummary(changes) {
    if (!changes || changes.length === 0) return null;
    if (changes.length === 1) return changes[0].message;
    return `${changes.length} updates detected in your case`;
  }
}

export default new ChangeDetector();