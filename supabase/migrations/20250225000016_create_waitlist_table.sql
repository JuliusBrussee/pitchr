-- 17-create-waitlist-table.sql
-- Create waitlist table for collecting emails + analytics before launch

create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now() not null,

  -- Analytics / attribution
  referrer text,               -- document.referrer (where they came from)
  utm_source text,             -- ?utm_source=
  utm_medium text,             -- ?utm_medium=
  utm_campaign text,           -- ?utm_campaign=
  landing_page text,           -- pathname they signed up on
  user_agent text,             -- browser UA string
  ip_address inet              -- request IP (for geo / abuse detection)
);

-- Index for querying by date and source
create index if not exists idx_waitlist_created_at on waitlist (created_at desc);
create index if not exists idx_waitlist_utm_source on waitlist (utm_source) where utm_source is not null;

-- RLS: lock the table down tightly
alter table waitlist enable row level security;

-- Allow anonymous inserts only
do $$ begin
  create policy "Anyone can join waitlist"
    on waitlist for insert
    to anon, authenticated
    with check (true);
exception when duplicate_object then null;
end $$;

-- No public reads
do $$ begin
  create policy "No public reads on waitlist"
    on waitlist for select
    to anon
    using (false);
exception when duplicate_object then null;
end $$;

-- No updates allowed via client
do $$ begin
  create policy "No public updates on waitlist"
    on waitlist for update
    to anon, authenticated
    using (false);
exception when duplicate_object then null;
end $$;

-- No deletes allowed via client
do $$ begin
  create policy "No public deletes on waitlist"
    on waitlist for delete
    to anon, authenticated
    using (false);
exception when duplicate_object then null;
end $$;
