import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSubscription } from '@/services/billingService';
import { deleteCustomer } from '@/services/stripeService';

/**
 * DELETE /api/account
 * Permanently deletes the authenticated user's account.
 * Requires password re-authentication and email confirmation phrase.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email associated with this account.' },
        { status: 400 },
      );
    }

    // Verify confirmation phrase matches
    if (email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account email.' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Check for active paid subscription
    const subscription = await getSubscription(admin, user.id);
    if (subscription && subscription.planId !== 'free' && subscription.status === 'active') {
      return NextResponse.json(
        { error: 'Cancel your subscription before deleting your account.' },
        { status: 400 },
      );
    }

    // Re-authenticate with password to verify identity
    const { error: signInError } = await admin.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 401 },
      );
    }

    // --- Begin deletion ---

    const stripeCustomerId = subscription?.stripeCustomerId ?? null;
    const hadPaidPlan = subscription ? subscription.planId !== 'free' : false;

    // Clean up storage buckets
    for (const bucket of ['decks', 'recordings']) {
      const { data: files } = await admin.storage
        .from(bucket)
        .list(user.id);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await admin.storage.from(bucket).remove(paths);
      }
    }

    // Insert tombstone record
    await admin.from('deleted_emails').insert({
      email: userEmail.toLowerCase(),
      stripe_customer_id: stripeCustomerId,
      had_paid_plan: hadPaidPlan,
    });

    // Delete Stripe customer if exists
    if (stripeCustomerId) {
      try {
        await deleteCustomer(stripeCustomerId);
      } catch {
        // Non-blocking — Stripe cleanup is best-effort
        console.warn('[account] Failed to delete Stripe customer:', stripeCustomerId);
      }
    }

    // Delete user from Supabase Auth (cascades all DB data)
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    console.error('[account] Delete failed:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
