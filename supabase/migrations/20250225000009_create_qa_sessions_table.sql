-- 11-create-qa-sessions-table.sql
-- Stores persisted 1-minute live VC Q&A sessions linked to pitch runs.

create table if not exists qa_sessions (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references runs(id) on delete cascade,
  status            text not null default 'created'
                    check (status in ('created', 'active', 'completed', 'expired', 'failed')),
  conversation_id   text,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  duration_seconds  integer,
  turns             jsonb not null default '[]'::jsonb,
  transcript        text,
  evaluation        jsonb,
  meta              jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_qa_sessions_run_id_created_at
  on qa_sessions(run_id, created_at desc);

create index if not exists idx_qa_sessions_status_created_at
  on qa_sessions(status, created_at desc);
