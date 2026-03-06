import type { SupabaseClient } from '@supabase/supabase-js';
import type { Badge } from '@/types/arena';
import type { Difficulty } from '@/config/arena';
import { BADGES } from '@/config/arena';
import { awardBadge, getOrCreateUserStats } from '@/models/userStats';

/* ——————————————————————————————————————————————————————————
 * Badge Service
 *
 * Evaluates all badge conditions against user stats and
 * awards newly earned badges. Called after key arena events.
 * —————————————————————————————————————————————————————————— */

/* ——— Types ——— */

interface BadgeContext {
  latestScore?: number;
  latestDifficulty?: Difficulty;
  eventType: 'pitch_complete' | 'challenge_submit' | 'game_mode' | 'streak_milestone' | 'league_promotion';
}

/* ——— Helpers ——— */

function getBadgeDef(id: string) {
  return BADGES.find((b) => b.id === id);
}

function makeBadge(id: string): Badge | null {
  const def = getBadgeDef(id);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    earnedAt: new Date().toISOString(),
    rarity: def.rarity,
  };
}

/** Get the start of the current ISO week (Monday 00:00 UTC). */
function getIsoWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/* ——— Badge Evaluators ——— */

type BadgeCheck = (
  supabase: SupabaseClient,
  userId: string,
  context: BadgeContext,
  earnedIds: Set<string>,
) => Promise<Badge | null>;

/** first_pitch: completed at least 1 game mode or pitch analysis */
const checkFirstPitch: BadgeCheck = async (_supabase, _userId, context, earnedIds) => {
  if (earnedIds.has('first_pitch')) return null;
  if (context.eventType !== 'pitch_complete' && context.eventType !== 'game_mode') return null;
  // If the event just happened, the user has completed at least one
  return makeBadge('first_pitch');
};

/** weekly_warrior: 4+ challenges completed */
const checkWeeklyWarrior: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('weekly_warrior')) return null;
  if (context.eventType !== 'challenge_submit') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.challengesCompleted >= 4) return makeBadge('weekly_warrior');
  return null;
};

/** century_club: score exactly 100 */
const checkCenturyClub: BadgeCheck = async (_supabase, _userId, context, earnedIds) => {
  if (earnedIds.has('century_club')) return null;
  if (context.latestScore === 100) return makeBadge('century_club');
  return null;
};

/** diamond_pitcher: reach Diamond league */
const checkDiamondPitcher: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('diamond_pitcher')) return null;
  if (context.eventType !== 'league_promotion') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.currentLeagueTier === 'diamond' || stats.currentLeagueTier === 'champion') {
    return makeBadge('diamond_pitcher');
  }
  return null;
};

/** champion: reach Champion league */
const checkChampion: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('champion')) return null;
  if (context.eventType !== 'league_promotion') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.currentLeagueTier === 'champion') return makeBadge('champion');
  return null;
};

/** iron_streak: 30-day streak */
const checkIronStreak: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('iron_streak')) return null;
  if (context.eventType !== 'streak_milestone') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.currentStreak >= 30) return makeBadge('iron_streak');
  return null;
};

/** obsidian_streak: 100-day streak */
const checkObsidianStreak: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('obsidian_streak')) return null;
  if (context.eventType !== 'streak_milestone') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.currentStreak >= 100) return makeBadge('obsidian_streak');
  return null;
};

/** speed_demon: score 80+ on Expert game mode */
const checkSpeedDemon: BadgeCheck = async (_supabase, _userId, context, earnedIds) => {
  if (earnedIds.has('speed_demon')) return null;
  if (context.eventType !== 'game_mode') return null;
  if (
    context.latestScore !== undefined &&
    context.latestScore >= 80 &&
    context.latestDifficulty === 'expert'
  ) {
    return makeBadge('speed_demon');
  }
  return null;
};

/** genre_master: game mode sessions across 5 different industries */
const checkGenreMaster: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('genre_master')) return null;
  if (context.eventType !== 'game_mode' && context.eventType !== 'challenge_submit') return null;

  // Query game_mode_sessions joined with scenarios to count distinct industries
  const { data, error } = await supabase
    .from('game_mode_sessions')
    .select('scenarios!inner(industry)')
    .eq('user_id', userId);

  if (error) {
    console.error('[badge-service] genre_master query failed:', error.message);
    return null;
  }

  // Count distinct industries
  const industries = new Set<string>();
  for (const row of data ?? []) {
    // Supabase returns joined table as nested object
    const scenario = row.scenarios as unknown as { industry: string };
    if (scenario?.industry) {
      industries.add(scenario.industry);
    }
  }

  if (industries.size >= 5) return makeBadge('genre_master');
  return null;
};

/** pitch_perfect: 3 scores >= 90 within the current ISO week */
const checkPitchPerfect: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('pitch_perfect')) return null;
  if (context.eventType !== 'game_mode' && context.eventType !== 'pitch_complete') return null;

  const weekStart = getIsoWeekStart();

  const { data, error } = await supabase
    .from('game_mode_sessions')
    .select('score')
    .eq('user_id', userId)
    .gte('completed_at', weekStart.toISOString())
    .gte('score', 90);

  if (error) {
    console.error('[badge-service] pitch_perfect query failed:', error.message);
    return null;
  }

  if ((data ?? []).length >= 3) return makeBadge('pitch_perfect');
  return null;
};

/** challenge_champion: won at least 1 weekly challenge (#1 rank) */
const checkChallengeChampion: BadgeCheck = async (supabase, userId, context, earnedIds) => {
  if (earnedIds.has('challenge_champion')) return null;
  if (context.eventType !== 'challenge_submit') return null;
  const stats = await getOrCreateUserStats(supabase, userId);
  if (stats.challengeWins >= 1) return makeBadge('challenge_champion');
  return null;
};

/* ——— All Checks ——— */

const BADGE_CHECKS: BadgeCheck[] = [
  checkFirstPitch,
  checkWeeklyWarrior,
  checkCenturyClub,
  checkDiamondPitcher,
  checkChampion,
  checkIronStreak,
  checkObsidianStreak,
  checkSpeedDemon,
  checkGenreMaster,
  checkPitchPerfect,
  checkChallengeChampion,
];

/* ——— Main Evaluator ——— */

export async function evaluateBadges(
  supabase: SupabaseClient,
  userId: string,
  context: BadgeContext,
): Promise<Badge[]> {
  const stats = await getOrCreateUserStats(supabase, userId);
  const earnedIds = new Set<string>(stats.badges.map((b) => b.id));
  const newBadges: Badge[] = [];

  for (const check of BADGE_CHECKS) {
    try {
      const badge = await check(supabase, userId, context, earnedIds);
      if (badge) {
        await awardBadge(supabase, userId, badge);
        earnedIds.add(badge.id);
        newBadges.push(badge);
      }
    } catch (err) {
      // Log but don't fail the whole evaluation for one badge
      console.error('[badge-service] badge check error:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return newBadges;
}
