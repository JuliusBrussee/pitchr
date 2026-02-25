-- 21-create-day-passes-table.sql
-- Day Passes table
-- Stores time-limited access passes (e.g. 24-hour Pro access)

create table if not exists day_passes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null,
  runs_used integer not null default 0,
  runs_limit integer not null default 15,
  decks_used integer not null default 0,
  decks_limit integer not null default 5,
  qa_sessions_used integer not null default 0,
  qa_sessions_limit integer not null default 5,
  stripe_payment_intent_id text,
  status text not null default 'active' check (status in ('active', 'expired', 'exhausted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for looking up active passes by user
create index if not exists idx_day_passes_user_status
  on day_passes (user_id, status);

-- Index for expiration checks
create index if not exists idx_day_passes_expires_at
  on day_passes (expires_at)
  where status = 'active';

-- RLS policy (matches existing user-scoped pattern)
alter table day_passes enable row level security;

do $$ begin
  create policy "Users can view own day passes"
    on day_passes for select
    using (user_id = current_setting('app.user_id', true));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own day passes"
    on day_passes for insert
    with check (user_id = current_setting('app.user_id', true));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own day passes"
    on day_passes for update
    using (user_id = current_setting('app.user_id', true));
exception when duplicate_object then null;
end $$;
