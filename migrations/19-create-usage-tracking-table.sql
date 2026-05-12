-- Usage events table: tracks per-resource consumption for rate limiting
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource text not null, -- 'run', 'deck', 'qa_session'
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

-- Fast lookups for usage counting within a period
create index if not exists idx_usage_events_user_resource_period
  on public.usage_events(user_id, resource, period_start, period_end);

-- RLS: users can read their own usage
alter table public.usage_events enable row level security;

create policy "Users can view own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

-- Service role can insert usage events
create policy "Service role can manage usage"
  on public.usage_events for all
  using (auth.role() = 'service_role');
