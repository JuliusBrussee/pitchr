-- Create waitlist table for collecting emails + analytics before launch
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Analytics / attribution
  referrer TEXT,               -- document.referrer (where they came from)
  utm_source TEXT,             -- ?utm_source=
  utm_medium TEXT,             -- ?utm_medium=
  utm_campaign TEXT,           -- ?utm_campaign=
  landing_page TEXT,           -- pathname they signed up on
  user_agent TEXT,             -- browser UA string
  ip_address INET              -- request IP (for geo / abuse detection)
);

-- Index for querying by date and source
CREATE INDEX idx_waitlist_created_at ON waitlist (created_at DESC);
CREATE INDEX idx_waitlist_utm_source ON waitlist (utm_source) WHERE utm_source IS NOT NULL;

-- RLS: lock the table down tightly
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts only
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on waitlist"
  ON waitlist FOR SELECT
  TO anon
  USING (false);

-- No updates allowed via client
CREATE POLICY "No public updates on waitlist"
  ON waitlist FOR UPDATE
  TO anon, authenticated
  USING (false);

-- No deletes allowed via client
CREATE POLICY "No public deletes on waitlist"
  ON waitlist FOR DELETE
  TO anon, authenticated
  USING (false);
