import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BillingPlanId,
  CreditBalance,
  CreditCheckResult,
  CreditPack,
  CreditResource,
  CreditTransaction,
} from '@/types/billing';
import { getCreditCost, MONTHLY_CREDITS } from '@/config/billing';

/* ——————————————————————————————————————————————————————————
 * Credit Service
 *
 * Handles credit balance CRUD, consumption, refunds, and
 * pack management. All DB access goes through the Supabase
 * client passed in (admin client recommended to bypass RLS).
 * —————————————————————————————————————————————————————————— */

/* ——— Balance ——— */

export async function getCreditBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapCreditBalanceRow(data);
}

export async function getOrCreateCreditBalance(
  supabase: SupabaseClient,
  userId: string,
  planId: BillingPlanId = 'free',
): Promise<CreditBalance> {
  const existing = await getCreditBalance(supabase, userId);
  if (existing) return existing;

  let monthlyLimit = MONTHLY_CREDITS[planId];

  // Check if this user previously deleted their account (anti-abuse)
  // Requires service-role client for admin.getUserById
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.warn('[credits] Could not verify user email for tombstone check:', userError.message);
  }
  if (userData?.user?.email) {
    const { data: tombstone } = await supabase
      .from('deleted_emails')
      .select('id')
      .eq('email', userData.user.email.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (tombstone) {
      monthlyLimit = 0;
    }
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('credit_balances')
    .insert({
      user_id: userId,
      monthly_credits: monthlyLimit,
      monthly_credits_limit: monthlyLimit,
      purchased_credits: 0,
      bonus_credits: 0,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create credit balance: ${error?.message}`);
  }

  return mapCreditBalanceRow(data);
}

/* ——— Credit Checks ——— */

export async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  resource: CreditResource,
): Promise<CreditCheckResult> {
  const balance = await getCreditBalance(supabase, userId);
  const cost = getCreditCost(resource);

  if (!balance) {
    return {
      allowed: false,
      creditsRequired: cost,
      totalAvailable: 0,
      monthlyCredits: 0,
      purchasedCredits: 0,
      bonusCredits: 0,
    };
  }

  const effectiveBonus = getEffectiveBonus(balance);
  const totalAvailable = balance.monthlyCredits + balance.purchasedCredits + effectiveBonus;

  return {
    allowed: totalAvailable >= cost,
    creditsRequired: cost,
    totalAvailable,
    monthlyCredits: balance.monthlyCredits,
    purchasedCredits: balance.purchasedCredits,
    bonusCredits: effectiveBonus,
  };
}

/* ——— Credit Consumption ——— */

export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  resource: CreditResource,
  referenceId?: string,
): Promise<{ success: boolean; balanceAfter: number }> {
  const cost = getCreditCost(resource);

  const { data, error } = await supabase.rpc('consume_credits', {
    p_user_id: userId,
    p_amount: cost,
    p_source: resource,
    p_reference_id: referenceId ?? null,
    p_description: `${resource} consumption`,
  });

  if (error) {
    console.error('[credits] consume_credits RPC failed:', error.message);
    throw new Error(`Failed to consume credits: ${error.message}`);
  }

  const result = data as number;
  return {
    success: result >= 0,
    balanceAfter: result,
  };
}

/* ——— Refunds ——— */

export async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  resource: CreditResource,
  referenceId?: string,
): Promise<{ balanceAfter: number }> {
  const cost = getCreditCost(resource);

  const { data, error } = await supabase.rpc('refund_credits', {
    p_user_id: userId,
    p_amount: cost,
    p_source: `${resource}_refund`,
    p_reference_id: referenceId ?? null,
    p_description: `Refund for failed ${resource}`,
  });

  if (error) {
    console.error('[credits] refund_credits RPC failed:', error.message);
    throw new Error(`Failed to refund credits: ${error.message}`);
  }

  return { balanceAfter: data as number };
}

/* ——— Purchased Credits ——— */

export async function addPurchasedCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  stripePaymentId: string,
  packName: string,
): Promise<{ balanceAfter: number }> {
  const { data, error } = await supabase.rpc('add_purchased_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_source: `credit_pack_${packName}`,
    p_reference_id: stripePaymentId,
    p_description: `Purchased ${amount} credits (${packName} pack)`,
  });

  if (error) {
    console.error('[credits] add_purchased_credits RPC failed:', error.message);
    throw new Error(`Failed to add purchased credits: ${error.message}`);
  }

  return { balanceAfter: data as number };
}

/* ——— Monthly Reset ——— */

export async function resetMonthlyCredits(
  supabase: SupabaseClient,
  userId: string,
  monthlyLimit: number,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  const { error } = await supabase.rpc('reset_monthly_credits', {
    p_user_id: userId,
    p_monthly_limit: monthlyLimit,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });

  if (error) {
    console.error('[credits] reset_monthly_credits RPC failed:', error.message);
    throw new Error(`Failed to reset monthly credits: ${error.message}`);
  }
}

/* ——— Transaction History ——— */

export async function getTransactionHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
  offset = 0,
): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[credits] getTransactionHistory failed:', error.message);
    return [];
  }

  return (data ?? []).map(mapCreditTransactionRow);
}

/* ——— Credit Packs ——— */

export async function getCreditPacks(
  supabase: SupabaseClient,
): Promise<CreditPack[]> {
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[credits] getCreditPacks failed:', error.message);
    return [];
  }

  return (data ?? []).map(mapCreditPackRow);
}

export async function getCreditPackBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<CreditPack | null> {
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return mapCreditPackRow(data);
}

/* ——— Feature Access ——— */

export async function hasPurchasedCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const balance = await getCreditBalance(supabase, userId);
  if (!balance) return false;
  return balance.purchasedCredits > 0;
}

/* ——— Row Mappers ——— */

function getEffectiveBonus(balance: CreditBalance): number {
  if (balance.bonusCredits <= 0) return 0;
  if (balance.bonusCreditsExpiresAt && new Date(balance.bonusCreditsExpiresAt) <= new Date()) return 0;
  return balance.bonusCredits;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreditBalanceRow(row: any): CreditBalance {
  const monthly = row.monthly_credits ?? 0;
  const purchased = row.purchased_credits ?? 0;
  const bonus = row.bonus_credits ?? 0;
  const bonusExpiry = row.bonus_credits_expires_at ?? null;
  const effectiveBonus =
    bonus > 0 && (!bonusExpiry || new Date(bonusExpiry) > new Date()) ? bonus : 0;

  return {
    userId: row.user_id,
    monthlyCredits: monthly,
    monthlyCreditsLimit: row.monthly_credits_limit ?? 0,
    purchasedCredits: purchased,
    bonusCredits: bonus,
    bonusCreditsExpiresAt: bonusExpiry,
    totalAvailable: monthly + purchased + effectiveBonus,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreditTransactionRow(row: any): CreditTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    creditType: row.credit_type,
    source: row.source,
    referenceId: row.reference_id ?? null,
    description: row.description ?? null,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreditPackRow(row: any): CreditPack {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    credits: row.credits,
    priceUsd: Number(row.price_usd),
    stripePriceId: row.stripe_price_id ?? null,
    active: row.active,
    sortOrder: row.sort_order,
  };
}
