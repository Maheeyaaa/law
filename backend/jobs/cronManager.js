// backend/jobs/cronManager.js
// ══════════════════════════════════════════════════════════════════
// Manages all scheduled background jobs.
// Called once when server starts.
// ══════════════════════════════════════════════════════════════════

import cron from "node-cron";
import { runHearingReminderJob } from "./hearingReminderJob.js";

export function initCronJobs() {
  // ══════════════════════════════════════════════════════════════════
  // HEARING REMINDERS — 3 times daily
  // 8:00 AM, 2:00 PM, 8:00 PM (Indian Standard Time)
  // 
  // Cron format: "minute hour day month weekday"
  // ══════════════════════════════════════════════════════════════════

  cron.schedule(
    "0 8,14,20 * * *",
    async () => {
      try {
        await runHearingReminderJob();
      } catch (err) {
        console.error("[CronManager] Hearing reminder job failed:", err.message);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("[CronManager] ✅ Cron jobs initialized (hearing reminders: 8 AM, 2 PM, 8 PM IST)");
}

// ══════════════════════════════════════════════════════════════════
// MANUAL TRIGGER (for testing or admin)
// ══════════════════════════════════════════════════════════════════

export async function triggerHearingReminders() {
  return await runHearingReminderJob();
}