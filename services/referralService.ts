import type { SupabaseClient } from '@supabase/supabase-js';
import {
  REFERRER_REWARD_CREDITS,
  REFERRED_REWARD_CREDITS,
  REFERRAL_BONUS_EXPIRY_DAYS,
  MAX_REFERRAL_REWARDS,
  REFERRAL_CODE_LENGTH,
  REFERRAL_CODE_CHARS,
} from '@/config/referral';

/* ——————————————————————————————————————————————————————————
 * Referral Service
 *
 * Handles referral code generation, linking, reward claims,
 * and stats. All DB access goes through the Supabase client
 * passed in (admin client recommended to bypass RLS).
 * —————————————————————————————————————————————————————————— */

/* ——— Types ——— */

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referralCodeId: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'completed' | 'rewarded';
  createdAt: string;
  completedAt: string | null;
  rewardedAt: string | null;
}

export interface ReferralStats {
  totalReferred: number;
  pending: number;
  completed: number;
  rewarded: number;
  creditsEarned: number;
  remainingRewards: number;
}

/* ——— Code Generation ——— */

function generateCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_CHARS[Math.floor(Math.random() * REFERRAL_CODE_CHARS.length)];
  }
  return code;
}

/* ——— Referral Code CRUD ——— */

export async function getOrCreateReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralCode> {
  // Check for existing code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return mapReferralCodeRow(existing);

  // Generate with retry for uniqueness
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select()
      .single();

    if (data) return mapReferralCodeRow(data);
    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to create referral code: ${error.message}`);
    }
  }

  throw new Error('Failed to generate unique referral code after retries');
}

export async function lookupReferralCode(
  supabase: SupabaseClient,
  code: string,
): Promise<ReferralCode | null> {
  const { data } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single();

  return data ? mapReferralCodeRow(data) : null;
}

/* ——— Referral Linking ——— */

export async function createReferral(
  supabase: SupabaseClient,
  codeId: string,
  referrerId: string,
  referredId: string,
): Promise<Referral | null> {
  // Can't refer yourself
  if (referrerId === referredId) return null;

  // Check if already referred
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', referredId)
    .single();

  if (existing) return null;

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referral_code_id: codeId,
      referrer_id: referrerId,
      referred_id: referredId,
    })
    .select()
    .single();

  if (error) {
    console.error('[referral] createReferral failed:', error.message);
    return null;
  }

  return data ? mapReferralRow(data) : null;
}

/* ——— Reward Flow ——— */

export async function markReferralCompleted(
  supabase: SupabaseClient,
  referredUserId: string,
): Promise<void> {
  // Find pending referral for this user
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .single();

  if (!referral) return;

  // Update to completed
  const { error: updateError } = await supabase
    .from('referrals')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', referral.id);

  if (updateError) {
    console.error('[referral] markReferralCompleted failed:', updateError.message);
    return;
  }

  // Auto-claim reward
  await claimReferralReward(supabase, referral.id);
}

export async function claimReferralReward(
  supabase: SupabaseClient,
  referralId: string,
): Promise<boolean> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFERRAL_BONUS_EXPIRY_DAYS);

  const { data, error } = await supabase.rpc('claim_referral_reward', {
    p_referral_id: referralId,
    p_referrer_credits: REFERRER_REWARD_CREDITS,
    p_referred_credits: REFERRED_REWARD_CREDITS,
    p_expires_at: expiresAt.toISOString(),
    p_max_rewards: MAX_REFERRAL_REWARDS,
  });

  if (error) {
    console.error('[referral] claimReferralReward RPC failed:', error.message);
    return false;
  }

  return data as boolean;
}

/* ——— Stats & History ——— */

export async function getReferralStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralStats> {
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', userId);

  const all = referrals ?? [];
  const pending = all.filter((r) => r.status === 'pending').length;
  const completed = all.filter((r) => r.status === 'completed').length;
  const rewarded = all.filter((r) => r.status === 'rewarded').length;

  return {
    totalReferred: all.length,
    pending,
    completed,
    rewarded,
    creditsEarned: rewarded * REFERRER_REWARD_CREDITS,
    remainingRewards: Math.max(0, MAX_REFERRAL_REWARDS - rewarded),
  };
}

export async function getReferralHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[referral] getReferralHistory failed:', error.message);
    return [];
  }

  return (data ?? []).map(mapReferralRow);
}

/* ——— Row Mappers ——— */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReferralCodeRow(row: any): ReferralCode {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReferralRow(row: any): Referral {
  return {
    id: row.id,
    referralCodeId: row.referral_code_id,
    referrerId: row.referrer_id,
    referredId: row.referred_id,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
    rewardedAt: row.rewarded_at ?? null,
  };
}
