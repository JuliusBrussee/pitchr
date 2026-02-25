-- 20-create-billing-events-table.sql
-- Billing events table: audit log for Stripe webhook events
-- Prevents duplicate processing via idempotency on stripe_event_id

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

-- Lookup by event type for debugging
create index if not exists idx_billing_events_type
  on public.billing_events(event_type);

-- RLS: only service role
alter table public.billing_events enable row level security;

do $$ begin
  create policy "Service role can manage billing events"
    on public.billing_events for all
    using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;
