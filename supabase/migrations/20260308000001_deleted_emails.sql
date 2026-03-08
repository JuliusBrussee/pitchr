-- Tombstone table to track deleted accounts and prevent credit farming
-- on re-signup with the same email address.
-- No RLS — accessed only via service-role admin client.

CREATE TABLE deleted_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_customer_id TEXT,
  had_paid_plan BOOLEAN DEFAULT false
);

CREATE INDEX idx_deleted_emails_email ON deleted_emails (email);
