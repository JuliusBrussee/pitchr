-- Add ON DELETE CASCADE to user_id foreign keys that were missing it.
-- These tables would block auth.users deletion without cascading.
-- Note: settings already has ON DELETE CASCADE from migration 20250225000015.

alter table runs
  drop constraint if exists runs_user_id_fkey,
  add constraint runs_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table decks
  drop constraint if exists decks_user_id_fkey,
  add constraint decks_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table qa_sessions
  drop constraint if exists qa_sessions_user_id_fkey,
  add constraint qa_sessions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table qa_resource_gaps
  drop constraint if exists qa_resource_gaps_user_id_fkey,
  add constraint qa_resource_gaps_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
