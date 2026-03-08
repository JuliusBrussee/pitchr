import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSubscription } from '@/services/billingService';
import {
  cancelSubscription,
  resumeSubscription,
} from '@/services/stripeService';

/**
 * POST /api/billing/cancel
 * Cancel subscription at period end (sets cancel_at_period_end: true).
 */
export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const sub = await getSubscription(admin, user.id);
    if (!sub?.stripeSubscriptionId || sub.status !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      );
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is already set to cancel' },
        { status: 400 },
      );
    }

    await cancelSubscription(sub.stripeSubscriptionId);

    // Update local record
    const { error: updateError } = await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[billing/cancel] DB update failed after Stripe cancel:', updateError.message);
      return NextResponse.json(
        { error: 'Subscription canceled in Stripe but local update failed. Please refresh.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[billing/cancel] error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/billing/cancel
 * Resume/undo cancellation (sets cancel_at_period_end: false).
 */
export async function DELETE() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const sub = await getSubscription(admin, user.id);
    if (!sub?.stripeSubscriptionId || sub.status !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      );
    }

    if (!sub.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not set to cancel' },
        { status: 400 },
      );
    }

    await resumeSubscription(sub.stripeSubscriptionId);

    // Update local record
    const { error: updateError } = await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[billing/cancel] DB update failed after Stripe resume:', updateError.message);
      return NextResponse.json(
        { error: 'Subscription resumed in Stripe but local update failed. Please refresh.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[billing/cancel] error:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 },
    );
  }
}
