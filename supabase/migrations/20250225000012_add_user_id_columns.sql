-- 13-add-user-id-columns.sql
-- Add user_id columns to all user-owned tables for multi-tenancy.
-- Handles existing rows by adding nullable first, deleting orphans, then setting NOT NULL.

-- Helper: add user_id column idempotently with NOT NULL constraint
-- Steps: add nullable → delete rows without a user → set NOT NULL
do $$ begin
  -- runs
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='runs' and column_name='user_id') then
    alter table runs add column user_id uuid references auth.users(id);
    delete from runs where user_id is null;
    alter table runs alter column user_id set not null;
  end if;
end $$;
create index if not exists idx_runs_user_id on runs(user_id);

do $$ begin
  -- decks
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='decks' and column_name='user_id') then
    alter table decks add column user_id uuid references auth.users(id);
    delete from decks where user_id is null;
    alter table decks alter column user_id set not null;
  end if;
end $$;
create index if not exists idx_decks_user_id on decks(user_id);

do $$ begin
  -- qa_sessions
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='qa_sessions' and column_name='user_id') then
    alter table qa_sessions add column user_id uuid references auth.users(id);
    delete from qa_sessions where user_id is null;
    alter table qa_sessions alter column user_id set not null;
  end if;
end $$;
create index if not exists idx_qa_sessions_user_id on qa_sessions(user_id);

do $$ begin
  -- settings
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='settings' and column_name='user_id') then
    alter table settings add column user_id uuid references auth.users(id);
    delete from settings where user_id is null;
    alter table settings alter column user_id set not null;
  end if;
end $$;
create index if not exists idx_settings_user_id on settings(user_id);

-- qa_resource_gaps: nullable user_id (system-generated gaps may not have a user)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='qa_resource_gaps' and column_name='user_id') then
    alter table qa_resource_gaps add column user_id uuid references auth.users(id);
  end if;
end $$;
create index if not exists idx_qa_resource_gaps_user_id on qa_resource_gaps(user_id);
