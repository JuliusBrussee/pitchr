-- 13-add-user-id-columns.sql
-- Add user_id columns to all user-owned tables for multi-tenancy.
-- Pre-production: no existing data to migrate, so NOT NULL is safe.

-- runs: each run belongs to a user
alter table runs
  add column user_id uuid not null references auth.users(id);
create index idx_runs_user_id on runs(user_id);

-- decks: each deck belongs to a user
alter table decks
  add column user_id uuid not null references auth.users(id);
create index idx_decks_user_id on decks(user_id);

-- qa_sessions: each QA session belongs to a user
alter table qa_sessions
  add column user_id uuid not null references auth.users(id);
create index idx_qa_sessions_user_id on qa_sessions(user_id);

-- settings: each settings row belongs to a user
alter table settings
  add column user_id uuid not null references auth.users(id);
create index idx_settings_user_id on settings(user_id);

-- qa_resource_gaps: nullable user_id (system-generated gaps may not have a user)
alter table qa_resource_gaps
  add column user_id uuid references auth.users(id);
create index idx_qa_resource_gaps_user_id on qa_resource_gaps(user_id);
