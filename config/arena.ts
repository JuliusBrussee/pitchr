/* ——————————————————————————————————————————————————————————
 * Arena Configuration
 *
 * All XP values, league settings, difficulty tiers, badge
 * definitions, and plan-gated limits for the Arena system.
 * Pure data only — no service imports.
 * —————————————————————————————————————————————————————————— */

/* ——— XP Values ——— */

export const XP_VALUES = {
  PITCH_ANALYSIS: 20,
  CHALLENGE_SUBMIT: 50,
  CHALLENGE_SCORE_BONUS_THRESHOLD: 70,
  GAME_MODE_COMPLETE: 15,
  GAME_MODE_SCORE_70: 25,
  GAME_MODE_SCORE_85: 40,
  GAME_MODE_SCORE_95: 60,
  GAME_MODE_EXPERT_BONUS: 10,
  GAME_MODE_SESSION_3X_BONUS: 20,
  FIRST_PITCH_OF_DAY: 10,
  STREAK_3_DAY: 25,
  STREAK_7_DAY: 75,
  STREAK_30_DAY: 300,
  SCORE_IMPROVEMENT_10: 30,
  NEW_MODE_EXPLORATION: 20,
} as const;

/* ——— League Tiers ——— */

export const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'diamond', 'champion'] as const;
export type LeagueTier = typeof LEAGUE_TIERS[number];

/* ——— League Config ——— */

export const LEAGUE_CONFIG = {
  USERS_PER_LEAGUE: 30,
  PROMOTION_COUNT: 5,
  DEMOTION_COUNT: 5,
} as const;

/* ——— Difficulty Settings ——— */

export const DIFFICULTY_SETTINGS = {
  starter: { readTimeSec: 90, pitchTimeSec: 120, label: 'Starter' },
  pro:     { readTimeSec: 60, pitchTimeSec: 120, label: 'Pro' },
  expert:  { readTimeSec: 30, pitchTimeSec: 90,  label: 'Expert' },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_SETTINGS;

/* ——— Challenge Types ——— */

export const CHALLENGE_TYPES = ['elevator', 'vc_pitch', 'speed_round', 'pivot', 'objection'] as const;
export type ChallengeType = typeof CHALLENGE_TYPES[number];

/* ——— Plan-Gated Limits ——— */

export const ARENA_PLAN_LIMITS = {
  free:     { challengeSubmissions: 0,  gameModePerWeek: 2,  leagueAccess: false, streakFreezes: 0 },
  day_pass: { challengeSubmissions: 1,  gameModePerDay: 5,   leagueAccess: false, streakFreezes: 0 },
  pro:      { challengeSubmissions: -1, gameModePerDay: 10,  leagueAccess: true,  streakFreezes: 2 },
} as const;

/* ——— Badge Definitions ——— */

export const BADGES = [
  { id: 'first_pitch',        name: 'First Pitch',        description: 'Complete your first analysis',             rarity: 'common' as const },
  { id: 'weekly_warrior',     name: 'Weekly Warrior',      description: '4 weekly challenges in a row',             rarity: 'uncommon' as const },
  { id: 'century_club',       name: 'Century Club',        description: 'Score 100 on any pitch',                   rarity: 'rare' as const },
  { id: 'diamond_pitcher',    name: 'Diamond Pitcher',     description: 'Reach Diamond league',                     rarity: 'rare' as const },
  { id: 'champion',           name: 'Champion',            description: 'Reach Champion league',                    rarity: 'epic' as const },
  { id: 'iron_streak',        name: 'Iron Streak',         description: '30-day streak',                            rarity: 'uncommon' as const },
  { id: 'obsidian_streak',    name: 'Obsidian Streak',     description: '100-day streak',                           rarity: 'rare' as const },
  { id: 'speed_demon',        name: 'Speed Demon',         description: 'Score 80+ on Expert game mode',            rarity: 'rare' as const },
  { id: 'genre_master',       name: 'Genre Master',        description: 'Challenges in 5 different industries',     rarity: 'uncommon' as const },
  { id: 'pitch_perfect',      name: 'Pitch Perfect',       description: 'Score 90+ three times in one week',        rarity: 'rare' as const },
  { id: 'challenge_champion', name: 'Challenge Champion',  description: 'Win (#1) a weekly challenge',              rarity: 'epic' as const },
] as const;

export type BadgeId = typeof BADGES[number]['id'];
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic';

/* ——— Streak Milestones ——— */

export const STREAK_MILESTONES = [
  { days: 3,  xp: XP_VALUES.STREAK_3_DAY },
  { days: 7,  xp: XP_VALUES.STREAK_7_DAY },
  { days: 30, xp: XP_VALUES.STREAK_30_DAY },
] as const;

/* ——— Scenario Industries ——— */

export const SCENARIO_INDUSTRIES = ['fintech', 'healthtech', 'saas', 'climate', 'consumer', 'edtech', 'ai', 'hardware'] as const;
export type ScenarioIndustry = typeof SCENARIO_INDUSTRIES[number];

/* ——— Scenario Stages ——— */

export const SCENARIO_STAGES = ['pre_seed', 'seed', 'series_a'] as const;
export type ScenarioStage = typeof SCENARIO_STAGES[number];
