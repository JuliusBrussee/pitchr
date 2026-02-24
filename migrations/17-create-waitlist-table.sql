-- Create waitlist table for collecting emails before launch
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Allow anonymous inserts (no auth required for waitlist)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Prevent reading other people's entries
CREATE POLICY "No public reads on waitlist"
  ON waitlist FOR SELECT
  TO authenticated
  USING (false);
