-- 05-create-runs-table.sql
-- Creates the runs table for storing pitch analysis results.

create table if not exists runs (
  id             uuid primary key default gen_random_uuid(),
  mode           text not null check (mode in ('elevator', 'vc_pitch')),
  input_type     text not null check (input_type in ('audio', 'text')),
  transcript     text not null,
  audio_url      text,
  overall_score  integer not null check (overall_score between 0 and 100),
  analysis       jsonb not null,
  deck_id        uuid references decks(id) on delete set null,
  is_fallback    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_runs_created_at on runs(created_at desc);
create index if not exists idx_runs_deck_id on runs(deck_id);
