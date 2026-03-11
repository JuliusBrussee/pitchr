import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { startPortalSession } from '@/services/billingService';
import { buildBillingRedirectUrl } from '@/lib/billing/redirect';

/**
 * POST /api/billing/portal
 * Creates a Stripe Billing Portal session and returns the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const origin = request.headers.get('origin');
    const admin = createAdminClient();

    const result = await startPortalSession(
      admin,
      user.id,
      buildBillingRedirectUrl({ origin }, '/settings'),
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('No Stripe customer')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[billing/portal] error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    );
  }
}
