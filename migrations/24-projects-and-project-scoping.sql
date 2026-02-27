-- 24-projects-and-project-scoping.sql
-- Add project-level scoping across runs/decks/settings and seed default projects.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('two_min_pitch', 'elevator_pitch')),
  workflow_mode text not null check (workflow_mode in ('elevator', 'vc_pitch')),
  is_archived boolean not null default false,
  is_seeded boolean not null default false,
  prompt_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_user_active on projects(user_id, is_archived, created_at desc);
create unique index if not exists idx_projects_seed_unique on projects(user_id, type) where is_seeded = true;

create or replace function set_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
before update on projects
for each row
execute function set_projects_updated_at();

alter table projects enable row level security;

do $$ begin
  create policy "projects_select_own" on projects
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "projects_insert_own" on projects
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "projects_update_own" on projects
    for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "projects_delete_own" on projects
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

alter table runs add column if not exists project_id uuid references projects(id) on delete restrict;
alter table decks add column if not exists project_id uuid references projects(id) on delete restrict;
alter table settings add column if not exists active_project_id uuid references projects(id) on delete set null;

create index if not exists idx_runs_project_id on runs(project_id);
create index if not exists idx_runs_project_created_at on runs(project_id, created_at desc);
create index if not exists idx_decks_project_id on decks(project_id);
create index if not exists idx_decks_project_created_at on decks(project_id, created_at desc);
create index if not exists idx_settings_active_project_id on settings(active_project_id);

with existing_users as (
  select id as user_id from auth.users
  union
  select user_id from runs where user_id is not null
  union
  select user_id from decks where user_id is not null
  union
  select user_id from settings where user_id is not null
),
seed_matrix as (
  select
    'two_min_pitch'::text as type,
    '2-Minute Pitch'::text as name,
    'vc_pitch'::text as workflow_mode
  union all
  select
    'elevator_pitch'::text as type,
    'Elevator Pitch'::text as name,
    'elevator'::text as workflow_mode
)
insert into projects (user_id, name, type, workflow_mode, is_seeded)
select
  u.user_id,
  s.name,
  s.type,
  s.workflow_mode,
  true
from existing_users u
cross join seed_matrix s
where not exists (
  select 1
  from projects p
  where p.user_id = u.user_id
    and p.type = s.type
    and p.is_seeded = true
);

update runs r
set project_id = p.id
from projects p
where r.project_id is null
  and p.user_id = r.user_id
  and p.is_seeded = true
  and (
    (r.mode = 'vc_pitch' and p.type = 'two_min_pitch')
    or (r.mode = 'elevator' and p.type = 'elevator_pitch')
  );

update runs r
set project_id = resolved.project_id
from (
  select
    r2.id as run_id,
    (
      select p2.id
      from projects p2
      where p2.user_id = r2.user_id
      order by
        case when p2.type = 'two_min_pitch' then 0 else 1 end,
        p2.created_at asc
      limit 1
    ) as project_id
  from runs r2
  where r2.project_id is null
) resolved
where r.id = resolved.run_id
  and resolved.project_id is not null;

update decks d
set project_id = resolved.project_id
from (
  select
    d2.id as deck_id,
    coalesce(
      (
        select p2.id
        from projects p2
        where p2.user_id = d2.user_id
          and p2.type = 'two_min_pitch'
        order by p2.created_at asc
        limit 1
      ),
      (
        select p3.id
        from projects p3
        where p3.user_id = d2.user_id
        order by p3.created_at asc
        limit 1
      )
    ) as project_id
  from decks d2
  where d2.project_id is null
) resolved
where d.id = resolved.deck_id
  and resolved.project_id is not null;

update settings s
set active_project_id = resolved.project_id
from (
  select
    s2.id as settings_id,
    coalesce(
      (
        select p2.id
        from projects p2
        where p2.user_id = s2.user_id
          and p2.type = 'two_min_pitch'
          and p2.is_archived = false
        order by p2.created_at asc
        limit 1
      ),
      (
        select p3.id
        from projects p3
        where p3.user_id = s2.user_id
          and p3.is_archived = false
        order by p3.created_at asc
        limit 1
      )
    ) as project_id
  from settings s2
  where s2.active_project_id is null
) resolved
where s.id = resolved.settings_id
  and resolved.project_id is not null;

do $$
begin
  if not exists (select 1 from runs where project_id is null) then
    alter table runs alter column project_id set not null;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from decks where project_id is null) then
    alter table decks alter column project_id set not null;
  end if;
end $$;