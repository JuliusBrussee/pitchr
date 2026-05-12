-- 08-add-run-lifecycle-columns.sql
-- Adds async lifecycle fields for queued/running/complete/failed run processing.

alter table runs
  add column if not exists status text not null default 'complete'
    check (status in ('queued', 'running', 'complete', 'failed'));

alter table runs
  add column if not exists error_message text;

alter table runs
  add column if not exists started_at timestamptz;

alter table runs
  add column if not exists completed_at timestamptz;

alter table runs
  add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists idx_runs_status_created_at on runs(status, created_at desc);
