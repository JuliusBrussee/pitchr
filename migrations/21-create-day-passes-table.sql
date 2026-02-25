-- Day Passes table
-- Stores time-limited access passes (e.g. 24-hour Pro access)

CREATE TABLE IF NOT EXISTS day_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  runs_used INTEGER NOT NULL DEFAULT 0,
  runs_limit INTEGER NOT NULL DEFAULT 15,
  decks_used INTEGER NOT NULL DEFAULT 0,
  decks_limit INTEGER NOT NULL DEFAULT 5,
  qa_sessions_used INTEGER NOT NULL DEFAULT 0,
  qa_sessions_limit INTEGER NOT NULL DEFAULT 5,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up active passes by user
CREATE INDEX IF NOT EXISTS idx_day_passes_user_status
  ON day_passes (user_id, status);

-- Index for expiration checks
CREATE INDEX IF NOT EXISTS idx_day_passes_expires_at
  ON day_passes (expires_at)
  WHERE status = 'active';

-- RLS policy (matches existing user-scoped pattern)
ALTER TABLE day_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own day passes"
  ON day_passes FOR SELECT
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert own day passes"
  ON day_passes FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own day passes"
  ON day_passes FOR UPDATE
  USING (user_id = current_setting('app.user_id', true));
