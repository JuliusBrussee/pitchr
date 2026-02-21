-- 04-storage-policies.sql
-- Public access policies for the decks bucket (no auth in MVP).

-- Allow public reads (pdf.js needs direct URL access)
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'decks');

-- Allow anonymous uploads
create policy "Allow uploads"
  on storage.objects for insert
  with check (bucket_id = 'decks');

-- Allow anonymous deletes
create policy "Allow deletes"
  on storage.objects for delete
  using (bucket_id = 'decks');
