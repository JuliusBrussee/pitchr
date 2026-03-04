import type { SupabaseClient } from '@supabase/supabase-js';
import type { Difficulty } from '@/config/arena';
import type { XpEventType } from '@/types/arena';
import { XP_VALUES, STREAK_MILESTONES } from '@/config/arena';
import { getIsoWeekInfo } from '@/lib/iso-week';

/* ——————————————————————————————————————————————————————————
 * XP Service
 *
 * Handles XP calculations, awarding, streak bonuses, and
 * weekly league XP tracking. All DB access goes through the
 * Supabase client passed in (admin client recommended to
 * bypass RLS).
 * —————————————————————————————————————————————————————————— */

/* ——— Helpers ——— */

function getCurrentWeekAndYear(): { weekNumber: number; year: number } {
  return getIsoWeekInfo();
}

async function updateLeagueWeeklyXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<void> {
  const { weekNumber, year } = getCurrentWeekAndYear();

  // Find the user's league membership for the current week
  const { data: membership } = await supabase
    .from('league_memberships')
    .select('id, weekly_xp, leagues!inner(week_number, year)')
    .eq('user_id', userId)
    .eq('leagues.week_number', weekNumber)
    .eq('leagues.year', year)
    .maybeSingle();

  if (!membership) return;

  const { error } = await supabase
    .from('league_memberships')
    .update({ weekly_xp: (membership.weekly_xp ?? 0) + amount })
    .eq('id', membership.id);

  if (error) {
    // Non-fatal: log but don't throw since XP was already awarded
    console.error('[xp] update league weekly_xp failed:', error.message);
  }
}

/* ——— Award XP ——— */

export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
  amount: number,
  sourceId?: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  // Idempotency: skip if an xp_event with the same source_id already exists
  if (sourceId) {
    const { data: existing } = await supabase
      .from('xp_events')
      .select('id')
      .eq('source_id', sourceId)
      .maybeSingle();

    if (existing) {
      // Already awarded — return current total without double-awarding
      const { data: stats } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      return stats?.total_xp ?? 0;
    }
  }

  // Insert xp_event row
  const { error: eventError } = await supabase
    .from('xp_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      xp_amount: amount,
      source_id: sourceId ?? null,
      metadata: metadata ?? null,
    });

  if (eventError) {
    console.error('[xp] insert xp_event failed:', eventError.message);
    throw new Error(`Failed to record XP event: ${eventError.message}`);
  }

  // Atomic increment user_stats.total_xp
  const { data: updatedStats, error: statsError } = await supabase
    .rpc('increment_user_xp', {
      p_user_id: userId,
      p_amount: amount,
    });

  if (statsError) {
    console.error('[xp] increment_user_xp RPC failed:', statsError.message);
    throw new Error(`Failed to update total XP: ${statsError.message}`);
  }

  const newTotal = (updatedStats as number) ?? 0;

  // Update league_memberships.weekly_xp for current week (if user is in a league)
  await updateLeagueWeeklyXp(supabase, userId, amount);

  return newTotal;
}

/* ——— Game Mode XP Calculation ——— */

export function calculateGameModeXp(
  score: number,
  difficulty: Difficulty,
): number {
  let total = XP_VALUES.GAME_MODE_COMPLETE;

  if (score >= 95) {
    total += XP_VALUES.GAME_MODE_SCORE_95;
  } else if (score >= 85) {
    total += XP_VALUES.GAME_MODE_SCORE_85;
  } else if (score >= 70) {
    total += XP_VALUES.GAME_MODE_SCORE_70;
  }

  if (difficulty === 'expert') {
    total += XP_VALUES.GAME_MODE_EXPERT_BONUS;
  }

  return total;
}

/* ——— Challenge XP Calculation ——— */

export function calculateChallengeXp(
  baseScore: number,
  bonusScore: number,
): number {
  let total = XP_VALUES.CHALLENGE_SUBMIT;

  const combinedScore = baseScore + bonusScore;
  if (combinedScore > XP_VALUES.CHALLENGE_SCORE_BONUS_THRESHOLD) {
    total += combinedScore - XP_VALUES.CHALLENGE_SCORE_BONUS_THRESHOLD;
  }

  return total;
}

/* ——— Streak XP ——— */

export async function checkAndAwardStreakXp(
  supabase: SupabaseClient,
  userId: string,
  currentStreak: number,
): Promise<number> {
  const milestone = STREAK_MILESTONES.find((m) => m.days === currentStreak);
  if (!milestone) return 0;

  // Unique key per user+milestone to keep this award idempotent.
  const sourceId = `streak_${milestone.days}_${userId}`;

  await awardXp(
    supabase,
    userId,
    'streak_bonus',
    milestone.xp,
    sourceId,
    { streakDays: milestone.days },
  );

  return milestone.xp;
}

/* ——— Weekly XP Query ——— */

export async function getWeeklyXp(
  supabase: SupabaseClient,
  userId: string,
  weekNumber: number,
  year: number,
): Promise<number> {
  const { data, error } = await supabase
    .from('league_memberships')
    .select('weekly_xp, league_id, leagues!inner(week_number, year)')
    .eq('user_id', userId)
    .eq('leagues.week_number', weekNumber)
    .eq('leagues.year', year)
    .maybeSingle();

  if (error) {
    console.error('[xp] getWeeklyXp failed:', error.message);
    return 0;
  }

  return data?.weekly_xp ?? 0;
}
