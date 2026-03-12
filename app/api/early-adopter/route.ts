import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  EARLY_ADOPTER_CREDITS,
  EARLY_ADOPTER_SOURCE,
  EARLY_ADOPTER_EXPIRY,
  isEarlyAdopterPeriod,
  getEarlyAdopterDaysRemaining,
} from '@/config/early-adopter';

/* ——————————————————————————————————————————————————————————
 * GET /api/early-adopter — Check eligibility & claim status
 * —————————————————————————————————————————————————————————— */

export async function GET() {
  try {
    const isActive = isEarlyAdopterPeriod();

    if (!isActive) {
      return NextResponse.json({
        eligible: false,
        claimed: false,
        daysRemaining: 0,
        expiresAt: EARLY_ADOPTER_EXPIRY.toISOString(),
        isActive: false,
      });
    }

    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const { count } = await admin
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source', EARLY_ADOPTER_SOURCE);

    const claimed = (count ?? 0) > 0;

    return NextResponse.json({
      eligible: !claimed,
      claimed,
      daysRemaining: getEarlyAdopterDaysRemaining(),
      expiresAt: EARLY_ADOPTER_EXPIRY.toISOString(),
      isActive: true,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[early-adopter] GET error:', error);
    return NextResponse.json({ error: 'Failed to check early adopter status' }, { status: 500 });
  }
}

/* ——————————————————————————————————————————————————————————
 * POST /api/early-adopter — Claim early adopter credits
 * —————————————————————————————————————————————————————————— */

export async function POST() {
  try {
    if (!isEarlyAdopterPeriod()) {
      return NextResponse.json({ error: 'Early adopter period has ended' }, { status: 410 });
    }

    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    // Check if already claimed
    const { count } = await admin
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source', EARLY_ADOPTER_SOURCE);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 409 });
    }

    // Grant bonus credits via existing RPC
    const { error: rpcError } = await admin.rpc('add_bonus_credits', {
      p_user_id: user.id,
      p_amount: EARLY_ADOPTER_CREDITS,
      p_expires_at: EARLY_ADOPTER_EXPIRY.toISOString(),
      p_source: EARLY_ADOPTER_SOURCE,
      p_description: 'Early adopter bonus — welcome to Pitchr!',
    });

    if (rpcError) {
      console.error('[early-adopter] RPC error:', rpcError);
      return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      creditsGranted: EARLY_ADOPTER_CREDITS,
      expiresAt: EARLY_ADOPTER_EXPIRY.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[early-adopter] POST error:', error);
    return NextResponse.json({ error: 'Failed to claim early adopter credits' }, { status: 500 });
  }
}
