-- 20260304000002_waitlist_privacy_ack.sql
-- Adds explicit privacy notice acknowledgement fields for waitlist submissions.

alter table public.waitlist
  add column if not exists privacy_notice_version text,
  add column if not exists privacy_acknowledged_at timestamptz;

alter table public.waitlist
  alter column newsletter_opt_in set default false;