-- 06-create-settings-table.sql
-- Creates the settings table (singleton row) for user preferences.

create table if not exists settings (
  id                    uuid primary key default gen_random_uuid(),
  feedback_intensity    text not null default 'balanced' check (feedback_intensity in ('gentle', 'balanced', 'aggressive')),
  realtime_coaching     boolean not null default true,
  post_session_report   boolean not null default true,
  focus_areas           text[] not null default '{clarity,pacing,filler}',
  auto_record           boolean not null default false,
  timer_seconds         integer not null default 300,
  theme                 text not null default 'system' check (theme in ('system', 'light', 'dark')),
  compact_mode          boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- Insert the singleton default row
insert into settings (id) values (gen_random_uuid());
