-- 15-storage-user-scoped-policies.sql
-- Replace public storage policies with user-scoped policies.
-- Storage path convention: {userId}/{resourceId}/filename

-- --- Drop old public policies on decks bucket ---

drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Allow uploads" on storage.objects;
drop policy if exists "Allow deletes" on storage.objects;

-- --- Drop old public policies on recordings bucket ---

drop policy if exists "Public read recordings" on storage.objects;
drop policy if exists "Allow recording uploads" on storage.objects;
drop policy if exists "Allow recording deletes" on storage.objects;

-- --- Decks bucket: user-scoped by first folder ---

do $$ begin
  create policy "decks_select_own_files" on storage.objects
    for select using (
      bucket_id = 'decks'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "decks_insert_own_files" on storage.objects
    for insert with check (
      bucket_id = 'decks'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "decks_delete_own_files" on storage.objects
    for delete using (
      bucket_id = 'decks'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

-- --- Recordings bucket: user-scoped by first folder ---

do $$ begin
  create policy "recordings_select_own_files" on storage.objects
    for select using (
      bucket_id = 'recordings'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "recordings_insert_own_files" on storage.objects
    for insert with check (
      bucket_id = 'recordings'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "recordings_delete_own_files" on storage.objects
    for delete using (
      bucket_id = 'recordings'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;
