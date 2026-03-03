import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRandomScenario } from '@/services/scenarioService';
import { calculateGameModeXp, awardXp, checkAndAwardStreakXp } from '@/services/xpService';
import { getOrCreateUserStats, updateStreak, updateUserStats } from '@/models/userStats';
import { ARENA_PLAN_LIMITS, DIFFICULTY_SETTINGS } from '@/config/arena';
import type { Difficulty } from '@/config/arena';
import type { UserStats } from '@/types/arena';
import type { SupabaseClient } from '@supabase/supabase-js';

/* ——————————————————————————————————————————————————————————
 * GET  /api/arena/game-mode?difficulty=pro
 * POST /api/arena/game-mode
 *
 * GET  — Returns a random unseen scenario for the user,
 *        gated by plan-based usage limits.
 * POST — Submits a completed game-mode session, awards XP,
 *        updates streak and user stats.
 * —————————————————————————————————————————————————————————— */

/* ——— Plan helpers ——— */

type PlanId = 'free' | 'day_pass' | 'pro';

async function getUserPlanId(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanId> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!data) return 'free';
  return data.plan_id as PlanId;
}

async function checkGameModeLimit(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const now = new Date();

  if (planId === 'free') {
    // Free users: weekly limit (gameModePerWeek)
    const freeLimits = ARENA_PLAN_LIMITS.free;
    const weekLimit = freeLimits.gameModePerWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('game_mode_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', startOfWeek.toISOString());

    if (error) {
      console.error('[arena/game-mode] count sessions error:', error.message);
      throw new Error(`Failed to count sessions: ${error.message}`);
    }

    const used = count ?? 0;
    return { allowed: used < weekLimit, used, limit: weekLimit };
  }

  // Day pass and Pro: daily limit (gameModePerDay)
  const dayLimit = planId === 'day_pass'
    ? ARENA_PLAN_LIMITS.day_pass.gameModePerDay
    : ARENA_PLAN_LIMITS.pro.gameModePerDay;
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('game_mode_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', startOfDay.toISOString());

  if (error) {
    console.error('[arena/game-mode] count sessions error:', error.message);
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  const used = count ?? 0;
  return { allowed: used < dayLimit, used, limit: dayLimit };
}

/* ——— GET ——— */

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    // Parse difficulty from query params
    const { searchParams } = new URL(request.url);
    const difficultyParam = searchParams.get('difficulty') ?? 'starter';

    if (!(difficultyParam in DIFFICULTY_SETTINGS)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${Object.keys(DIFFICULTY_SETTINGS).join(', ')}` },
        { status: 400 },
      );
    }

    const difficulty = difficultyParam as Difficulty;

    // Check plan-based limits
    const planId = await getUserPlanId(admin, user.id);
    const { allowed, used, limit } = await checkGameModeLimit(admin, user.id, planId);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Game mode limit reached',
          upgrade: true,
          used,
          limit,
          plan: planId,
        },
        { status: 403 },
      );
    }

    // Fetch a random unseen scenario
    const scenario = await getRandomScenario(admin, user.id, difficulty);

    return NextResponse.json(scenario);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/game-mode] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game mode scenario' },
      { status: 500 },
    );
  }
}

/* ——— POST ——— */

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const body = await request.json();
    const { scenarioId, runId, difficulty } = body as {
      scenarioId?: string;
      runId?: string;
      difficulty?: string;
    };

    // Validate required fields
    if (!scenarioId || !runId || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: scenarioId, runId, difficulty' },
        { status: 400 },
      );
    }

    if (!(difficulty in DIFFICULTY_SETTINGS)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${Object.keys(DIFFICULTY_SETTINGS).join(', ')}` },
        { status: 400 },
      );
    }

    const diff = difficulty as Difficulty;

    // Get the run to extract the score
    const { data: run, error: runError } = await admin
      .from('runs')
      .select('overall_score')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Run not found or does not belong to this user' },
        { status: 404 },
      );
    }

    const score = run.overall_score ?? 0;

    // Calculate XP
    const xpEarned = calculateGameModeXp(score, diff);

    // Insert game_mode_sessions row
    const { error: sessionError } = await admin
      .from('game_mode_sessions')
      .insert({
        user_id: user.id,
        scenario_id: scenarioId,
        run_id: runId,
        difficulty: diff,
        score,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      });

    if (sessionError) {
      console.error('[arena/game-mode] insert session error:', sessionError.message);
      return NextResponse.json(
        { error: 'Failed to record game mode session' },
        { status: 500 },
      );
    }

    // Award XP
    const totalXp = await awardXp(
      admin,
      user.id,
      'game_mode',
      xpEarned,
      runId,
      { scenarioId, difficulty: diff, score },
    );

    // Update streak
    const streakResult = await updateStreak(admin, user.id);

    // Check for streak milestone XP
    let streakXp = 0;
    if (streakResult.isNewMilestone && streakResult.milestone) {
      streakXp = await checkAndAwardStreakXp(
        admin,
        user.id,
        streakResult.currentStreak,
      );
    }

    // Update user_stats: increment game_mode_completed, update highest_score
    const stats = await getOrCreateUserStats(admin, user.id);
    const updates: Partial<UserStats> = {
      gameModeCompleted: stats.gameModeCompleted + 1,
    };

    if (score > stats.highestScore) {
      updates.highestScore = score;
    }

    await updateUserStats(admin, user.id, updates);

    return NextResponse.json({
      score,
      xpEarned: xpEarned + streakXp,
      totalXp: totalXp + streakXp,
      streak: {
        current: streakResult.currentStreak,
        isNewMilestone: streakResult.isNewMilestone,
        milestone: streakResult.milestone,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/game-mode] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to submit game mode result' },
      { status: 500 },
    );
  }
}
