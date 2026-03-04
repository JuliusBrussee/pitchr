import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserLeague } from '@/services/leagueService';
import { getLeaderboard } from '@/models/userStats';
import { getChallengeLeaderboard } from '@/services/challengeService';

/* ——————————————————————————————————————————————————————————
 * GET /api/arena/leaderboard?type=league|alltime|challenge
 *
 * Unified leaderboard endpoint. The `type` query parameter
 * determines the data source:
 *
 *   league     — Current-week league with ranked memberships
 *                (null if user is not in a league)
 *   alltime    — Global user stats ranked by sort column
 *   challenge  — Challenge submissions ranked by total_score
 * —————————————————————————————————————————————————————————— */

const VALID_SORT_COLUMNS = ['total_xp', 'highest_score', 'challenge_wins'] as const;
type SortColumn = (typeof VALID_SORT_COLUMNS)[number];

function isValidSortColumn(value: string): value is SortColumn {
  return (VALID_SORT_COLUMNS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['league', 'alltime', 'challenge'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Must be one of: league, alltime, challenge' },
        { status: 400 },
      );
    }

    /* ——— League leaderboard ——— */
    if (type === 'league') {
      const league = await getUserLeague(admin, user.id);

      // null = user not in a league (e.g. free tier)
      return NextResponse.json({ league });
    }

    /* ——— All-time leaderboard ——— */
    if (type === 'alltime') {
      const sortParam = searchParams.get('sort') ?? 'total_xp';
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;

      if (!isValidSortColumn(sortParam)) {
        return NextResponse.json(
          { error: `Invalid sort parameter. Must be one of: ${VALID_SORT_COLUMNS.join(', ')}` },
          { status: 400 },
        );
      }

      const leaderboard = await getLeaderboard(admin, sortParam, limit);

      return NextResponse.json({ leaderboard });
    }

    /* ——— Challenge leaderboard ——— */
    if (type === 'challenge') {
      const challengeId = searchParams.get('challengeId');

      if (!challengeId) {
        return NextResponse.json(
          { error: 'Missing required challengeId parameter for challenge leaderboard' },
          { status: 400 },
        );
      }

      const limitParam = searchParams.get('limit');
      const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;

      const submissions = await getChallengeLeaderboard(admin, challengeId, limit);

      return NextResponse.json({ submissions });
    }

    // Unreachable — the type check above catches invalid values
    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/leaderboard] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 },
    );
  }
}
