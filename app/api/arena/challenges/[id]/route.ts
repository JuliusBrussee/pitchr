import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getChallengeById,
  getChallengeLeaderboard,
} from '@/services/challengeService';

/* ——————————————————————————————————————————————————————————
 * GET /api/arena/challenges/[id]
 *
 * Returns challenge details, leaderboard (top 50), the
 * authenticated user's submission, and user's rank.
 * —————————————————————————————————————————————————————————— */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    // Fetch challenge with scenario
    const challenge = await getChallengeById(admin, id);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 },
      );
    }

    // Fetch leaderboard (top 50)
    const leaderboard = await getChallengeLeaderboard(admin, id, 50);

    // Fetch user's submission for this challenge
    let userSubmission = null;
    let userRank: number | null = null;

    const { data: submission, error: subError } = await admin
      .from('challenge_submissions')
      .select('id, challenge_id, user_id, run_id, base_score, bonus_score, total_score, rank, xp_earned, submitted_at')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('[arena/challenges/[id]] fetch user submission error:', subError.message);
      // Non-fatal — continue without submission data
    } else {
      userSubmission = submission;
    }

    // Calculate user's rank if they have a submission
    if (userSubmission) {
      const { count, error: rankError } = await admin
        .from('challenge_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', id)
        .gt('total_score', userSubmission.total_score);

      if (rankError) {
        console.error('[arena/challenges/[id]] rank query error:', rankError.message);
      } else {
        userRank = (count ?? 0) + 1;
      }
    }

    return NextResponse.json({
      challenge,
      leaderboard,
      userSubmission,
      userRank,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/challenges/[id]] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge details' },
      { status: 500 },
    );
  }
}
