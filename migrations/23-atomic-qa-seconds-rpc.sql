-- Atomic increment for day pass QA seconds to prevent race conditions.
-- Two concurrent sessions completing will each atomically add their seconds
-- instead of the read-then-write pattern that can lose updates.

create or replace function increment_day_pass_qa_seconds(
  pass_id uuid,
  additional_seconds integer
)
returns integer
language plpgsql
security definer
as $$
declare
  rows_affected integer;
begin
  if additional_seconds <= 0 then
    return 0;
  end if;

  update day_passes
  set qa_seconds_used = qa_seconds_used + additional_seconds,
      updated_at = now()
  where id = pass_id
    and status = 'active';

  get diagnostics rows_affected = row_count;
  return rows_affected;
end;
$$;
