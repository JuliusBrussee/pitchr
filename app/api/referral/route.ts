import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getOrCreateReferralCode,
  getReferralStats,
  getReferralHistory,
} from '@/services/referralService';

/* ——————————————————————————————————————————————————————————
 * GET /api/referral — Returns referral code, link, stats, history
 * —————————————————————————————————————————————————————————— */

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const [code, stats, history] = await Promise.all([
      getOrCreateReferralCode(admin, user.id),
      getReferralStats(admin, user.id),
      getReferralHistory(admin, user.id),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchr.live';
    const referralLink = `${baseUrl}/?ref=${code.code}`;

    return NextResponse.json({
      code: code.code,
      referralLink,
      stats,
      history,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[referral] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}
