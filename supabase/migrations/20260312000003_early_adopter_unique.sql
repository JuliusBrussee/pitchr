/* Prevent double-grant of early adopter bonus credits.
   A partial unique index ensures only one early_adopter transaction per user. */

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_early_adopter_per_user
  ON credit_transactions (user_id)
  WHERE source = 'early_adopter';
