import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitChallenge } from '@/services/challengeService';
import { ARENA_PLAN_LIMITS } from '@/config/arena';
import { getActiveDayPass, getOrCreateSubscription } from '@/services/billingService';
import type { SupabaseClient } from '@supabase/supabase-js';

/* ——————————————————————————————————————————————————————————
 * POST /api/arena/challenges/[id]/submit
 *
 * Submits a pitch run as a challenge entry. Validates the
 * user's plan allows challenge submissions and enforces
 * per-challenge submission limits.
 *
 * Body: { runId: string }
 * —————————————————————————————————————————————————————————— */

/* ——— Plan helpers ——— */

type PlanId = 'free' | 'day_pass' | 'pro';

async function getUserPlanId(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanId> {
  const dayPass = await getActiveDayPass(supabase, userId);
  if (dayPass) return 'day_pass';

  const subscription = await getOrCreateSubscription(supabase, userId);
  return (subscription.planId as PlanId) ?? 'free';
}

async function checkChallengeSubmissionLimit(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  planId: PlanId,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limits = ARENA_PLAN_LIMITS[planId];
  const limit = limits.challengeSubmissions;

  // Free users: 0 submissions (blocked entirely)
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

  // Pro users: unlimited (-1)
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  // Day pass: 1 per challenge — check existing submissions
  const { count, error } = await supabase
    .from('challenge_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);

  if (error) {
    console.error('[arena/challenges/submit] count submissions error:', error.message);
    throw new Error(`Failed to check submission limit: ${error.message}`);
  }

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

/* ——— POST ——— */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    // Parse and validate body
    const body = await request.json();
    const { runId } = body as { runId?: string };

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing required field: runId' },
        { status: 400 },
      );
    }

    // Check plan-based submission limits
    const planId = await getUserPlanId(admin, user.id);
    const { allowed, used, limit } = await checkChallengeSubmissionLimit(
      admin,
      user.id,
      id,
      planId,
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Upgrade to submit challenges',
          upgrade: true,
          used,
          limit,
          plan: planId,
        },
        { status: 403 },
      );
    }

    // Submit the challenge entry
    const submission = await submitChallenge(admin, user.id, id, runId);

    return NextResponse.json(submission);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Run not found or does not belong')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('Challenge is not active')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'You already submitted to this challenge' }, { status: 409 });
    }
    console.error('[arena/challenges/submit] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to submit challenge entry' },
      { status: 500 },
    );
  }
}
