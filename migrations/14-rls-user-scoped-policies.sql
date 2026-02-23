-- 14-rls-user-scoped-policies.sql
-- Replace permissive public RLS policies with user-scoped policies.

-- ─── Drop old public policies ───

drop policy if exists "runs_allow_all" on runs;
drop policy if exists "settings_allow_all" on settings;

-- ─── runs ───

create policy "runs_select_own" on runs
  for select using (auth.uid() = user_id);

create policy "runs_insert_own" on runs
  for insert with check (auth.uid() = user_id);

create policy "runs_update_own" on runs
  for update using (auth.uid() = user_id);

create policy "runs_delete_own" on runs
  for delete using (auth.uid() = user_id);

-- ─── decks ───

alter table decks enable row level security;

create policy "decks_select_own" on decks
  for select using (auth.uid() = user_id);

create policy "decks_insert_own" on decks
  for insert with check (auth.uid() = user_id);

create policy "decks_update_own" on decks
  for update using (auth.uid() = user_id);

create policy "decks_delete_own" on decks
  for delete using (auth.uid() = user_id);

-- ─── slides (scoped via deck FK) ───

alter table slides enable row level security;

create policy "slides_select_via_deck" on slides
  for select using (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = auth.uid())
  );

create policy "slides_insert_via_deck" on slides
  for insert with check (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = auth.uid())
  );

create policy "slides_delete_via_deck" on slides
  for delete using (
    exists (select 1 from decks where decks.id = slides.deck_id and decks.user_id = auth.uid())
  );

-- ─── qa_sessions ───

alter table qa_sessions enable row level security;

create policy "qa_sessions_select_own" on qa_sessions
  for select using (auth.uid() = user_id);

create policy "qa_sessions_insert_own" on qa_sessions
  for insert with check (auth.uid() = user_id);

create policy "qa_sessions_update_own" on qa_sessions
  for update using (auth.uid() = user_id);

create policy "qa_sessions_delete_own" on qa_sessions
  for delete using (auth.uid() = user_id);

-- ─── qa_resource_gaps ───

alter table qa_resource_gaps enable row level security;

create policy "qa_resource_gaps_select_own" on qa_resource_gaps
  for select using (auth.uid() = user_id);

create policy "qa_resource_gaps_insert_own" on qa_resource_gaps
  for insert with check (auth.uid() = user_id);

create policy "qa_resource_gaps_update_own" on qa_resource_gaps
  for update using (auth.uid() = user_id);

create policy "qa_resource_gaps_delete_own" on qa_resource_gaps
  for delete using (auth.uid() = user_id);

-- ─── settings ───

create policy "settings_select_own" on settings
  for select using (auth.uid() = user_id);

create policy "settings_insert_own" on settings
  for insert with check (auth.uid() = user_id);

create policy "settings_update_own" on settings
  for update using (auth.uid() = user_id);

create policy "settings_delete_own" on settings
  for delete using (auth.uid() = user_id);

-- ─── run_miro_boards (scoped via runs FK) ───

alter table run_miro_boards enable row level security;

create policy "run_miro_boards_select_via_run" on run_miro_boards
  for select using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = auth.uid())
  );

create policy "run_miro_boards_insert_via_run" on run_miro_boards
  for insert with check (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = auth.uid())
  );

create policy "run_miro_boards_update_via_run" on run_miro_boards
  for update using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = auth.uid())
  );

create policy "run_miro_boards_delete_via_run" on run_miro_boards
  for delete using (
    exists (select 1 from runs where runs.id = run_miro_boards.run_id and runs.user_id = auth.uid())
  );
