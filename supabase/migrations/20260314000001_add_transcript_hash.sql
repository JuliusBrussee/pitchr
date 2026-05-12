alter table runs add column if not exists transcript_hash text;

create index if not exists idx_runs_transcript_hash_cache
  on runs(transcript_hash, status, is_fallback, created_at desc)
  where transcript_hash is not null
    and status = 'complete'
    and is_fallback = false;
