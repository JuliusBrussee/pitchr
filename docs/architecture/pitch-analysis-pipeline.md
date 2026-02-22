# Pitch Analysis Pipeline (Anthropic First)

## Overview
Pitch analysis now runs through a server-side model pipeline and stores completed runs client-side in `localStorage`.

### Runtime flow
1. User starts/stops speech session in `/session`.
2. `useSTT` receives final transcript segments from the STT WebSocket backend.
3. When `saved` is emitted, `usePitchRun` sends `POST /api/pitch/run` with `{ mode, transcript, inputType }`.
4. API route calls `runPitchAnalysisController`.
5. Controller validates input and calls `analyzePitch`.
6. `analyzePitch`:
   - computes delivery metrics locally (`services/scoringService.ts`)
   - builds rubric prompt
   - calls LLM router (`lib/llm/router.ts`)
   - parses/validates strict JSON
   - attempts repair call if invalid
   - falls back to cached sample if needed
   - injects local delivery metrics as source of truth
7. API returns `{ runId, status: 'complete', analysis, fallback? }`.
8. Client persists run via `models/run.ts` to `pitchr_runs`.
9. Client navigates to `/results/[runId]`, which reads the run from local storage.

## Provider architecture
- Active selector: `LLM_PROVIDER` (`anthropic` default, `openrouter` rollback).
- OpenRouter transport: `lib/llm/providers/openrouter.ts`.
- Anthropic transport: `lib/llm/providers/anthropic.ts`.
- Provider-independent contract: `lib/llm/types.ts`.
- Realtime checklist semantic evaluation also routes through `lib/llm/router.ts`.

## Why this shape
- Keeps API keys server-side.
- Keeps persisted run history in browser local storage for MVP simplicity.
- Allows provider switch without touching prompts, scoring, controller, or UI flow.

## Current API boundary
- Implemented: `POST /api/pitch/run` for analysis generation.
- Deferred for later PRD phase: run/history list/detail/delete server endpoints.

## Extension path to full PRD target
1. Add mode picker and text input submit path into `usePitchRun`.
2. Wire dashboard/history pages to `models/run.ts`.
3. Introduce server-side persistence and move run CRUD behind API routes.
4. Override provider when needed:
   - Default path: `LLM_PROVIDER=anthropic` with `ANTHROPIC_API_KEY=...`
   - Rollback path: `LLM_PROVIDER=openrouter` with `OPENROUTER_API_KEY=...`
5. Add provider failover policy (primary + backup) in `lib/llm/router.ts`.
6. Add observability:
   - request IDs
   - latency metrics
   - fallback rate tracking
   - validation failure logging
