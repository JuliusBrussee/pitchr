import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Challenge,
  ChallengeSubmission,
  ChallengeRow,
  ChallengeSubmissionRow,
  Scenario,
  ScenarioRow,
} from '@/types/arena';
import {
  mapChallengeRow,
  mapChallengeSubmissionRow,
  mapScenarioRow,
} from '@/types/arena';
import { calculateChallengeXp, awardXp } from '@/services/xpService';
import { calculateChallengeBonus } from '@/services/challengeBonusService';
import { updateUserStats, awardBadge } from '@/models/userStats';
import { BADGES } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * Challenge Service
 *
 * Manages weekly challenges: fetching active/upcoming challenges,
 * submitting entries, leaderboard queries, and challenge lifecycle
 * (activation, completion, rank calculation).
 * —————————————————————————————————————————————————————————— */

/* ——— Helpers ——— */

interface ChallengeWithScenarioRow extends ChallengeRow {
  scenarios: ScenarioRow;
}

function mapChallengeWithScenario(
  row: ChallengeWithScenarioRow,
): Challenge & { scenario: Scenario } {
  return {
    ...mapChallengeRow(row),
    scenario: mapScenarioRow(row.scenarios),
  };
}

/* ——— Get Active Challenge ——— */

export async function getActiveChallenge(
  supabase: SupabaseClient,
): Promise<(Challenge & { scenario: Scenario }) | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('challenges')
    .select('*, scenarios(*)')
    .eq('status', 'active')
    .lte('starts_at', now)
    .gte('ends_at', now)
    .maybeSingle();

  if (error) {
    console.error('[challenges] getActiveChallenge failed:', error.message);
    throw new Error(`Failed to get active challenge: ${error.message}`);
  }

  if (!data) return null;

  return mapChallengeWithScenario(data as ChallengeWithScenarioRow);
}

/* ——— Get Challenge By ID ——— */

export async function getChallengeById(
  supabase: SupabaseClient,
  id: string,
): Promise<(Challenge & { scenario: Scenario }) | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*, scenarios(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[challenges] getChallengeById failed:', error.message);
    throw new Error(`Failed to get challenge: ${error.message}`);
  }

  if (!data) return null;

  return mapChallengeWithScenario(data as ChallengeWithScenarioRow);
}

/* ——— Submit Challenge ——— */

export async function submitChallenge(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  runId: string,
): Promise<ChallengeSubmission> {
  // 1. Verify challenge is active
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*, scenarios(*)')
    .eq('id', challengeId)
    .eq('status', 'active')
    .single();

  if (challengeError || !challenge) {
    console.error('[challenges] challenge not active or not found:', challengeError?.message);
    throw new Error('Challenge is not active or does not exist');
  }

  // 2. Get run data (overall_score, transcript, meta for duration)
  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('overall_score, transcript, meta')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    console.error('[challenges] run not found:', runError?.message);
    throw new Error('Run not found');
  }

  const baseScore = run.overall_score ?? 0;
  const challengeWithScenario = challenge as ChallengeWithScenarioRow;
  const scenario = mapScenarioRow(challengeWithScenario.scenarios);

  // Extract pitch duration from run meta (delivery_metrics.duration_seconds)
  const meta = run.meta as { delivery_metrics?: { duration_seconds?: number } } | null;
  const pitchDurationSec = meta?.delivery_metrics?.duration_seconds ?? 0;

  // 3. Calculate bonus score
  const { bonusScore } = calculateChallengeBonus(
    run.transcript ?? '',
    scenario,
    pitchDurationSec,
    scenario.timeLimitSec,
  );

  // 4. Calculate total score
  const totalScore = baseScore + bonusScore;

  // 5. Insert submission (UNIQUE constraint prevents duplicates)
  const { data: submission, error: submitError } = await supabase
    .from('challenge_submissions')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      run_id: runId,
      base_score: baseScore,
      bonus_score: bonusScore,
      total_score: totalScore,
      xp_earned: 0, // Will be updated after XP calculation
    })
    .select()
    .single();

  if (submitError) {
    console.error('[challenges] submit failed:', submitError.message);
    throw new Error(`Failed to submit challenge: ${submitError.message}`);
  }

  // 6. Increment participant_count
  const { error: countError } = await supabase
    .rpc('increment_challenge_participants', { p_challenge_id: challengeId });

  if (countError) {
    // Non-fatal — log but don't throw
    console.error('[challenges] increment participant_count failed:', countError.message);
  }

  // 7. Calculate and award XP
  const xpAmount = calculateChallengeXp(baseScore, bonusScore);

  await awardXp(
    supabase,
    userId,
    'challenge_submit',
    xpAmount,
    `challenge_${challengeId}_${userId}`,
    { challengeId, runId, baseScore, bonusScore, totalScore },
  );

  // 8. Update xp_earned on the submission row
  const { error: xpUpdateError } = await supabase
    .from('challenge_submissions')
    .update({ xp_earned: xpAmount })
    .eq('id', submission.id);

  if (xpUpdateError) {
    console.error('[challenges] update xp_earned failed:', xpUpdateError.message);
  }

  // 9. Update user_stats.challenges_completed
  const { data: stats } = await supabase
    .from('user_stats')
    .select('challenges_completed')
    .eq('user_id', userId)
    .single();

  await updateUserStats(supabase, userId, {
    challengesCompleted: (stats?.challenges_completed ?? 0) + 1,
  });

  // 10. Return mapped submission with correct xp_earned
  return mapChallengeSubmissionRow({
    ...submission,
    xp_earned: xpAmount,
  } as ChallengeSubmissionRow);
}

/* ——— Get Challenge Leaderboard ——— */

export async function getChallengeLeaderboard(
  supabase: SupabaseClient,
  challengeId: string,
  limit = 50,
): Promise<ChallengeSubmission[]> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[challenges] getChallengeLeaderboard failed:', error.message);
    throw new Error(`Failed to get challenge leaderboard: ${error.message}`);
  }

  return (data as ChallengeSubmissionRow[] ?? []).map(mapChallengeSubmissionRow);
}

/* ——— Get User Challenge History ——— */

export async function getUserChallengeHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChallengeSubmission[]> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[challenges] getUserChallengeHistory failed:', error.message);
    throw new Error(`Failed to get user challenge history: ${error.message}`);
  }

  return (data as ChallengeSubmissionRow[] ?? []).map(mapChallengeSubmissionRow);
}

/* ——— Activate Next Challenge ——— */

export async function activateNextChallenge(
  supabase: SupabaseClient,
): Promise<Challenge | null> {
  // 1. Find current active challenge
  const { data: activeChallenge } = await supabase
    .from('challenges')
    .select('id')
    .eq('status', 'active')
    .maybeSingle();

  if (activeChallenge) {
    // 2. Complete the active challenge
    const { error: completeError } = await supabase
      .from('challenges')
      .update({ status: 'completed' })
      .eq('id', activeChallenge.id);

    if (completeError) {
      console.error('[challenges] complete active challenge failed:', completeError.message);
      throw new Error(`Failed to complete active challenge: ${completeError.message}`);
    }

    // 3. Calculate final ranks for all submissions
    const { data: submissions, error: subError } = await supabase
      .from('challenge_submissions')
      .select('id, total_score, user_id')
      .eq('challenge_id', activeChallenge.id)
      .order('total_score', { ascending: false });

    if (!subError && submissions && submissions.length > 0) {
      // Assign ranks based on total_score descending
      for (let i = 0; i < submissions.length; i++) {
        const rank = i + 1;
        await supabase
          .from('challenge_submissions')
          .update({ rank })
          .eq('id', submissions[i].id);
      }

      // 4. Award winner badge to #1
      const winnerId = submissions[0].user_id;
      const challengeChampionBadge = BADGES.find((b) => b.id === 'challenge_champion');

      if (challengeChampionBadge) {
        await awardBadge(supabase, winnerId, {
          id: challengeChampionBadge.id,
          name: challengeChampionBadge.name,
          description: challengeChampionBadge.description,
          rarity: challengeChampionBadge.rarity,
          earnedAt: new Date().toISOString(),
        });
      }

      // 5. Update winner's challenge_wins in user_stats
      const { data: winnerStats } = await supabase
        .from('user_stats')
        .select('challenge_wins')
        .eq('user_id', winnerId)
        .single();

      await updateUserStats(supabase, winnerId, {
        challengeWins: (winnerStats?.challenge_wins ?? 0) + 1,
      });
    }
  }

  // 6. Find next upcoming challenge and activate it
  const { data: nextChallenge, error: nextError } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'upcoming')
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextError) {
    console.error('[challenges] find next upcoming challenge failed:', nextError.message);
    throw new Error(`Failed to find next challenge: ${nextError.message}`);
  }

  if (!nextChallenge) return null;

  const { data: activated, error: activateError } = await supabase
    .from('challenges')
    .update({ status: 'active' })
    .eq('id', nextChallenge.id)
    .select()
    .single();

  if (activateError) {
    console.error('[challenges] activate next challenge failed:', activateError.message);
    throw new Error(`Failed to activate next challenge: ${activateError.message}`);
  }

  return mapChallengeRow(activated as ChallengeRow);
}

/* ——— Create Challenge ——— */

export interface CreateChallengeData {
  scenarioId: string;
  weekNumber: number;
  year: number;
  title: string;
  challengeType: string;
  bonusCriteria?: Record<string, unknown>;
  description?: string;
  startsAt: string;
  endsAt: string;
}

export async function createChallenge(
  supabase: SupabaseClient,
  data: CreateChallengeData,
): Promise<Challenge> {
  const { data: row, error } = await supabase
    .from('challenges')
    .insert({
      scenario_id: data.scenarioId,
      week_number: data.weekNumber,
      year: data.year,
      title: data.title,
      challenge_type: data.challengeType,
      bonus_criteria: data.bonusCriteria ?? null,
      description: data.description ?? null,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      status: 'upcoming',
      participant_count: 0,
    })
    .select()
    .single();

  if (error || !row) {
    console.error('[challenges] createChallenge failed:', error?.message ?? 'unknown error');
    throw new Error(`Failed to create challenge: ${error?.message ?? 'unknown error'}`);
  }

  return mapChallengeRow(row as ChallengeRow);
}
