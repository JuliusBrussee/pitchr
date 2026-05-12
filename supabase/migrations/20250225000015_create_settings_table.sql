-- 16-create-settings-table.sql
-- Create the settings table for per-user preferences.
-- Migration 13 added user_id column and migration 14 added RLS policies,
-- but the base table was never created. This migration creates it fresh
-- with user_id and RLS included from the start.

-- Drop policies/indexes from migrations 13-14 if they exist (idempotent)
drop policy if exists "settings_select_own" on settings;
drop policy if exists "settings_insert_own" on settings;
drop policy if exists "settings_update_own" on settings;
drop policy if exists "settings_delete_own" on settings;
drop index if exists idx_settings_user_id;
drop table if exists settings;

create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback_intensity text not null default 'balanced'
    check (feedback_intensity in ('gentle', 'balanced', 'aggressive')),
  realtime_coaching boolean not null default true,
  post_session_report boolean not null default true,
  focus_areas text[] not null default '{clarity,pacing,filler}',
  auto_record boolean not null default false,
  timer_seconds integer not null default 300,
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  compact_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_one_per_user unique (user_id)
);

create index idx_settings_user_id on settings(user_id);

alter table settings enable row level security;

do $$ begin
  create policy "settings_select_own" on settings
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "settings_insert_own" on settings
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "settings_update_own" on settings
    for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "settings_delete_own" on settings
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
