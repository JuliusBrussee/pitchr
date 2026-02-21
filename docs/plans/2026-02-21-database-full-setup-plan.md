# Database Full Setup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all localStorage and mock data with Supabase/Postgres so every page reads from and writes to the database.

**Architecture:** SQL migrations create `runs` and `settings` tables. New `runService.ts` and `settingsService.ts` follow the existing `deckService.ts` pattern (direct Supabase client calls). API routes call services; pages call API routes via fetch. The `usePitchRun` hook stops saving to localStorage and instead relies on the server-side save in the POST route.

**Tech Stack:** Supabase (Postgres + JSONB), Next.js App Router API routes, existing `@supabase/supabase-js` client.

---

## Task 1: SQL Migrations — runs table

**Files:**
- Create: `migrations/05-create-runs-table.sql`

**Step 1: Write the migration**

```sql
-- 05-create-runs-table.sql
-- Creates the runs table for storing pitch analysis results.

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

**Step 2: Run the migration against your Supabase project**

Run in the Supabase SQL editor or via CLI:
```bash
# Copy-paste contents of migrations/05-create-runs-table.sql into Supabase SQL Editor and execute
```
Expected: Table `runs` created with 0 rows.

**Step 3: Commit**

```bash
git add migrations/05-create-runs-table.sql
git commit -m "feat: add runs table migration"
```

---

## Task 2: SQL Migrations — settings table

**Files:**
- Create: `migrations/06-create-settings-table.sql`

**Step 1: Write the migration**

```sql
-- 06-create-settings-table.sql
-- Creates the settings table (singleton row) for user preferences.

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

-- Insert the singleton default row
insert into settings (id) values (gen_random_uuid());
```

**Step 2: Run the migration in Supabase SQL Editor**

Expected: Table `settings` created with 1 default row.

**Step 3: Commit**

```bash
git add migrations/06-create-settings-table.sql
git commit -m "feat: add settings table migration"
```

---

## Task 3: SQL Migrations — RLS policies

**Files:**
- Create: `migrations/07-rls-policies.sql`

**Step 1: Write the migration**

```sql
-- 07-rls-policies.sql
-- Public RLS policies for runs and settings (no auth in MVP).

alter table runs enable row level security;
create policy "runs_allow_all" on runs for all using (true) with check (true);

alter table settings enable row level security;
create policy "settings_allow_all" on settings for all using (true) with check (true);
```

**Step 2: Run in Supabase SQL Editor**

Expected: RLS enabled on both tables with permissive policies.

**Step 3: Commit**

```bash
git add migrations/07-rls-policies.sql
git commit -m "feat: add RLS policies for runs and settings"
```

---

## Task 4: Run Service — `services/runService.ts`

**Files:**
- Create: `services/runService.ts`

**Reference:** Follow the exact patterns from `services/deckService.ts` (import supabase client, export async functions, throw on error).

**Step 1: Write the service**

```typescript
import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/types/analysis';
import type { PitchMode, InputType } from '@/types/pitch';

/* ─── Types ─── */

export interface RunRecord {
  id: string;
  mode: PitchMode;
  input_type: InputType;
  transcript: string;
  audio_url: string | null;
  overall_score: number;
  analysis: AnalysisResult;
  deck_id: string | null;
  is_fallback: boolean;
  created_at: string;
}

export interface RunInsert {
  mode: PitchMode;
  input_type: InputType;
  transcript: string;
  audio_url?: string;
  overall_score: number;
  analysis: AnalysisResult;
  deck_id?: string;
  is_fallback?: boolean;
}

export interface RunStats {
  totalRuns: number;
  averageScore: number;
  bestScore: number;
  trend: number[];
}

/* ─── Database Operations ─── */

export async function insertRun(run: RunInsert): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .insert(run)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert run: ${error.message}`);
  return data;
}

export async function listRuns(opts?: { mode?: PitchMode; limit?: number }): Promise<RunRecord[]> {
  let query = supabase
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts?.mode) {
    query = query.eq('mode', opts.mode);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list runs: ${error.message}`);
  return data;
}

export async function getRun(id: string): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to get run: ${error.message}`);
  return data;
}

export async function deleteRun(id: string): Promise<void> {
  const { error } = await supabase
    .from('runs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete run: ${error.message}`);
}

export async function getRunStats(): Promise<RunStats> {
  const { data: runs, error } = await supabase
    .from('runs')
    .select('overall_score, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get run stats: ${error.message}`);

  if (!runs || runs.length === 0) {
    return { totalRuns: 0, averageScore: 0, bestScore: 0, trend: [] };
  }

  const totalRuns = runs.length;
  const totalScore = runs.reduce((sum, r) => sum + r.overall_score, 0);
  const averageScore = Math.round(totalScore / totalRuns);
  const bestScore = Math.max(...runs.map((r) => r.overall_score));
  const trend = runs
    .slice()
    .reverse()
    .slice(-10)
    .map((r) => r.overall_score);

  return { totalRuns, averageScore, bestScore, trend };
}
```

**Step 2: Verify TypeScript compiles**

Run: `yarn build`
Expected: No type errors in `services/runService.ts`.

**Step 3: Commit**

```bash
git add services/runService.ts
git commit -m "feat: add runService with Supabase CRUD operations"
```

---

## Task 5: Settings Service — `services/settingsService.ts`

**Files:**
- Create: `services/settingsService.ts`

**Step 1: Write the service**

```typescript
import { supabase } from '@/lib/supabase';

/* ─── Types ─── */

export interface SettingsRecord {
  id: string;
  feedback_intensity: 'gentle' | 'balanced' | 'aggressive';
  realtime_coaching: boolean;
  post_session_report: boolean;
  focus_areas: string[];
  auto_record: boolean;
  timer_seconds: number;
  theme: 'system' | 'light' | 'dark';
  compact_mode: boolean;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<SettingsRecord, 'id' | 'updated_at'>>;

/* ─── Database Operations ─── */

export async function getSettings(): Promise<SettingsRecord> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw new Error(`Failed to get settings: ${error.message}`);
  return data;
}

export async function updateSettings(updates: SettingsUpdate): Promise<SettingsRecord> {
  // Get the singleton row ID first
  const current = await getSettings();

  const { data, error } = await supabase
    .from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update settings: ${error.message}`);
  return data;
}
```

**Step 2: Verify TypeScript compiles**

Run: `yarn build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add services/settingsService.ts
git commit -m "feat: add settingsService for singleton settings CRUD"
```

---

## Task 6: API Routes — Runs CRUD

**Files:**
- Modify: `app/api/pitch/run/route.ts` (add GET handler, update POST to persist)
- Create: `app/api/pitch/run/[runId]/route.ts` (GET + DELETE)
- Create: `app/api/pitch/run/stats/route.ts` (GET)
- Modify: `controllers/pitchController.ts` (persist run to DB in controller)

**Step 1: Update pitchController.ts to save run to Supabase**

In `controllers/pitchController.ts`, import `insertRun` from `runService` and save the run after analysis. The controller currently generates a UUID but doesn't persist. Change it to persist to Supabase and return the DB-generated ID:

```typescript
import { analyzePitch } from '@/services/analysisService';
import { insertRun } from '@/services/runService';
import type {
  CreatePitchRunRequest,
  CreatePitchRunResponse,
  InputType,
  PitchMode,
} from '@/types/pitch';

export class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text';
}

function validateRequest(body: unknown): CreatePitchRunRequest {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;
  const mode = payload.mode;
  const transcript = payload.transcript;
  const inputType = payload.inputType;
  const audioUrl = payload.audioUrl;

  if (!isPitchMode(mode)) {
    throw new PitchValidationError('Invalid mode. Expected elevator or vc_pitch.');
  }

  if (!isInputType(inputType)) {
    throw new PitchValidationError('Invalid inputType. Expected audio or text.');
  }

  if (typeof transcript !== 'string' || transcript.trim().length === 0) {
    throw new PitchValidationError('Transcript is required.');
  }

  if (audioUrl !== undefined && typeof audioUrl !== 'string') {
    throw new PitchValidationError('audioUrl must be a string when provided.');
  }

  return {
    mode,
    transcript: transcript.trim(),
    inputType,
    audioUrl,
  };
}

export interface RunPitchAnalysisControllerResult extends CreatePitchRunResponse {
  fallback: boolean;
}

export async function runPitchAnalysisController(
  body: unknown,
): Promise<RunPitchAnalysisControllerResult> {
  const payload = validateRequest(body);
  const { analysis, fallback } = await analyzePitch({
    transcript: payload.transcript,
    mode: payload.mode,
  });

  const run = await insertRun({
    mode: payload.mode,
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
    overall_score: analysis.overall_score,
    analysis,
    is_fallback: fallback,
  });

  return {
    runId: run.id,
    status: 'complete',
    analysis,
    fallback,
  };
}
```

Key change: replaced `crypto.randomUUID()` with `insertRun(...)` which returns the DB-generated UUID.

**Step 2: Add GET handler to `app/api/pitch/run/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  PitchValidationError,
  runPitchAnalysisController,
} from '@/controllers/pitchController';
import { listRuns } from '@/services/runService';
import type { CreatePitchRunErrorResponse } from '@/types/pitch';
import type { PitchMode } from '@/types/pitch';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('mode') as PitchMode | null;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const runs = await listRuns({
      mode: mode ?? undefined,
      limit: limit && !isNaN(limit) ? limit : undefined,
    });
    return NextResponse.json(runs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list runs' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response: CreatePitchRunErrorResponse = {
      error: 'Invalid JSON body',
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const result = await runPitchAnalysisController(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PitchValidationError) {
      const response: CreatePitchRunErrorResponse = { error: error.message };
      return NextResponse.json(response, { status: 400 });
    }

    const response: CreatePitchRunErrorResponse = {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to analyze pitch.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
```

**Step 3: Create `app/api/pitch/run/[runId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRun, deleteRun } from '@/services/runService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    const run = await getRun(runId);
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Run not found' },
      { status: 404 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    await deleteRun(runId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete run' },
      { status: 500 },
    );
  }
}
```

**Step 4: Create `app/api/pitch/run/stats/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { getRunStats } from '@/services/runService';

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getRunStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 },
    );
  }
}
```

**Step 5: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 6: Commit**

```bash
git add controllers/pitchController.ts app/api/pitch/run/route.ts app/api/pitch/run/\[runId\]/route.ts app/api/pitch/run/stats/route.ts
git commit -m "feat: add runs API routes (list, get, delete, stats) and persist runs to Supabase"
```

---

## Task 7: API Routes — Settings

**Files:**
- Create: `app/api/settings/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/services/settingsService';

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const updated = await updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 },
    );
  }
}
```

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/api/settings/route.ts
git commit -m "feat: add settings API routes (GET, PATCH)"
```

---

## Task 8: Update usePitchRun hook — remove localStorage save

**Files:**
- Modify: `hooks/usePitchRun.ts`

**Step 1: Remove localStorage dependency**

The hook currently imports `saveRun` from `models/run` and calls it after the API response. Since the controller now saves to Supabase server-side, the hook no longer needs to save anything locally. Remove the import and the `saveRun(run)` call, and remove the `Run` construction:

```typescript
'use client';

import { useCallback, useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import type {
  CreatePitchRunErrorResponse,
  CreatePitchRunRequest,
  CreatePitchRunResponse,
} from '@/types/pitch';

export interface RunPitchAnalysisResult {
  runId: string;
  analysis: AnalysisResult;
  fallback: boolean;
}

export interface UsePitchRunReturn {
  isAnalyzing: boolean;
  error: string | null;
  runPitchAnalysis: (
    input: CreatePitchRunRequest,
  ) => Promise<RunPitchAnalysisResult>;
}

export function usePitchRun(): UsePitchRunReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPitchAnalysis = useCallback(
    async (input: CreatePitchRunRequest): Promise<RunPitchAnalysisResult> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/pitch/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        const payload = (await response.json()) as
          | (CreatePitchRunResponse & { fallback?: boolean })
          | CreatePitchRunErrorResponse;

        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Pitch analysis failed.',
          );
        }

        const success = payload as CreatePitchRunResponse & { fallback?: boolean };

        return {
          runId: success.runId,
          analysis: success.analysis,
          fallback: success.fallback ?? false,
        };
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Pitch analysis failed.';
        setError(message);
        throw caughtError;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  return {
    isAnalyzing,
    error,
    runPitchAnalysis,
  };
}
```

Changes: removed `import { saveRun } from '@/models/run'`, removed `import type { Run } from '@/types/pitch'`, removed the `const run: Run = {...}; saveRun(run);` block.

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors. No references to `models/run` from hooks.

**Step 3: Commit**

```bash
git add hooks/usePitchRun.ts
git commit -m "refactor: remove localStorage save from usePitchRun — server persists to Supabase"
```

---

## Task 9: Wire Results page to Supabase

**Files:**
- Modify: `app/(app)/results/[runId]/page.tsx`

**Step 1: Replace localStorage fetch with API fetch**

Currently lines 4-6 import `getRun` from `@/models/run` and use it in a `useEffect`. Replace with a `fetch` call to the API:

Change the import section — remove `import { getRun } from '@/models/run'` and remove the `import type { Run }` from `@/types/pitch` (it's still needed but import from the right place).

Replace the `useEffect` (around lines 74-83):

```typescript
// Old:
useEffect(() => {
  if (!runId) {
    setRun(null);
    setCheckedStorage(true);
    return;
  }
  const nextRun = getRun(runId);
  setRun(nextRun);
  setCheckedStorage(true);
}, [runId]);

// New:
useEffect(() => {
  if (!runId) {
    setRun(null);
    setCheckedStorage(true);
    return;
  }
  fetch(`/api/pitch/run/${runId}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && !data.error) {
        setRun({
          id: data.id,
          createdAt: data.created_at,
          mode: data.mode,
          inputType: data.input_type,
          transcript: data.transcript,
          audioUrl: data.audio_url ?? undefined,
          analysis: data.analysis,
          overallScore: data.overall_score,
        });
      } else {
        setRun(null);
      }
      setCheckedStorage(true);
    })
    .catch(() => {
      setRun(null);
      setCheckedStorage(true);
    });
}, [runId]);
```

Note: The API returns `RunRecord` (snake_case DB columns) but the page uses the `Run` type (camelCase). We map between them in the fetch handler. The `Run` type from `types/pitch.ts` stays as-is for the UI.

Also remove `import { getRun } from '@/models/run'` from the top of the file.

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Test manually**

1. Start dev server: `yarn dev`
2. Navigate to `/results/<some-uuid>` — should show "Result Not Found" (no runs yet)
3. Run a pitch via `/session` — should redirect to results and show the analysis from DB

**Step 4: Commit**

```bash
git add app/\(app\)/results/\[runId\]/page.tsx
git commit -m "feat: wire results page to Supabase API instead of localStorage"
```

---

## Task 10: Wire History page to Supabase

**Files:**
- Modify: `app/(app)/history/page.tsx`

**Step 1: Replace mock data with API fetch**

The history page currently has hardcoded `MOCK_RUNS` (lines 45-54) and uses `MockRun` type. Replace with a real API call.

Key changes:
1. Remove the entire `MOCK_RUNS` constant and `MockRun` interface
2. Add a `useEffect` that fetches from `/api/pitch/run`
3. Map `RunRecord` (snake_case) to the shape the page needs
4. Compute `dateGroup` dynamically from `created_at` instead of hardcoding it
5. Compute `number` as the reverse index (most recent = highest number)

The page currently renders: `number`, `mode`, `inputType`, `overallScore`, `one_line_verdict`, `createdAt`, `duration_seconds`, `deck`, `dateGroup`. The API returns `RunRecord` which has `analysis.one_line_verdict` and `analysis.delivery_metrics.duration_seconds`.

Replace the entire page content. The key structural change is adding `useState` for runs + `useEffect` to fetch, and a helper to compute date groups:

```typescript
// Add at top, after existing imports:
import { useEffect } from 'react';

// Add helper function:
function getDateGroup(iso: string): 'today' | 'yesterday' | 'thisWeek' | 'earlier' {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  if (date >= weekAgo) return 'thisWeek';
  return 'earlier';
}
```

Inside the component, replace `MOCK_RUNS` usage:

```typescript
// Add state and fetch:
const [runs, setRuns] = useState<HistoryRun[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/pitch/run')
    .then((res) => res.json())
    .then((data: RunRecord[]) => {
      const mapped = data.map((r, i) => ({
        id: r.id,
        number: data.length - i,
        mode: r.mode as PitchMode,
        inputType: r.input_type as 'audio' | 'text',
        overallScore: r.overall_score,
        one_line_verdict: r.analysis.one_line_verdict,
        createdAt: r.created_at,
        duration_seconds: r.analysis.delivery_metrics.duration_seconds,
        deck: undefined,
        dateGroup: getDateGroup(r.created_at),
      }));
      setRuns(mapped);
    })
    .catch(() => setRuns([]))
    .finally(() => setLoading(false));
}, []);
```

Rename `MockRun` to `HistoryRun` (same shape). Replace all references to `MOCK_RUNS` with `runs`. Add the `RunRecord` type import or define a lightweight interface inline.

Wire up the delete handler to actually call the API:

```typescript
const handleDelete = async (id: string) => {
  setDeletingId(id);
  try {
    await fetch(`/api/pitch/run/${id}`, { method: 'DELETE' });
    setRuns((prev) => prev.filter((r) => r.id !== id));
  } finally {
    setDeletingId(null);
  }
};
```

Filter against `runs` instead of `MOCK_RUNS` (already variable-based in the filter logic, just change the source).

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/\(app\)/history/page.tsx
git commit -m "feat: wire history page to Supabase API, replace mock data"
```

---

## Task 11: Wire Dashboard page to Supabase

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Step 1: Replace mock data with API fetches**

The dashboard has `RECENT_RUNS` (mock array) and `STATS` (mock object). Replace with:

1. `fetch('/api/pitch/run/stats')` for stats
2. `fetch('/api/pitch/run?limit=3')` for recent runs

Add state + useEffect:

```typescript
const [stats, setStats] = useState({ totalRuns: 0, averageScore: 0, bestScore: 0, trend: [] as number[] });
const [recentRuns, setRecentRuns] = useState<DashboardRun[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  Promise.all([
    fetch('/api/pitch/run/stats').then((r) => r.json()),
    fetch('/api/pitch/run?limit=3').then((r) => r.json()),
  ])
    .then(([statsData, runsData]) => {
      setStats(statsData);
      setRecentRuns(
        runsData.map((r: RunRecord) => ({
          id: r.id,
          mode: r.mode as PitchMode,
          overallScore: r.overall_score,
          one_line_verdict: r.analysis.one_line_verdict,
          createdAt: r.created_at,
          duration_seconds: r.analysis.delivery_metrics.duration_seconds,
        })),
      );
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);
```

Remove `RECENT_RUNS`, `STATS` constants, and the `MockRun` interface. Create a `DashboardRun` interface matching what the UI needs. Replace all references from the mock constants to the state variables.

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat: wire dashboard to Supabase API, replace mock data"
```

---

## Task 12: Wire Analytics page to Supabase

**Files:**
- Modify: `app/(app)/analytics/page.tsx`

**Step 1: Replace mock data with API fetches**

The analytics page has extensive mock data: `SCORE_TREND`, `RUBRIC_CATEGORIES`, `INSIGHTS`, `RECOMMENDATIONS`. Replace with:

1. Fetch all runs via `/api/pitch/run`
2. Compute score trend, rubric averages, insights, and recommendations client-side from the run data

Add state + useEffect that fetches all runs then computes analytics:

```typescript
const [allRuns, setAllRuns] = useState<RunRecord[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/pitch/run')
    .then((r) => r.json())
    .then((data) => setAllRuns(data))
    .catch(() => setAllRuns([]))
    .finally(() => setLoading(false));
}, []);
```

Then derive the chart data, rubric averages, insights, and recommendations from `allRuns` using `useMemo`. The exact computation depends on the time range selection. For rubric categories, average across all runs' `analysis.rubric_breakdown`. For score trend, group by date within the selected range. For insights and recommendations, derive from the rubric averages (strongest/weakest categories).

Keep the existing mock data as fallback when there are no runs yet (empty state).

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/\(app\)/analytics/page.tsx
git commit -m "feat: wire analytics page to Supabase, compute trends from real data"
```

---

## Task 13: Wire Settings page to Supabase

**Files:**
- Modify: `app/(app)/settings/page.tsx`

**Step 1: Replace useState with API-backed state**

The settings page uses `useState` for all settings with hardcoded defaults. Replace with:

1. Fetch settings on mount via `GET /api/settings`
2. On any change, call `PATCH /api/settings` with the updated field
3. Keep local state for immediate UI response (optimistic updates)

Add a `useEffect` to load settings on mount:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/settings')
    .then((r) => r.json())
    .then((data) => {
      setFeedbackIntensity(data.feedback_intensity);
      setRealtimeCoaching(data.realtime_coaching);
      setPostSessionReport(data.post_session_report);
      setSelectedFocusAreas(data.focus_areas);
      setAutoRecord(data.auto_record);
      const mins = Math.floor(data.timer_seconds / 60);
      const secs = data.timer_seconds % 60;
      setTimerMinutes(mins);
      setTimerSeconds(secs);
      setTheme(data.theme);
      setCompactMode(data.compact_mode);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);
```

Add a helper to persist changes:

```typescript
function persistSetting(updates: Record<string, unknown>) {
  fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(() => {});
}
```

Call `persistSetting` in each setter. For example:

```typescript
// Feedback intensity
onClick={() => {
  setFeedbackIntensity(opt.key);
  persistSetting({ feedback_intensity: opt.key });
}}

// Realtime coaching toggle
onToggle={() => {
  setRealtimeCoaching((p) => {
    persistSetting({ realtime_coaching: !p });
    return !p;
  });
}}

// Focus areas
const toggleFocusArea = (id: string) => {
  setSelectedFocusAreas((prev) => {
    const next = prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id];
    persistSetting({ focus_areas: next });
    return next;
  });
};

// Timer
const adjustTimer = (delta: number) => {
  const totalSecs = timerMinutes * 60 + timerSeconds + delta;
  if (totalSecs < 60 || totalSecs > 30 * 60) return;
  const newMins = Math.floor(totalSecs / 60);
  const newSecs = totalSecs % 60;
  setTimerMinutes(newMins);
  setTimerSeconds(newSecs);
  persistSetting({ timer_seconds: totalSecs });
};

// Theme
onClick={() => {
  setTheme(opt.key);
  persistSetting({ theme: opt.key });
}}

// Compact mode
onToggle={() => {
  setCompactMode((p) => {
    persistSetting({ compact_mode: !p });
    return !p;
  });
}}
```

Wire the "Delete All Data" button in the danger zone to delete all runs:

```typescript
onClick={async () => {
  if (!confirm('Delete all pitch runs? This cannot be undone.')) return;
  const runs = await fetch('/api/pitch/run').then((r) => r.json());
  await Promise.all(runs.map((r: { id: string }) => fetch(`/api/pitch/run/${r.id}`, { method: 'DELETE' })));
  alert('All data deleted.');
}}
```

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "feat: wire settings page to Supabase API, persist all preferences"
```

---

## Task 14: Clean up — remove dead localStorage code

**Files:**
- Modify or delete: `models/run.ts`

**Step 1: Check for remaining references to models/run**

Search the codebase for any remaining imports of `models/run` or `@/models/run`. By this point, the only references should be in test files or the models file itself.

Run: `grep -r "models/run" --include="*.ts" --include="*.tsx" .`

If no other files import it, delete `models/run.ts` entirely — it's been superseded by `services/runService.ts`.

If test files reference it, update or remove them.

**Step 2: Verify build**

Run: `yarn build`
Expected: No errors. No references to localStorage for run data.

**Step 3: Commit**

```bash
git rm models/run.ts  # or git add if just modified
git commit -m "chore: remove dead localStorage run model — replaced by Supabase runService"
```

---

## Task 15: Verify end-to-end

**No code changes — manual verification.**

**Step 1: Start dev server**

Run: `yarn dev`

**Step 2: Test each page**

1. **Session** → Run a pitch (text input, elevator mode) → should analyze and redirect to results
2. **Results** → Should show the analysis data loaded from Supabase (not localStorage)
3. **History** → Should show the run just created (not mock data)
4. **Dashboard** → Should show 1 total run, the score, and the run in recent list
5. **Analytics** → Should show data computed from the 1 real run
6. **Settings** → Change feedback intensity → refresh page → should persist
7. **History delete** → Delete the run → should disappear from history and dashboard

**Step 3: Commit any fixes found during testing**

```bash
git add -A
git commit -m "fix: end-to-end verification fixes for database setup"
```
