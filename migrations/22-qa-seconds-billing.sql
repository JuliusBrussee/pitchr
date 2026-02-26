-- Migration: Switch Q&A billing from session-count to seconds-based
-- 1. Rename day_passes columns: qa_sessions_used/limit → qa_seconds_used/limit
-- 2. Add quantity column to usage_events for seconds-based tracking

-- Day passes: rename session columns to seconds-based
alter table day_passes rename column qa_sessions_used to qa_seconds_used;
alter table day_passes rename column qa_sessions_limit to qa_seconds_limit;

-- Update default for qa_seconds_limit (was 5 sessions, now 600 seconds = 10 min)
alter table day_passes alter column qa_seconds_limit set default 600;

-- Usage events: add quantity column (defaults to 1 for run/deck backward compat)
alter table public.usage_events add column if not exists quantity integer not null default 1;

-- Comment update
comment on column public.usage_events.resource is 'run, deck, or qa_seconds';
comment on column public.usage_events.quantity is 'Amount consumed: 1 for runs/decks, elapsed seconds for qa_seconds';
