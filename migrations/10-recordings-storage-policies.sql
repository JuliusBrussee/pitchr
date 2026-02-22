-- Public access policies for the recordings bucket (no auth in MVP).

-- Allow public reads (video player needs direct URL access)
CREATE POLICY "Public read recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings');

-- Allow anonymous uploads
CREATE POLICY "Allow recording uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings');

-- Allow anonymous deletes
CREATE POLICY "Allow recording deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings');
