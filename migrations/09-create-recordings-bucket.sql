-- Create a public storage bucket for pitch session recordings (audio/video).
-- 100 MB file size limit (covers 5-minute video recordings).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recordings', 'recordings', true, 104857600);
