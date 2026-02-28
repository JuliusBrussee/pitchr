-- 20260228000001_optimize_rls_policies.sql
-- Performance: wrap auth.uid(), auth.role(), and current_setting() calls
-- in (select ...) subqueries so Postgres evaluates them once per query
-- instead of once per row. Also consolidate multiple permissive SELECT
-- policies on subscriptions and usage_events into single policies.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================
-- 1. Fix auth_rls_initplan: wrap auth functions in (select ...)
-- ============================================================

-- --- runs ---
drop policy if exists "runs_select_own" on runs;
create policy "runs_select_own" on runs
  for select using ((select auth.uid()) = user_id);

drop policy if exists "runs_insert_own" on runs;
create policy "runs_insert_own" on runs
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "runs_update_own" on runs;
create policy "runs_update_own" on runs
  for update using ((select auth.uid()) = user_id);

drop policy if exists "runs_delete_own" on runs;
create policy "runs_delete_own" on runs
  for delete using ((select auth.uid()) = user_id);

-- --- decks ---
drop policy if exists "decks_select_own" on decks;
create policy "decks_select_own" on decks
  for select using ((select auth.uid()) = user_id);

drop policy if exists "decks_insert_own" on decks;
create policy "decks_insert_own" on decks
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "decks_update_own" on decks;
create policy "decks_update_own" on decks
  for update using ((select auth.uid()) = user_id);

drop policy if exists "decks_delete_own" on decks;
create policy "decks_delete_own" on decks
  for delete using ((select auth.uid()) = user_id);

-- --- slides (scoped via deck FK) ---
drop policy if exists "slides_select_via_deck" on slides;
create policy "slides_select_via_deck" on slides
  for select using (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = (select auth.uid()))
  );

drop policy if exists "slides_insert_via_deck" on slides;
create policy "slides_insert_via_deck" on slides
  for insert with check (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = (select auth.uid()))
  );

drop policy if exists "slides_delete_via_deck" on slides;
create policy "slides_delete_via_deck" on slides
  for delete using (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = (select auth.uid()))
  );

-- --- qa_sessions ---
drop policy if exists "qa_sessions_select_own" on qa_sessions;
create policy "qa_sessions_select_own" on qa_sessions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "qa_sessions_insert_own" on qa_sessions;
create policy "qa_sessions_insert_own" on qa_sessions
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "qa_sessions_update_own" on qa_sessions;
create policy "qa_sessions_update_own" on qa_sessions
  for update using ((select auth.uid()) = user_id);

drop policy if exists "qa_sessions_delete_own" on qa_sessions;
create policy "qa_sessions_delete_own" on qa_sessions
  for delete using ((select auth.uid()) = user_id);

-- --- qa_resource_gaps ---
drop policy if exists "qa_resource_gaps_select_own" on qa_resource_gaps;
create policy "qa_resource_gaps_select_own" on qa_resource_gaps
  for select using ((select auth.uid()) = user_id);

drop policy if exists "qa_resource_gaps_insert_own" on qa_resource_gaps;
create policy "qa_resource_gaps_insert_own" on qa_resource_gaps
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "qa_resource_gaps_update_own" on qa_resource_gaps;
create policy "qa_resource_gaps_update_own" on qa_resource_gaps
  for update using ((select auth.uid()) = user_id);

drop policy if exists "qa_resource_gaps_delete_own" on qa_resource_gaps;
create policy "qa_resource_gaps_delete_own" on qa_resource_gaps
  for delete using ((select auth.uid()) = user_id);

-- --- settings ---
drop policy if exists "settings_select_own" on settings;
create policy "settings_select_own" on settings
  for select using ((select auth.uid()) = user_id);

drop policy if exists "settings_insert_own" on settings;
create policy "settings_insert_own" on settings
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "settings_update_own" on settings;
create policy "settings_update_own" on settings
  for update using ((select auth.uid()) = user_id);

drop policy if exists "settings_delete_own" on settings;
create policy "settings_delete_own" on settings
  for delete using ((select auth.uid()) = user_id);

-- --- run_miro_boards (scoped via runs FK) ---
drop policy if exists "run_miro_boards_select_via_run" on run_miro_boards;
create policy "run_miro_boards_select_via_run" on run_miro_boards
  for select using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = (select auth.uid()))
  );

drop policy if exists "run_miro_boards_insert_via_run" on run_miro_boards;
create policy "run_miro_boards_insert_via_run" on run_miro_boards
  for insert with check (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = (select auth.uid()))
  );

drop policy if exists "run_miro_boards_update_via_run" on run_miro_boards;
create policy "run_miro_boards_update_via_run" on run_miro_boards
  for update using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = (select auth.uid()))
  );

drop policy if exists "run_miro_boards_delete_via_run" on run_miro_boards;
create policy "run_miro_boards_delete_via_run" on run_miro_boards
  for delete using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = (select auth.uid()))
  );

-- --- projects ---
drop policy if exists "projects_select_own" on projects;
create policy "projects_select_own" on projects
  for select using ((select auth.uid()) = user_id);

drop policy if exists "projects_insert_own" on projects;
create policy "projects_insert_own" on projects
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "projects_update_own" on projects;
create policy "projects_update_own" on projects
  for update using ((select auth.uid()) = user_id);

drop policy if exists "projects_delete_own" on projects;
create policy "projects_delete_own" on projects
  for delete using ((select auth.uid()) = user_id);

-- --- day_passes (uses current_setting) ---
drop policy if exists "Users can view own day passes" on day_passes;
create policy "Users can view own day passes" on day_passes
  for select using (user_id = (select current_setting('app.user_id', true)));

drop policy if exists "Users can insert own day passes" on day_passes;
create policy "Users can insert own day passes" on day_passes
  for insert with check (user_id = (select current_setting('app.user_id', true)));

drop policy if exists "Users can update own day passes" on day_passes;
create policy "Users can update own day passes" on day_passes
  for update using (user_id = (select current_setting('app.user_id', true)));

-- --- billing_events (service_role only) ---
drop policy if exists "Service role can manage billing events" on billing_events;
create policy "Service role can manage billing events" on billing_events
  for all using ((select auth.role()) = 'service_role');


-- ============================================================
-- 2. Fix multiple_permissive_policies on subscriptions & usage_events
--    Replace dual permissive SELECT policies with a single combined policy.
-- ============================================================

-- --- subscriptions ---
-- Drop both old permissive SELECT policies
drop policy if exists "Users can view own subscription" on subscriptions;
drop policy if exists "Service role can manage subscriptions" on subscriptions;

-- Single combined SELECT policy: user owns it OR service_role
create policy "subscriptions_select" on subscriptions
  for select using (
    (select auth.uid()) = user_id
    or (select auth.role()) = 'service_role'
  );

-- Service role write policies (separate to avoid creating extra SELECT policies)
create policy "subscriptions_service_role_insert" on subscriptions
  for insert with check ((select auth.role()) = 'service_role');

create policy "subscriptions_service_role_update" on subscriptions
  for update using ((select auth.role()) = 'service_role');

create policy "subscriptions_service_role_delete" on subscriptions
  for delete using ((select auth.role()) = 'service_role');

-- --- usage_events ---
-- Drop both old permissive SELECT policies
drop policy if exists "Users can view own usage" on usage_events;
drop policy if exists "Service role can manage usage" on usage_events;

-- Single combined SELECT policy
create policy "usage_events_select" on usage_events
  for select using (
    (select auth.uid()) = user_id
    or (select auth.role()) = 'service_role'
  );

-- Service role write policies
create policy "usage_events_service_role_insert" on usage_events
  for insert with check ((select auth.role()) = 'service_role');

create policy "usage_events_service_role_update" on usage_events
  for update using ((select auth.role()) = 'service_role');

create policy "usage_events_service_role_delete" on usage_events
  for delete using ((select auth.role()) = 'service_role');
