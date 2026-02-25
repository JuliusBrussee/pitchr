-- 11-create-run-miro-boards-table.sql
-- Stores per-run Miro board mapping + sync state for two-way sync durability.

create table if not exists run_miro_boards (
  run_id      uuid primary key references runs(id) on delete cascade,
  board_id    text not null,
  board_url   text not null,
  is_fallback boolean not null default false,
  state       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_run_miro_boards_updated_at
  on run_miro_boards(updated_at desc);

create or replace function set_run_miro_boards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_run_miro_boards_updated_at on run_miro_boards;
create trigger trg_run_miro_boards_updated_at
before update on run_miro_boards
for each row
execute function set_run_miro_boards_updated_at();
