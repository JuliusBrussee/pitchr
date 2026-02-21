-- 01-create-decks-table.sql
-- Creates the decks table for storing uploaded pitch deck metadata.

create table if not exists decks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  original_url  text not null,
  pdf_url       text not null,
  slide_count   integer not null,
  thumbnail_url text,
  created_at    timestamptz default now()
);
