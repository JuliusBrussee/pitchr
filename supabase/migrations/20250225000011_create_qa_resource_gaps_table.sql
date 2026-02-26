-- 12-create-qa-resource-gaps-table.sql
-- Queue for low-confidence knowledge gaps that should be refreshed asynchronously.

create table if not exists qa_resource_gaps (
  id              bigint generated always as identity primary key,
  run_id          uuid references runs(id) on delete set null,
  qa_session_id   uuid references qa_sessions(id) on delete set null,
  topic           text not null,
  query_text      text,
  reason          text,
  status          text not null default 'queued'
                  check (status in ('queued', 'processing', 'done', 'failed')),
  attempts        integer not null default 0,
  last_error      text,
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_qa_resource_gaps_status_created_at
  on qa_resource_gaps(status, created_at asc);

create index if not exists idx_qa_resource_gaps_run_id
  on qa_resource_gaps(run_id);

create index if not exists idx_qa_resource_gaps_session_id
  on qa_resource_gaps(qa_session_id);
