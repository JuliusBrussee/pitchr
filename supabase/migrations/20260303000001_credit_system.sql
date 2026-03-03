-- Credit System Migration
-- Adds credit_balances, credit_transactions, and credit_packs tables
-- plus atomic RPC functions for credit operations.

/* ——— Credit Balances ——— */

CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  monthly_credits_limit INTEGER NOT NULL DEFAULT 0,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits_expires_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_balances_user_id ON credit_balances(user_id);

/* ——— Credit Transactions (audit log) ——— */

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('monthly', 'purchased', 'bonus', 'refund', 'consumption')),
  source TEXT NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

/* ——— Credit Packs (product catalog) ——— */

CREATE TABLE credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/* ——— Seed Credit Packs ——— */

INSERT INTO credit_packs (name, slug, credits, price_usd, sort_order) VALUES
  ('Starter', 'starter', 5, 5.00, 1),
  ('Prep', 'prep', 15, 12.00, 2),
  ('Sprint', 'sprint', 30, 20.00, 3),
  ('Marathon', 'marathon', 60, 35.00, 4);

/* ——— RPC: consume_credits ——— */
-- Atomic credit deduction following priority: monthly -> purchased -> bonus
-- Returns the new total available credits, or -1 if insufficient.

CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance credit_balances%ROWTYPE;
  v_remaining INTEGER;
  v_from_monthly INTEGER := 0;
  v_from_purchased INTEGER := 0;
  v_from_bonus INTEGER := 0;
  v_total_after INTEGER;
  v_effective_bonus INTEGER;
BEGIN
  -- Lock the row for atomic update
  SELECT * INTO v_balance
  FROM credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Calculate effective bonus (exclude expired)
  v_effective_bonus := CASE
    WHEN v_balance.bonus_credits > 0
      AND (v_balance.bonus_credits_expires_at IS NULL OR v_balance.bonus_credits_expires_at > now())
    THEN v_balance.bonus_credits
    ELSE 0
  END;

  -- Check total available
  IF (v_balance.monthly_credits + v_balance.purchased_credits + v_effective_bonus) < p_amount THEN
    RETURN -1;
  END IF;

  -- Deduct in priority order: monthly -> purchased -> bonus
  v_remaining := p_amount;

  -- 1. Monthly credits first
  IF v_remaining > 0 AND v_balance.monthly_credits > 0 THEN
    v_from_monthly := LEAST(v_remaining, v_balance.monthly_credits);
    v_remaining := v_remaining - v_from_monthly;
  END IF;

  -- 2. Purchased credits
  IF v_remaining > 0 AND v_balance.purchased_credits > 0 THEN
    v_from_purchased := LEAST(v_remaining, v_balance.purchased_credits);
    v_remaining := v_remaining - v_from_purchased;
  END IF;

  -- 3. Bonus credits
  IF v_remaining > 0 AND v_effective_bonus > 0 THEN
    v_from_bonus := LEAST(v_remaining, v_effective_bonus);
    v_remaining := v_remaining - v_from_bonus;
  END IF;

  -- Update the balance
  UPDATE credit_balances SET
    monthly_credits = monthly_credits - v_from_monthly,
    purchased_credits = purchased_credits - v_from_purchased,
    bonus_credits = bonus_credits - v_from_bonus,
    updated_at = now()
  WHERE user_id = p_user_id;

  v_total_after := (v_balance.monthly_credits - v_from_monthly)
                 + (v_balance.purchased_credits - v_from_purchased)
                 + (v_effective_bonus - v_from_bonus);

  -- Record transaction(s) per pool consumed
  IF v_from_monthly > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
    VALUES (p_user_id, -v_from_monthly, v_total_after, 'monthly', p_source, p_reference_id, p_description);
  END IF;

  IF v_from_purchased > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
    VALUES (p_user_id, -v_from_purchased, v_total_after, 'purchased', p_source, p_reference_id, p_description);
  END IF;

  IF v_from_bonus > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
    VALUES (p_user_id, -v_from_bonus, v_total_after, 'bonus', p_source, p_reference_id, p_description);
  END IF;

  -- Fallback: if somehow no pool was consumed (shouldn't happen), record as consumption
  IF v_from_monthly = 0 AND v_from_purchased = 0 AND v_from_bonus = 0 THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
    VALUES (p_user_id, -p_amount, v_total_after, 'consumption', p_source, p_reference_id, p_description);
  END IF;

  RETURN v_total_after;
END;
$$;

/* ——— RPC: add_purchased_credits ——— */
-- Upserts balance and adds to purchased pool.

CREATE OR REPLACE FUNCTION add_purchased_credits(
  p_user_id UUID,
  p_amount INTEGER,
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
  -- Upsert balance row
  INSERT INTO credit_balances (user_id, purchased_credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    purchased_credits = credit_balances.purchased_credits + p_amount,
    updated_at = now();

  -- Get new total
  SELECT (monthly_credits + purchased_credits + CASE
    WHEN bonus_credits > 0 AND (bonus_credits_expires_at IS NULL OR bonus_credits_expires_at > now())
    THEN bonus_credits ELSE 0 END)
  INTO v_total_after
  FROM credit_balances
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
  VALUES (p_user_id, p_amount, v_total_after, 'purchased', p_source, p_reference_id, p_description);

  RETURN v_total_after;
END;
$$;

/* ——— RPC: refund_credits ——— */
-- Adds credits back to purchased pool (refunds always go to purchased).

CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
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
  UPDATE credit_balances SET
    purchased_credits = purchased_credits + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  SELECT (monthly_credits + purchased_credits + CASE
    WHEN bonus_credits > 0 AND (bonus_credits_expires_at IS NULL OR bonus_credits_expires_at > now())
    THEN bonus_credits ELSE 0 END)
  INTO v_total_after
  FROM credit_balances
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, balance_after, credit_type, source, reference_id, description)
  VALUES (p_user_id, p_amount, v_total_after, 'refund', p_source, p_reference_id, p_description);

  RETURN v_total_after;
END;
$$;

/* ——— RPC: reset_monthly_credits ——— */
-- Upserts balance with new monthly allotment and period bounds.

CREATE OR REPLACE FUNCTION reset_monthly_credits(
  p_user_id UUID,
  p_monthly_limit INTEGER,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO credit_balances (user_id, monthly_credits, monthly_credits_limit, period_start, period_end)
  VALUES (p_user_id, p_monthly_limit, p_monthly_limit, p_period_start, p_period_end)
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_credits = p_monthly_limit,
    monthly_credits_limit = p_monthly_limit,
    period_start = p_period_start,
    period_end = p_period_end,
    updated_at = now();
END;
$$;

/* ——— RLS Policies ——— */

ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- Users can read their own balances
CREATE POLICY credit_balances_select ON credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY credit_transactions_select ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Credit packs are readable by all authenticated users
CREATE POLICY credit_packs_select ON credit_packs
  FOR SELECT USING (auth.role() = 'authenticated');

/* ——— Backfill existing subscription users ——— */
-- Creates credit_balances for existing Pro subscribers with 60 monthly credits.
-- Free users get 3 monthly credits. Day pass users get 0 (they use day pass system).

INSERT INTO credit_balances (user_id, monthly_credits, monthly_credits_limit, period_start, period_end)
SELECT
  s.user_id,
  CASE s.plan_id
    WHEN 'pro' THEN 60
    WHEN 'free' THEN 3
    ELSE 0
  END,
  CASE s.plan_id
    WHEN 'pro' THEN 60
    WHEN 'free' THEN 3
    ELSE 0
  END,
  s.current_period_start::timestamptz,
  s.current_period_end::timestamptz
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM credit_balances cb WHERE cb.user_id = s.user_id
)
ON CONFLICT (user_id) DO NOTHING;
