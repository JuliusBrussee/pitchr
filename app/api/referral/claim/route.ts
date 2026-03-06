import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { lookupReferralCode, createReferral } from '@/services/referralService';

/* ——————————————————————————————————————————————————————————
 * POST /api/referral/claim — Link a referral code to the
 * authenticated user. Called during onboarding after signup.
 * —————————————————————————————————————————————————————————— */

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const referralCode = await lookupReferralCode(admin, code);
    if (!referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referral = await createReferral(
      admin,
      referralCode.id,
      referralCode.userId,
      user.id,
    );

    if (!referral) {
      // Either self-referral or already referred — both are non-errors
      return NextResponse.json({ claimed: false, reason: 'already_referred_or_self' });
    }

    return NextResponse.json({ claimed: true, referralId: referral.id });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[referral] claim error:', error);
    return NextResponse.json({ error: 'Failed to claim referral' }, { status: 500 });
  }
}
