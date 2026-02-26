-- 10-recordings-storage-policies.sql
-- Public access policies for the recordings bucket (no auth in MVP).

-- Allow public reads (video player needs direct URL access)
do $$ begin
  create policy "Public read recordings"
    on storage.objects for select
    using (bucket_id = 'recordings');
exception when duplicate_object then null;
end $$;

-- Allow anonymous uploads
do $$ begin
  create policy "Allow recording uploads"
    on storage.objects for insert
    with check (bucket_id = 'recordings');
exception when duplicate_object then null;
end $$;

-- Allow anonymous deletes
do $$ begin
  create policy "Allow recording deletes"
    on storage.objects for delete
    using (bucket_id = 'recordings');
exception when duplicate_object then null;
end $$;
