import type { SupabaseClient } from '@supabase/supabase-js';
import type { Badge, UserStats, UserStatsRow } from '@/types/arena';
import { mapUserStatsRow } from '@/types/arena';

/* ——————————————————————————————————————————————————————————
 * User Stats Model
 *
 * Data-access layer for the user_stats table. Handles CRUD,
 * streak logic, badge awarding, and leaderboard queries.
 * All DB access goes through the Supabase client passed in
 * (admin client recommended to bypass RLS).
 * —————————————————————————————————————————————————————————— */

/* ——— Date Helpers ——— */

function getUtcDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return dateStr === getUtcDateString(yesterday);
}

/* ——— Streak Milestones ——— */

const STREAK_MILESTONES = [3, 7, 30, 60, 100, 365];

/* ——— Default Row Values ——— */

const DEFAULT_USER_STATS = {
  total_xp: 0,
  current_league_tier: 'bronze' as const,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  streak_freezes_remaining: 1,
  streak_freeze_last_reset: null,
  challenges_completed: 0,
  challenge_wins: 0,
  game_mode_completed: 0,
  highest_score: 0,
  badges: [] as Badge[],
};

/* ——— Get or Create ——— */

export async function getOrCreateUserStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[user-stats] select failed:', error.message);
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }

  if (data) {
    return mapUserStatsRow(data as UserStatsRow);
  }

  // Not found — insert default row
  const { data: inserted, error: insertError } = await supabase
    .from('user_stats')
    .insert({
      user_id: userId,
      ...DEFAULT_USER_STATS,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[user-stats] insert failed:', insertError.message);
    throw new Error(`Failed to create user stats: ${insertError.message}`);
  }

  return mapUserStatsRow(inserted as UserStatsRow);
}

/* ——— Update ——— */

/** Map camelCase UserStats keys to snake_case DB columns. */
const CAMEL_TO_SNAKE: Record<string, string> = {
  userId: 'user_id',
  totalXp: 'total_xp',
  currentLeagueTier: 'current_league_tier',
  currentStreak: 'current_streak',
  longestStreak: 'longest_streak',
  lastActivityDate: 'last_activity_date',
  streakFreezesRemaining: 'streak_freezes_remaining',
  streakFreezeLastReset: 'streak_freeze_last_reset',
  challengesCompleted: 'challenges_completed',
  challengeWins: 'challenge_wins',
  gameModeCompleted: 'game_mode_completed',
  highestScore: 'highest_score',
  badges: 'badges',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

function toSnakeCase(updates: Partial<UserStats>): Record<string, unknown> {
  const snaked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = CAMEL_TO_SNAKE[key];
    if (snakeKey) {
      snaked[snakeKey] = value;
    }
  }
  return snaked;
}

export async function updateUserStats(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<UserStats>,
): Promise<UserStats> {
  const snaked = toSnakeCase(updates);
  snaked.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_stats')
    .update(snaked)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[user-stats] update failed:', error.message);
    throw new Error(`Failed to update user stats: ${error.message}`);
  }

  return mapUserStatsRow(data as UserStatsRow);
}

/* ——— Streak ——— */

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ currentStreak: number; isNewMilestone: boolean; milestone?: number }> {
  const stats = await getOrCreateUserStats(supabase, userId);
  const today = getUtcDateString();

  // Already active today — no-op
  if (stats.lastActivityDate === today) {
    return {
      currentStreak: stats.currentStreak,
      isNewMilestone: false,
    };
  }

  let newStreak = stats.currentStreak;
  let newFreezes = stats.streakFreezesRemaining;

  if (stats.lastActivityDate && isYesterday(stats.lastActivityDate)) {
    // Consecutive day — increment
    newStreak += 1;
  } else if (stats.lastActivityDate) {
    // Missed at least one day (lastActivityDate is before yesterday)
    if (newFreezes > 0) {
      // Use a streak freeze — keep streak, decrement freezes
      newFreezes -= 1;
    } else {
      // No freezes left — reset
      newStreak = 1;
    }
  } else {
    // First activity ever (lastActivityDate is undefined/null)
    newStreak = 1;
  }

  const newLongest = Math.max(stats.longestStreak, newStreak);

  await updateUserStats(supabase, userId, {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: today,
    streakFreezesRemaining: newFreezes,
  });

  // Check milestones
  const isNewMilestone = STREAK_MILESTONES.includes(newStreak);

  return {
    currentStreak: newStreak,
    isNewMilestone,
    ...(isNewMilestone ? { milestone: newStreak } : {}),
  };
}

/* ——— Badge Awarding ——— */

export async function awardBadge(
  supabase: SupabaseClient,
  userId: string,
  badge: Badge,
): Promise<void> {
  const stats = await getOrCreateUserStats(supabase, userId);

  // Idempotent — skip if badge already earned
  if (stats.badges.some((b) => b.id === badge.id)) {
    return;
  }

  const updatedBadges = [...stats.badges, badge];

  const { error } = await supabase
    .from('user_stats')
    .update({
      badges: updatedBadges,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[user-stats] awardBadge failed:', error.message);
    throw new Error(`Failed to award badge: ${error.message}`);
  }
}

/* ——— Leaderboard ——— */

export async function getLeaderboard(
  supabase: SupabaseClient,
  sortBy: 'total_xp' | 'highest_score' | 'challenge_wins',
  limit = 50,
): Promise<UserStats[]> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*, profiles:user_id(display_name)')
    .gt('total_xp', 0)
    .order(sortBy, { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[user-stats] getLeaderboard failed:', error.message);
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }

  return (data ?? []).map((row: UserStatsRow) => mapUserStatsRow(row));
}
