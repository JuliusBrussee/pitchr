-- 03-create-decks-storage-bucket.sql
-- Creates the 'decks' storage bucket (public, 50 MB limit).

insert into storage.buckets (id, name, public, file_size_limit)
values ('decks', 'decks', true, 52428800)
on conflict (id) do nothing;
