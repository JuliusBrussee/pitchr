import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveChallenge } from '@/services/challengeService';

/* ——————————————————————————————————————————————————————————
 * GET /api/arena/challenges
 *
 * Returns the currently active challenge (if any) along with
 * the authenticated user's submission for that challenge.
 * —————————————————————————————————————————————————————————— */

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    // Fetch the active challenge (with scenario)
    const challenge = await getActiveChallenge(admin);

    // If there is an active challenge, check for user's existing submission
    let userSubmission = null;

    if (challenge) {
      const { data, error } = await admin
        .from('challenge_submissions')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[arena/challenges] fetch user submission error:', error.message);
        // Non-fatal — continue without submission data
      } else {
        userSubmission = data;
      }
    }

    return NextResponse.json({ challenge, userSubmission });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/challenges] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active challenge' },
      { status: 500 },
    );
  }
}
