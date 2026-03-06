import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

/* ——————————————————————————————————————————————————————————
 * Referral Service (Edge Function variant)
 *
 * Lightweight referral completion trigger for Supabase Edge
 * Functions. Mirrors the logic in services/referralService.ts
 * but uses the Deno runtime.
 * —————————————————————————————————————————————————————————— */

/** Must stay in sync with config/referral.ts */
const REFERRER_REWARD_CREDITS = 3;
const REFERRED_REWARD_CREDITS = 3;
const REFERRAL_BONUS_EXPIRY_DAYS = 90;
const MAX_REFERRAL_REWARDS = 10;

/**
 * Check if this is the user's first completed run, and if so,
 * trigger referral completion + reward.
 */
export async function tryCompleteReferral(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Check if user has a pending referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, status')
    .eq('referred_id', userId)
    .eq('status', 'pending')
    .single();

  if (!referral) return;

  // Check if this is their first completed run
  const { count } = await supabase
    .from('pitch_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'complete');

  // Only trigger on first completed run (count will be 1 since the current run just completed)
  if ((count ?? 0) > 1) return;

  // Update to completed
  const { error: updateError } = await supabase
    .from('referrals')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', referral.id);

  if (updateError) {
    console.error('[referral] markReferralCompleted failed:', updateError.message);
    return;
  }

  // Claim reward via RPC
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFERRAL_BONUS_EXPIRY_DAYS);

  const { error: rewardError } = await supabase.rpc('claim_referral_reward', {
    p_referral_id: referral.id,
    p_referrer_credits: REFERRER_REWARD_CREDITS,
    p_referred_credits: REFERRED_REWARD_CREDITS,
    p_expires_at: expiresAt.toISOString(),
    p_max_rewards: MAX_REFERRAL_REWARDS,
  });

  if (rewardError) {
    console.error('[referral] claim_referral_reward RPC failed:', rewardError.message);
  } else {
    console.log('[referral] reward claimed for referral', referral.id);
  }
}
