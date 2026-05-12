import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrCreateUserStats } from '@/models/userStats';

/* ——————————————————————————————————————————————————————————
 * GET /api/arena/stats
 *
 * Returns the authenticated user's Arena stats (XP, streak,
 * league tier, badges, etc.). Creates a default stats row
 * if the user has none yet.
 * —————————————————————————————————————————————————————————— */

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const stats = await getOrCreateUserStats(admin, user.id);

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[arena/stats] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arena stats' },
      { status: 500 },
    );
  }
}
