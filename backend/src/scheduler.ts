import cron from "node-cron";
import { env } from "./lib/env";
import { releaseExpiredHolds, expireOffers } from "./modules/waitlist/waitlist.service";

/**
 * Background TTL sweeper.
 *
 * Every SWEEP_INTERVAL_SECONDS it:
 *   1. expires stale waitlist offers (freeing + re-offering the reserved seat), then
 *   2. releases ordinary seat holds whose TTL has elapsed.
 *
 * Offers are swept first so a just-expired offer seat is re-offered rather than
 * dumped straight back to AVAILABLE. Each pass emits `seat:update` for affected
 * shows, so open seat maps refresh in real time even with no user action.
 *
 * A guard flag prevents overlapping runs if a sweep ever takes longer than the
 * interval.
 */
let running = false;

async function sweep() {
  if (running) return;
  running = true;
  try {
    const offers = await expireOffers();
    const holds = await releaseExpiredHolds();
    if (offers || holds) {
      console.log(`[sweeper] expired ${offers} offer(s), released ${holds} hold(s)`);
    }
  } catch (err) {
    console.error("[sweeper] error:", err);
  } finally {
    running = false;
  }
}

export function startScheduler() {
  const seconds = Math.min(59, Math.max(5, env.sweepIntervalSeconds));
  // node-cron supports 6-field expressions (with seconds).
  const expr = `*/${seconds} * * * * *`;
  cron.schedule(expr, sweep);
  console.log(`[sweeper] running every ${seconds}s`);
  // Run once on boot so anything left expired from a previous run is cleaned up.
  void sweep();
}
