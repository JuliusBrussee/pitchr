# Database Full Setup — Design Doc

## Goal

Replace all localStorage and mock data with Supabase/Postgres. Every page that displays data should read from the database. Every action that creates/updates/deletes data should write to the database.

## Context

- Supabase client already configured (`lib/supabase.ts`)
- `decks` and `slides` tables already exist with migrations and `deckService.ts`
- `runs` currently live in localStorage via `models/run.ts` (key: `pitchr_runs`)
- Dashboard, History, Analytics pages use hardcoded MOCK data
- Settings page uses React `useState` with no persistence
- No auth — hackathon mode, anon access, simple RLS policies

## Schema

### `runs` table

```sql
create table if not exists runs (
  id             uuid primary key default gen_random_uuid(),
  mode           text not null check (mode in ('elevator', 'vc_pitch')),
  input_type     text not null check (input_type in ('audio', 'text')),
  transcript     text not null,
  audio_url      text,
  overall_score  integer not null check (overall_score between 0 and 100),
  analysis       jsonb not null,
  deck_id        uuid references decks(id) on delete set null,
  is_fallback    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_runs_created_at on runs(created_at desc);
create index if not exists idx_runs_deck_id on runs(deck_id);
```

The `analysis` JSONB column stores the full `AnalysisResult` structure:
```json
{
  "overall_score": 78,
  "one_line_verdict": "...",
  "rubric_breakdown": [{ "category": "structure", "score": 16, "max_score": 20, "rationale": "..." }, ...],
  "top_fixes": [{ "rank": 1, "category": "evidence", "issue": "...", "fix": "...", "impact": "high" }, ...],
  "rewrite_script": "...",
  "delivery_metrics": { "wpm": 145, "duration_seconds": 120, "filler_words": [...], "repeated_phrases": [...], "within_time_limit": true }
}
```

### `settings` table

```sql
create table if not exists settings (
  id                    uuid primary key default gen_random_uuid(),
  feedback_intensity    text not null default 'balanced' check (feedback_intensity in ('gentle', 'balanced', 'aggressive')),
  realtime_coaching     boolean not null default true,
  post_session_report   boolean not null default true,
  focus_areas           text[] not null default '{clarity,pacing,filler}',
  auto_record           boolean not null default false,
  timer_seconds         integer not null default 300,
  theme                 text not null default 'system' check (theme in ('system', 'light', 'dark')),
  compact_mode          boolean not null default false,
  updated_at            timestamptz not null default now()
);
```

Single-row singleton — insert a default row in the migration.

### RLS Policies

Simple `allow all` for both tables (no auth):

```sql
alter table runs enable row level security;
create policy "runs_allow_all" on runs for all using (true) with check (true);

alter table settings enable row level security;
create policy "settings_allow_all" on settings for all using (true) with check (true);
```

## Service Layer

### `services/runService.ts`

Following `deckService.ts` patterns:

- `insertRun(run)` — insert with analysis JSONB, return full record
- `listRuns(opts?)` — list all runs, ordered by created_at DESC, optional mode filter
- `getRun(id)` — single run by ID
- `deleteRun(id)` — hard delete
- `getRunStats()` — aggregate: totalRuns, averageScore, bestScore, trend (last 10 scores)

### `services/settingsService.ts`

- `getSettings()` — fetch the singleton row (or return defaults if empty)
- `updateSettings(partial)` — upsert partial settings

## API Routes

### Runs API (`app/api/pitch/run/`)

- `POST /api/pitch/run` — already exists, update to save run to Supabase after analysis
- `GET /api/pitch/run` — new, list all runs (for history/dashboard)
- `GET /api/pitch/run/[runId]` — new, get single run
- `DELETE /api/pitch/run/[runId]` — new, delete single run
- `GET /api/pitch/run/stats` — new, get aggregated stats

### Settings API (`app/api/settings/`)

- `GET /api/settings` — get current settings
- `PATCH /api/settings` — update partial settings

## Page Wiring

| Page | Current Source | New Source |
|------|---------------|-----------|
| `/session` | localStorage save in usePitchRun | API saves to Supabase |
| `/results/[runId]` | localStorage getRun() | `GET /api/pitch/run/[runId]` |
| `/history` | MOCK_RUNS hardcoded | `GET /api/pitch/run` |
| `/dashboard` | MOCK_RUNS + STATS | `GET /api/pitch/run/stats` + `GET /api/pitch/run` (recent 3) |
| `/analytics` | All mock data | `GET /api/pitch/run/stats` + aggregated queries |
| `/settings` | React useState (no persist) | `GET/PATCH /api/settings` |

## Models Layer

`models/run.ts` currently has localStorage CRUD. Replace internals with Supabase calls via runService, or bypass models layer entirely (pages call API routes, API routes call services, services call Supabase). Recommended: **bypass models layer** — have API routes call services directly (matching the deckService pattern).

## Migration Files

Following existing pattern in `migrations/`:
- `05-create-runs-table.sql` — runs table + indexes
- `06-create-settings-table.sql` — settings table + default row
- `07-runs-rls-policies.sql` — RLS for runs
- `08-settings-rls-policies.sql` — RLS for settings

## What Stays Client-Side

- Theme toggle effect (CSS class toggle, reads from settings API on load)
- Session flow state (recording, step progress) — ephemeral, not persisted
- Media stream handling — hardware, not data
- Search/filter state on history page — UI state only
