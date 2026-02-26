-- Atomic increment for day pass QA seconds to prevent race conditions.
-- Two concurrent sessions completing will each atomically add their seconds
-- instead of the read-then-write pattern that can lose updates.

create or replace function increment_day_pass_qa_seconds(
  pass_id uuid,
  additional_seconds integer
)
returns void
language plpgsql
as $$
begin
  update day_passes
  set qa_seconds_used = qa_seconds_used + additional_seconds,
      updated_at = now()
  where id = pass_id
    and status = 'active';
end;
$$;
