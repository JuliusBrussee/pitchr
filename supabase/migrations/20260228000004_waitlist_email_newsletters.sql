-- 20260228000004_waitlist_email_newsletters.sql
-- Extend waitlist for transactional/newsletter email state and add
-- newsletter campaign + delivery tracking tables.

-- --- waitlist columns for email lifecycle ---

alter table public.waitlist
  add column if not exists newsletter_opt_in boolean not null default true,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists newsletter_last_sent_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists idx_waitlist_unsubscribe_token
  on public.waitlist(unsubscribe_token);

create index if not exists idx_waitlist_newsletter_targets
  on public.waitlist(newsletter_opt_in, unsubscribed_at, created_at desc);

-- --- newsletter campaigns ---

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject text not null,
  preview_text text,
  html_body text not null,
  text_body text,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_newsletter_campaigns_status_schedule
  on public.newsletter_campaigns(status, scheduled_for asc);

create or replace function public.set_newsletter_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_newsletter_campaigns_updated_at on public.newsletter_campaigns;
create trigger trg_newsletter_campaigns_updated_at
before update on public.newsletter_campaigns
for each row
execute function public.set_newsletter_campaigns_updated_at();

-- --- per-recipient delivery tracking ---

create table if not exists public.newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  waitlist_id uuid not null references public.waitlist(id) on delete cascade,
  email text not null,
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_newsletter_deliveries_campaign_waitlist
  on public.newsletter_deliveries(campaign_id, waitlist_id);

create index if not exists idx_newsletter_deliveries_campaign_status
  on public.newsletter_deliveries(campaign_id, status, sent_at desc);

-- --- RLS ---

alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_deliveries enable row level security;

do $$ begin
  create policy "Service role can manage newsletter campaigns"
    on public.newsletter_campaigns
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can manage newsletter deliveries"
    on public.newsletter_deliveries
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;
