-- Referral System Migration
-- Adds referral_codes, referrals tables, and RPC functions
-- for tracking referrals and granting bonus credits.

/* ——— Referral Codes ——— */

CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);

/* ——— Referrals ——— */

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

/* ——— RPC: add_bonus_credits ——— */
-- Upserts credit_balances bonus pool and logs to credit_transactions.
-- Uses GREATEST() to extend expiry if new expiry is later.

CREATE OR REPLACE FUNCTION add_bonus_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_expires_at TIMESTAMPTZ,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_after INTEGER;
BEGIN
  INSERT INTO credit_balances (user_id, bonus_credits, bonus_credits_expires_at)
  VALUES (p_user_id, p_amount, p_expires_at)
  ON CONFLICT (user_id) DO UPDATE SET
    bonus_credits = credit_balances.bonus_credits + p_amount,
    bonus_credits_expires_at = GREATEST(credit_balances.bonus_credits_expires_at, p_expires_at),
    updated_at = now();

  SELECT (monthly_credits + purchased_credits + CASE
    WHEN bonus_credits > 0 AND (bonus_credits_expires_at IS NULL OR bonus_credits_expires_at > now())
    THEN bonus_credits ELSE 0 END)
  INTO v_total_after
  FROM credit_balances
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
  VALUES (p_user_id, p_amount, v_total_after, 'bonus', p_source, p_reference_id, p_description);

  RETURN v_total_after;
END;
$$;

/* ——— RPC: claim_referral_reward ——— */
-- Atomically: checks cap, updates referral status to 'rewarded',
-- grants bonus credits to both referrer and referred user.

CREATE OR REPLACE FUNCTION claim_referral_reward(
  p_referral_id UUID,
  p_referrer_credits INTEGER,
  p_referred_credits INTEGER,
  p_expires_at TIMESTAMPTZ,
  p_max_rewards INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_rewarded_count INTEGER;
BEGIN
  -- Lock the referral row
  SELECT * INTO v_referral
  FROM referrals
  WHERE id = p_referral_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Must be in 'completed' status to claim
  IF v_referral.status != 'completed' THEN
    RETURN FALSE;
  END IF;

  -- Check referrer's reward cap
  SELECT COUNT(*) INTO v_rewarded_count
  FROM referrals
  WHERE referrer_id = v_referral.referrer_id
    AND status = 'rewarded';

  IF v_rewarded_count >= p_max_rewards THEN
    -- Still mark as rewarded but only grant to referred user
    UPDATE referrals SET
      status = 'rewarded',
      rewarded_at = now()
    WHERE id = p_referral_id;

    -- Grant credits to referred user only
    PERFORM add_bonus_credits(
      v_referral.referred_id,
      p_referred_credits,
      p_expires_at,
      'referral_referred',
      p_referral_id::TEXT,
      'Bonus credits for signing up via referral'
    );

    RETURN TRUE;
  END IF;

  -- Update referral status
  UPDATE referrals SET
    status = 'rewarded',
    rewarded_at = now()
  WHERE id = p_referral_id;

  -- Grant credits to referrer
  PERFORM add_bonus_credits(
    v_referral.referrer_id,
    p_referrer_credits,
    p_expires_at,
    'referral_referrer',
    p_referral_id::TEXT,
    'Bonus credits for successful referral'
  );

  -- Grant credits to referred user
  PERFORM add_bonus_credits(
    v_referral.referred_id,
    p_referred_credits,
    p_expires_at,
    'referral_referred',
    p_referral_id::TEXT,
    'Bonus credits for signing up via referral'
  );

  RETURN TRUE;
END;
$$;

/* ——— RLS Policies ——— */

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY referral_codes_select ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read referrals where they are the referrer
CREATE POLICY referrals_select_referrer ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Users can read referrals where they are the referred
CREATE POLICY referrals_select_referred ON referrals
  FOR SELECT USING (auth.uid() = referred_id);
