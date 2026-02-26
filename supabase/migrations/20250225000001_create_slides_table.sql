-- 02-create-slides-table.sql
-- Creates the slides table for per-slide extracted text (used as LLM context).

create table if not exists slides (
  id         uuid primary key default gen_random_uuid(),
  deck_id    uuid not null references decks(id) on delete cascade,
  slide_num  integer not null,
  text       text not null default '',
  unique(deck_id, slide_num)
);

create index if not exists idx_slides_deck_id on slides(deck_id);
