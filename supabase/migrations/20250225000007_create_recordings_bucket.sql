-- 09-create-recordings-bucket.sql
-- Create a public storage bucket for pitch session recordings (audio/video).
-- 100 MB file size limit (covers 5-minute video recordings).

do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('recordings', 'recordings', true, 104857600);
exception when unique_violation then null;
end $$;
