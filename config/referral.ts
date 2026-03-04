/* ——————————————————————————————————————————————————————————
 * Referral System Configuration
 *
 * All referral reward amounts, caps, and code generation
 * settings are defined here. To change referral rewards,
 * edit ONLY this file.
 * —————————————————————————————————————————————————————————— */

/** Bonus credits awarded to the referrer on successful referral */
export const REFERRER_REWARD_CREDITS = 3;

/** Bonus credits awarded to the referred user on first analysis */
export const REFERRED_REWARD_CREDITS = 3;

/** Number of days before referral bonus credits expire */
export const REFERRAL_BONUS_EXPIRY_DAYS = 90;

/** Maximum number of referral rewards a single user can earn */
export const MAX_REFERRAL_REWARDS = 10;

/** Length of generated referral codes */
export const REFERRAL_CODE_LENGTH = 8;

/** Characters used for referral code generation (no ambiguous chars) */
export const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** localStorage key for storing referral codes from URL params */
export const REFERRAL_STORAGE_KEY = 'pitchr_referral_code';
