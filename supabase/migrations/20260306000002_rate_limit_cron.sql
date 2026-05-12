-- pg_cron: hourly cleanup of stale rate_limits rows.
-- Separated from the core rate-limiting migration so a
-- missing pg_cron extension doesn't block everything else.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$SELECT cleanup_rate_limits(24)$$
);
