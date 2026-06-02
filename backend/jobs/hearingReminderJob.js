// backend/jobs/hearingReminderJob.js
// ══════════════════════════════════════════════════════════════════
// Cron job that checks saved cases and sends hearing reminders.
// Runs 3 times daily — sends 7-day, 1-day, and same-day reminders.
// ══════════════════════════════════════════════════════════════════

import SavedCase from "../models/SavedCase.js";
import NotificationService from "../services/notifications/NotificationService.js";

// ══════════════════════════════════════════════════════════════════
// HELPER — Parse messy date strings from court data
// Examples: "29th June 2026", "08/07/2026", "08-07-2026"
// ══════════════════════════════════════════════════════════════════

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  // Strip extra text after date (like "Date Not Updated")
  const datePattern = /(\d{1,2})(?:st|nd|rd|th)?[\s\/\-]+([a-zA-Z]+|\d{1,2})[\s\/\-]+(\d{4})/i;
  const match = dateStr.match(datePattern);

  if (!match) return null;

  const cleaned = `${match[1]} ${match[2]} ${match[3]}`
    .replace(/\s+/g, " ")
    .trim();

  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY format
  const ddmm = `${match[3]}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  d = new Date(ddmm);
  if (!isNaN(d.getTime())) return d;

  return null;
}

// ══════════════════════════════════════════════════════════════════
// HELPER — Days between two dates (ignoring time)
// ══════════════════════════════════════════════════════════════════

function daysBetween(date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / msPerDay);
}

// ══════════════════════════════════════════════════════════════════
// HELPER — Format date nicely for notification
// ══════════════════════════════════════════════════════════════════

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });
}

// ══════════════════════════════════════════════════════════════════
// MAIN JOB — Check all saved cases and send reminders
// ══════════════════════════════════════════════════════════════════

export async function runHearingReminderJob() {
  const startTime = new Date();

  try {
    const cases = await SavedCase.find({
      "cachedTrackingData.nextHearing": { $exists: true, $ne: "" },
    }).populate("user", "name email notificationPreferences");

    let sent7Day  = 0;
    let sent1Day  = 0;
    let sentToday = 0;
    let skipped   = 0;
    let invalid   = 0;

    const today = new Date();

    for (const savedCase of cases) {
      try {
        // Skip if user disabled hearing reminders
        if (savedCase.user?.notificationPreferences?.hearingReminders === false) {
          skipped++;
          continue;
        }

        const nextHearingStr = savedCase.cachedTrackingData?.nextHearing;
        const hearingDate    = parseDate(nextHearingStr);

        if (!hearingDate) {
          invalid++;
          continue;
        }

        const daysUntil = daysBetween(today, hearingDate);

        // Skip past hearings or far future
        if (daysUntil < 0 || daysUntil > 7) {
          continue;
        }

        const caseLabel = savedCase.label || `${savedCase.caseType} ${savedCase.caseNumber}/${savedCase.year}`;
        const link      = `/citizen/track?savedCase=${savedCase._id}`;

        // ── 7-day reminder ──
        if (daysUntil === 7) {
          const alreadySent = await NotificationService.wasRecentlySent(
            savedCase.user._id, savedCase._id, "hearing_7day", 48
          );
          if (!alreadySent) {
            await NotificationService.send({
              userId:      savedCase.user._id,
              title:       "📅 Hearing in 7 Days",
              message:     `${caseLabel} has a hearing on ${formatDate(hearingDate)}`,
              type:        "hearing_reminder",
              subType:     "hearing_7day",
              relatedCase: savedCase._id,
              link,
              changeDetails: { hearingDate: hearingDate.toISOString(), daysUntil: 7 },
            });
            sent7Day++;
          }
        }

        // ── 1-day (tomorrow) reminder ──
        if (daysUntil === 1) {
          const alreadySent = await NotificationService.wasRecentlySent(
            savedCase.user._id, savedCase._id, "hearing_1day", 24
          );
          if (!alreadySent) {
            await NotificationService.send({
              userId:      savedCase.user._id,
              title:       "⏰ Hearing Tomorrow",
              message:     `${caseLabel} — hearing scheduled for tomorrow (${formatDate(hearingDate)})`,
              type:        "hearing_reminder",
              subType:     "hearing_1day",
              relatedCase: savedCase._id,
              link,
              changeDetails: { hearingDate: hearingDate.toISOString(), daysUntil: 1 },
            });
            sent1Day++;
          }
        }

        // ── Same-day reminder ──
        if (daysUntil === 0) {
          const alreadySent = await NotificationService.wasRecentlySent(
            savedCase.user._id, savedCase._id, "hearing_today", 12
          );
          if (!alreadySent) {
            await NotificationService.send({
              userId:      savedCase.user._id,
              title:       "🚨 Hearing TODAY",
              message:     `${caseLabel} has a hearing today (${formatDate(hearingDate)})`,
              type:        "hearing_reminder",
              subType:     "hearing_today",
              relatedCase: savedCase._id,
              link,
              changeDetails: { hearingDate: hearingDate.toISOString(), daysUntil: 0 },
            });
            sentToday++;
          }
        }

      } catch (caseError) {
        console.error(`[HearingReminder] Error processing case ${savedCase._id}:`, caseError.message);
      }
    }

    const totalSent = sent7Day + sent1Day + sentToday;
    const duration  = ((new Date() - startTime) / 1000).toFixed(1);

    // Only log if something happened (or invalid found) — silent successful run
    if (totalSent > 0 || invalid > 0) {
      console.log(`[HearingReminder] ${cases.length} cases checked in ${duration}s — sent: 7d=${sent7Day} 1d=${sent1Day} today=${sentToday} | skipped=${skipped} invalid=${invalid}`);
    }

    return { sent7Day, sent1Day, sentToday, skipped, invalid, total: cases.length };

  } catch (error) {
    console.error("[HearingReminder] Job failed:", error.message);
    throw error;
  }
}