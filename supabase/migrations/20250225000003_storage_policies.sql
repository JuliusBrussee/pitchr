-- 04-storage-policies.sql
-- Public access policies for the decks bucket (no auth in MVP).

-- Allow public reads (pdf.js needs direct URL access)
do $$ begin
  create policy "Public read access"
    on storage.objects for select
    using (bucket_id = 'decks');
exception when duplicate_object then null;
end $$;

-- Allow anonymous uploads
do $$ begin
  create policy "Allow uploads"
    on storage.objects for insert
    with check (bucket_id = 'decks');
exception when duplicate_object then null;
end $$;

-- Allow anonymous deletes
do $$ begin
  create policy "Allow deletes"
    on storage.objects for delete
    using (bucket_id = 'decks');
exception when duplicate_object then null;
end $$;
