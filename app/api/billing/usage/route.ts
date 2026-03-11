import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUsageLimit, getQaBudget } from '@/services/billingService';

/**
 * GET /api/billing/usage?resource=runs
 * Checks current usage against plan limits for a specific resource.
 * For qa_seconds, returns real seconds (not credit counts) via getQaBudget.
 */
export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    const url = new URL(request.url);
    const resource = url.searchParams.get('resource');

    if (
      resource !== 'runs' &&
      resource !== 'decks' &&
      resource !== 'qa_seconds' &&
      resource !== 'deck_generation'
    ) {
      return NextResponse.json(
        { error: 'Invalid resource. Must be "runs", "decks", "qa_seconds", or "deck_generation".' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // For qa_seconds, use getQaBudget which returns actual seconds instead of
    // credit counts that checkUsageLimit may return for credit-based users.
    if (resource === 'qa_seconds') {
      const budget = await getQaBudget(admin, user.id);
      return NextResponse.json({
        allowed: budget.budgetSeconds === null || (budget.remainingSeconds ?? Infinity) > 0,
        resource,
        used: budget.usedSeconds,
        limit: budget.budgetSeconds,
        remaining: budget.remainingSeconds,
        planId: budget.planId,
      });
    }

    const result = await checkUsageLimit(admin, user.id, resource);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 },
    );
  }
}
