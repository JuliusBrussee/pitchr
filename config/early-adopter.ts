/* ——————————————————————————————————————————————————————————
 * Early Adopter Promotion Configuration
 *
 * Auto-grants bonus credits to every user during the launch
 * window. After EARLY_ADOPTER_EXPIRY, all UI elements stop
 * rendering and no new grants can be made.
 * —————————————————————————————————————————————————————————— */

/** Bonus credits granted to each early adopter */
export const EARLY_ADOPTER_CREDITS = 20;

/** Source identifier logged in credit_transactions */
export const EARLY_ADOPTER_SOURCE = 'early_adopter';

/** Promotion start (launch day) */
export const EARLY_ADOPTER_START = new Date('2026-03-13T00:00:00Z');

/** Promotion end — credits also expire at this date */
export const EARLY_ADOPTER_EXPIRY = new Date('2026-04-13T23:59:59Z');

/** Whether the current time falls within the early adopter window */
export function isEarlyAdopterPeriod(): boolean {
  const now = Date.now();
  return now >= EARLY_ADOPTER_START.getTime() && now <= EARLY_ADOPTER_EXPIRY.getTime();
}

/** Days remaining until the early adopter window closes */
export function getEarlyAdopterDaysRemaining(): number {
  const ms = EARLY_ADOPTER_EXPIRY.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
