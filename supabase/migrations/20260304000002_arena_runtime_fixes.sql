-- Arena runtime fixes:
-- 1) Make xp_events.source_id text (code uses string idempotency keys)
-- 2) Add missing RPCs used by arena/billing services

/* ——— xp_events.source_id type + uniqueness ——— */

alter table xp_events
  alter column source_id type text
  using source_id::text;

create unique index if not exists idx_xp_events_source_id_unique
  on xp_events(source_id)
  where source_id is not null;

/* ——— RPC: increment_user_xp ——— */

create or replace function increment_user_xp(
  p_user_id uuid,
  p_amount integer
) returns integer
language plpgsql
security definer
as $$
declare
  v_total integer;
begin
  insert into user_stats (user_id, total_xp, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update set
    total_xp = user_stats.total_xp + p_amount,
    updated_at = now()
  returning total_xp into v_total;

  return v_total;
end;
$$;

/* ——— RPC: increment_challenge_participants ——— */

create or replace function increment_challenge_participants(
  p_challenge_id uuid
) returns integer
language plpgsql
security definer
as $$
declare
  rows_affected integer;
begin
  update challenges
  set participant_count = participant_count + 1
  where id = p_challenge_id;

  get diagnostics rows_affected = row_count;
  return rows_affected;
end;
$$;

/* ——— RPC: increment_day_pass_usage ——— */

create or replace function increment_day_pass_usage(
  pass_id uuid,
  usage_column text
) returns integer
language plpgsql
security definer
as $$
declare
  rows_affected integer;
begin
  if usage_column = 'runs_used' then
    update day_passes
    set runs_used = runs_used + 1,
        updated_at = now()
    where id = pass_id
      and status = 'active';
  elsif usage_column = 'decks_used' then
    update day_passes
    set decks_used = decks_used + 1,
        updated_at = now()
    where id = pass_id
      and status = 'active';
  else
    raise exception 'Invalid usage column: %', usage_column;
  end if;

  get diagnostics rows_affected = row_count;
  return rows_affected;
end;
$$;
