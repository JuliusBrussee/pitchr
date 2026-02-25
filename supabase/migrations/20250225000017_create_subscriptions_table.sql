-- 18-create-subscriptions-table.sql
-- Subscriptions table: tracks Stripe subscription state per user

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active subscription per user
create unique index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

-- Lookup by Stripe customer
create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions(stripe_customer_id);

-- Lookup by Stripe subscription
create index if not exists idx_subscriptions_stripe_sub
  on public.subscriptions(stripe_subscription_id);

-- RLS: users can only read their own subscription
alter table public.subscriptions enable row level security;

do $$ begin
  create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Only service role can insert/update (via webhooks)
do $$ begin
  create policy "Service role can manage subscriptions"
    on public.subscriptions for all
    using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;
