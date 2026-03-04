import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { activateNextChallenge } from '@/services/challengeService';
import { processWeekEnd, createNewWeekLeagues } from '@/services/leagueService';
import { getIsoWeekInfo, getPreviousIsoWeek } from '@/lib/iso-week';

/* ——————————————————————————————————————————————————————————
 * POST /api/arena/cron/weekly
 *
 * Vercel Cron handler — runs every Monday 00:00 UTC.
 * Transitions challenges: completes current active challenge
 * (with rank calculation + winner badge) and activates the
 * next upcoming challenge.
 *
 * Protected by CRON_SECRET bearer token.
 * —————————————————————————————————————————————————————————— */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[arena/cron/weekly] CRON_SECRET is not configured');
      return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Transition challenges: complete current, activate next
    const newChallenge = await activateNextChallenge(admin);

    // 2. Process the previous week (calculate rankings, promotions/demotions)
    const currentWeek = getIsoWeekInfo();
    const previousWeek = getPreviousIsoWeek(currentWeek.weekNumber, currentWeek.year);
    await processWeekEnd(admin, previousWeek);

    // 3. Create new week leagues (matchmaking + new league/membership rows)
    await createNewWeekLeagues(admin, currentWeek.weekNumber, currentWeek.year);

    return NextResponse.json({
      success: true,
      newChallenge: newChallenge ? { id: newChallenge.id, title: newChallenge.title } : null,
      leagueProcessed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[arena/cron/weekly] error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
