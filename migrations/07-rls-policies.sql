-- 07-rls-policies.sql
-- Public RLS policies for runs and settings (no auth in MVP).

alter table runs enable row level security;
create policy "runs_allow_all" on runs for all using (true) with check (true);

alter table settings enable row level security;
create policy "settings_allow_all" on settings for all using (true) with check (true);
