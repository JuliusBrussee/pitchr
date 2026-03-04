-- 20260304000001_create_compliance_tables.sql
-- GDPR compliance profile + audit event log for authenticated users.

create table if not exists public.user_compliance_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  jurisdiction text not null check (jurisdiction in ('eea_uk', 'rest_of_world', 'unknown')),
  policy_version text not null,
  terms_accepted_at timestamptz,
  privacy_notice_acknowledged_at timestamptz,
  contract_basis_confirmed_at timestamptz,
  analytics_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,
  compliance_completed_at timestamptz,
  ip_country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_compliance_profiles_policy_version
  on public.user_compliance_profiles (policy_version);

create table if not exists public.user_compliance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  policy_version text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_compliance_events_user_created_at
  on public.user_compliance_events (user_id, created_at desc);

create or replace function public.set_user_compliance_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_compliance_profiles_updated_at on public.user_compliance_profiles;
create trigger trg_user_compliance_profiles_updated_at
before update on public.user_compliance_profiles
for each row
execute function public.set_user_compliance_profiles_updated_at();

alter table public.user_compliance_profiles enable row level security;
alter table public.user_compliance_events enable row level security;

do $$ begin
  create policy "user_compliance_profiles_select_own"
    on public.user_compliance_profiles
    for select
    using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_compliance_profiles_insert_own"
    on public.user_compliance_profiles
    for insert
    with check ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_compliance_profiles_update_own"
    on public.user_compliance_profiles
    for update
    using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_compliance_profiles_delete_own"
    on public.user_compliance_profiles
    for delete
    using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_compliance_events_select_own"
    on public.user_compliance_events
    for select
    using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "user_compliance_events_insert_own"
    on public.user_compliance_events
    for insert
    with check ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;
