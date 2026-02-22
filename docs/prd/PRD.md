# Pitchr - Product Requirements Document (Living)

> One sentence: Pitchr is an AI pitch coach that captures a founder's pitch, scores it against investor-focused criteria, and returns prioritized fixes, rewrite support, and progress tracking.

- Version: 2.0 (living)
- Last updated: 2026-02-22
- Branch baseline: `main`
- Replaces: prior `docs/prd/PRD.md` content in full

## 1. Purpose And Source Of Truth

This PRD is now the single product and implementation contract for the repository state as of 2026-02-22.

It is synthesized from:
- `.planning/codebase/STACK.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/CONCERNS.md`
- Current code in `app/`, `services/`, `hooks/`, `types/`, `config/`, `lib/`, `server.ts`, `migrations/`, and `README.md`

When this PRD conflicts with older docs, this PRD wins.

## 2. Product Definition

### 2.1 Problem

Founders need fast, repeatable pitch feedback that is structured, investor-oriented, and measurable over time.

### 2.2 Core Value

Pitchr compresses pitch iteration loops by combining:
- Realtime session capture (audio, transcript, checklist)
- Asynchronous AI analysis with deterministic delivery scoring
- Actionable output (ranked fixes, rewrite, 1-minute QA pack)
- Persistence and trend visibility across runs

### 2.3 Target Users

- Primary: early-stage founders preparing for investor meetings
- Secondary: accelerator participants and competition entrants

### 2.4 Success Criteria

- A user can record or submit a pitch and receive full analysis without manual backend steps.
- Run lifecycle is stable (`queued -> running -> complete|failed`) with polling UX.
- Dashboard and history reflect persisted run data, not hardcoded mocks.
- Fallback behavior preserves a usable result when LLM calls fail.

## 3. Scope

### 3.1 In Scope (Current Product)

- Session workflow with camera/mic and realtime STT integration
- Pitch run creation and async processing via API
- Results view with score, rubric breakdown, fixes, rewrite, QA, and optional recording playback
- Run history, deletion, and stats
- Deck upload (PDF/PPTX), extraction, and deck generation
- Optional Miro fix-board creation and sync
- Optional coach audio feedback flows (ElevenLabs TTS)
- Optional Paid AI value-proof signal sync for completed runs

### 3.2 Explicitly Out Of Scope For MVP

- Authentication and tenant isolation
- Full body-language scoring as a graded rubric category
- Real-time investor scoring overlay while speaking
- Enterprise-grade observability stack (Sentry/DataDog)

## 4. Product Status Snapshot (As Implemented)

### 4.1 Implemented And Working In Code

- Next.js App Router app shell with key routes:
  - `/dashboard`
  - `/session`
  - `/results/[runId]`
  - `/history`
  - `/deck`
  - `/analytics`
  - `/review/[runId]`
- Pitch run API:
  - `POST /api/pitch/run`
  - `GET /api/pitch/run`
  - `GET /api/pitch/run/[runId]`
  - `DELETE /api/pitch/run/[runId]`
  - `GET /api/pitch/run/stats`
- Async run queue service and status transitions
- Supabase-backed persistence for runs/decks/slides and storage buckets
- Realtime STT via local WebSocket proxy (`server.ts`)
- LLM-driven judge pipeline + deterministic scoring + fallback sample result
- Deck upload, extraction, storage, retrieval, and delete
- Deck generation endpoint (`POST /api/deck/generate`)
- Miro integration endpoints and local board linkage
- Core tests for hooks/services/prompts/router and Playwright smoke checks

### 4.2 Not Fully Hardened

- No auth/RLS model suitable for multi-user production
- Some critical flows still contain silent catches and race-prone state transitions
- No full CI/CD pipeline committed in-repo
- Large monolithic page files increase regression risk

## 5. Primary User Workflows

### 5.1 Core Pitch Run Workflow

1. User opens `/session`.
2. User starts recording; STT websocket streams transcript updates.
3. Session page stops recording and submits transcript to `POST /api/pitch/run`.
4. Run is inserted as `queued` and enqueued.
5. Background processing marks run `running`, performs analysis, stores outputs, then marks terminal status.
6. Results page polls run endpoint until completion.
7. User reviews rubric, fixes, rewrite, QA pack, and optional recording.

### 5.2 Dashboard/History Workflow

- Dashboard fetches `GET /api/pitch/run` and computes KPI tiles plus rubric-driven recommendations.
- History fetches the same endpoint, supports mode filter/search, and deletes via `DELETE /api/pitch/run/[runId]`.

### 5.3 Deck Workflow

- Upload deck file to `POST /api/deck/upload`.
- Optional PPTX conversion to PDF via LibreOffice (`soffice`).
- Extract text and persist deck/slides records + storage files.
- Retrieve with `GET /api/deck` and `GET /api/deck/[deckId]`.

### 5.4 Miro Workflow

- Results page submits top fixes to `POST /api/miro/fix-board`.
- Board metadata is cached client-side in store.
- Sync endpoint `GET /api/miro/fix-board/sync` refreshes fix statuses.
- Markdown fallback available via `POST /api/miro/fix-board/markdown`.

### 5.5 Paid AI Workflow

- After a run reaches `complete`, queue processing triggers Paid sync.
- Signal `pitch_analysis_completed` is sent for each completed run.
- Signal `investor_ready_achieved` is sent when overall score is at least 80.
- Sync status (`sent | skipped | failed`) is persisted under run analysis economics metadata.
- Sync failures do not fail or roll back the run completion path.

## 6. Functional Requirements

### 6.1 Session And Realtime Feedback

The session experience must provide:
- Audio capture and live transcript
- Realtime checklist progression (`uncovered|partial|completed|failed`)
- Live metrics updates (pace, fillers, etc.)
- Robust stop behavior that persists transcript and triggers analysis

Current implementation references:
- `app/(app)/session/page.tsx`
- `hooks/useSTT.ts`
- `hooks/useSessionState.ts`
- `services/realtimeChecklistService.ts`
- `server.ts`

### 6.2 Analysis Pipeline

The analysis service must:
- Build scoring context from transcript/deck/stage
- Run LLM judge prompt
- Enforce schema validation for judge payload
- Override delivery score from deterministic local metrics
- Compute composite score with anti-pattern penalties and optional deck weighting
- Return v2 analysis payload with telemetry metadata
- Fall back to `SAMPLE_RESULT` on failures

Current implementation references:
- `services/analysisService.ts`
- `services/prepAgentService.ts`
- `services/judgeAgentService.ts`
- `services/scoringService.ts`
- `config/sampleResult.ts`

### 6.3 Results Experience

Results page must show:
- Overall score and score band
- Rubric breakdown
- Top fixes
- Rewrite script with copy action
- Delivery metrics
- QA pack (model output or synthesized fallback)
- Run status/error states and "Run Again" path

Current implementation reference:
- `app/(app)/results/[runId]/page.tsx`

### 6.4 Persistence And Retrieval

Runs, decks, and recordings must be retrievable and deletable through API routes.

Primary persistence path is Supabase.

Legacy/local fallback artifacts exist (`models/run.ts` localStorage CRUD), but the active app path is API + Supabase-backed services.

### 6.5 Deck Generation

Deck generation endpoint must:
- Validate request fields
- Generate structured slides via LLM
- Repair invalid JSON once
- Render PDF via `@react-pdf/renderer`
- Store PDF and slide text in Supabase

Current implementation reference:
- `services/deckGenerationService.ts`

## 7. Data Model Contracts

### 7.1 Core Run Contract

Defined in `types/pitch.ts`:
- `PitchMode`: `elevator | vc_pitch`
- `InputType`: `audio | text`
- `RunStatus`: `queued | running | complete | failed`
- `Run`: includes lifecycle timestamps, status, analysis payload (v1-compatible field + v2 fields), score, fallback flag

### 7.2 Analysis v2 Contract

Defined in `types/analysis-v2.ts` and used as canonical analysis schema.

Key entities:
- `RubricScore`
- `Fix`
- `DeliveryMetrics`
- `FeedbackOutput`
- `OneMinuteQAPack`
- `AnalysisMeta`
- `AnalysisOutputs`
- `AnalysisResultV2`

Coverage modes:
- `spoken_only`
- `spoken+deck`

### 7.3 Rubric Contract

Configured in `config/rubric.ts`:
- Spoken categories: `structure`, `clarity`, `evidence`, `market`, `delivery`
- Deck categories: `deck_narrative`, `deck_clarity`, `deck_evidence`, `deck_design`, `deck_ask`
- Category weights currently modeled as 20-point components
- Score bands:
  - 0-39 `Needs Work`
  - 40-59 `Getting There`
  - 60-79 `Solid`
  - 80-100 `Investor-Ready`

### 7.4 Mode Contract

Configured in `config/modes.ts`:
- `elevator`: 30-45s bounds, target 38s, target 150 WPM
- `vc_pitch`: 110-130s bounds, target 120s, target 140 WPM

### 7.5 Checklist Contract

Configured in `config/realtimeChecklist.ts` and `types/checklist.ts`:
- IDs: `intro_hook`, `problem_statement`, `solution_overview`, `market_opportunity`, `business_model`, `traction_metrics`, `team`, `ask`
- Elevator defaults to a subset; VC uses full set
- Required item failure threshold defaults to 30s

## 8. API Contracts (Current)

### 8.1 Pitch Runs

#### `POST /api/pitch/run`

Request body:
- `mode`
- `transcript`
- `inputType`
- Optional: `audioUrl`, `deckText`, `stage`, `regenerate`

Behavior:
- Validates input
- Inserts queued run
- Enqueues async processing

Response:
- `202 Accepted` when queued
- `201 Created` if immediate completion path is ever returned
- Body includes `{ runId, status }` and optional analysis fields

#### `GET /api/pitch/run`

Query params:
- `mode` (optional)
- `limit` (optional)
- `includePending=true|false` (optional)

Response:
- `{ runs: Run[], stats: { totalRuns, averageScore, bestScore, trend } }`

#### `GET /api/pitch/run/[runId]`

Response:
- `{ run: Run }` with lifecycle status and outputs when complete

#### `DELETE /api/pitch/run/[runId]`

Behavior:
- Best-effort recording delete from storage
- Run delete from DB

Response:
- `{ deleted: true }`

#### `GET /api/pitch/run/stats`

Response:
- aggregate stats object from run service

### 8.2 Deck Endpoints

- `POST /api/deck/upload`
- `GET /api/deck`
- `GET /api/deck/[deckId]`
- `DELETE /api/deck/[deckId]`
- `POST /api/deck/generate`

### 8.3 Miro Endpoints

- `POST /api/miro/fix-board`
- `GET /api/miro/fix-board/sync`
- `POST /api/miro/fix-board/markdown`

### 8.4 STT/Coach Backend Endpoints (Express)

Served by `server.ts`:
- WebSocket `/ws` for STT streaming
- `POST /api/coach-answer` for answer feedback + optional TTS payload

## 9. Architecture

### 9.1 Pattern

MVC-style layering adapted to Next.js App Router:
- Views: `app/(app)/` + `views/components/`
- Controllers/API: `app/api/` + `controllers/`
- Services: business logic in `services/`
- Models/Data: `models/`, `types/`, Supabase tables/storage

### 9.2 Layer Responsibilities

- View layer: rendering and interaction orchestration
- Hook layer: client state machines and side effects (`useSTT`, `useRecorder`, `usePitchRun`, `useSessionState`)
- API layer: request validation and response shaping
- Service layer: analysis orchestration, scoring, queueing, integrations
- Data layer: Supabase CRUD and storage utilities

### 9.3 Runtime Data Flows

#### Realtime Session

Browser mic -> `useSTT` -> Express WS proxy -> ElevenLabs realtime STT -> transcript/checklist updates -> session state.

#### Analysis

Client submit -> `POST /api/pitch/run` -> queued run insert -> queue worker -> `analyzePitch` -> LLM + deterministic scoring -> DB update complete/failed.

#### Results Polling

Results page polls `GET /api/pitch/run/[runId]` every ~1.5s until status is terminal.

## 10. Technology Stack (Repository-Accurate)

### 10.1 Languages And Runtime

- TypeScript (`strict: true`)
- Node.js >= 18
- React 19 + Next.js App Router

### 10.2 Core Dependencies (from `package.json`)

- `next` `^15.0.3`
- `react` `^19.0.0`
- `react-dom` `^19.0.0`
- `tailwindcss` `^4.0.0`
- `@supabase/supabase-js` `^2.97.0`
- `@react-three/fiber` `^9.5.0`
- `three` `^0.169.0`
- `@mediapipe/tasks-vision` `^0.10.32`
- `express` `^4.21.0`
- `ws` `^8.18.0`
- `pdf-parse` `^2.4.5`
- `@react-pdf/renderer` `^4.3.2`

### 10.3 Tooling

- Package manager: Yarn 4.12.0 (required)
- Unit/integration tests: Vitest + Testing Library + jsdom
- E2E tests: Playwright
- UTF-8 checks: `scripts/check-encoding.mjs` and `scripts/normalize-encoding.mjs`

## 11. Scoring And Prompting Requirements

### 11.1 Deterministic Delivery Scoring

`services/scoringService.ts` computes:
- WPM
- filler word counts/rates
- disfluency/stutter rates
- repeated n-gram rates
- time-window compliance
- `delivery20` weighted component

Filler detection includes:
- `um`, `uh`, `like`, `basically`, `actually`, `you know`, `sort of`, `kind of`

### 11.2 Composite Score Requirements

- Spoken score combines 4 LLM-scored spoken categories + deterministic delivery component
- Optional deck score combines 5 deck categories
- Overall score uses weighted blend when deck exists
- Anti-pattern penalties reduce final score

### 11.3 Prompting

Prompt assets:
- `lib/prompts/system.ts`
- `lib/prompts/judge.ts`
- `lib/prompts/rubric.ts`
- `lib/prompts/rewrite.ts`
- `lib/prompts/realtimeChecklist.ts`

Judge prompt contract requires JSON-only output and a strict schema with:
- feedback payload
- optional/validated QA payload

### 11.4 LLM Router Requirements

Current behavior:
- Provider selected by env (`LLM_PROVIDER`) in `lib/llm/router.ts`
- Providers implemented:
  - Anthropic (`lib/llm/providers/anthropic.ts`)
  - OpenRouter (`lib/llm/providers/openrouter.ts`)
- Telemetry returned for provider usage, attempts, latency
- Fallback to sample analysis happens at analysis-service level, not provider auto-failover for all paths

## 12. Storage, Database, And Migrations

### 12.1 Supabase Client

Singleton at `lib/supabase.ts`.

Current behavior uses placeholder URL/key fallback when env vars are missing. This is functional but fragile and should be tightened.

### 12.2 Database Tables

Migrations create and evolve:
- `decks`
- `slides`
- `runs`

`runs` includes lifecycle columns from `migrations/08-add-run-lifecycle-columns.sql`:
- `status`
- `error_message`
- `started_at`
- `completed_at`
- `meta`

### 12.3 Storage Buckets

- `decks` (50 MB configured)
- `recordings` (100 MB configured)

### 12.4 Migration Notes

- `migrations/07-rls-policies.sql` references `settings` table that is not created by the primary setup path.
- The practical runbook is to apply required deck/run/recording migrations and verify schema compatibility for run lifecycle columns.

## 13. Environment Requirements

### 13.1 Required For Core Product

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ELEVENLABS_API_KEY_STT`
- `LLM_PROVIDER` and matching provider key:
  - `ANTHROPIC_API_KEY` for Anthropic
  - `OPENROUTER_API_KEY` for OpenRouter

### 13.2 Common Optional Variables

- `ANTHROPIC_MODEL`
- `OPENROUTER_MODEL`
- `ELEVENLABS_API_KEY_TTS`
- `ELEVENLABS_VOICE_ID`
- `MIRO_ENABLED`, `MIRO_PROVIDER`, `MIRO_ACCESS_TOKEN`, `MIRO_TEAM_ID`
- `PAID_ENABLED`, `PAID_API_KEY`, `PAID_API_BASE_URL`
- `PAID_PRODUCT_ID` or `PAID_EXTERNAL_PRODUCT_ID`
- `PAID_CUSTOMER_ID` or `PAID_EXTERNAL_CUSTOMER_ID`
- `PAID_ORDER_ID`, `PAID_SIGNAL_EVENT_COMPLETED`, `PAID_SIGNAL_EVENT_INVESTOR_READY`
- `NEXT_PUBLIC_WS_URL`
- `PORT`

## 14. Coding Conventions Requirements

Derived from `.planning/codebase/CONVENTIONS.md` and enforced in repo patterns:

- Named exports only (no default exports)
- 2-space indentation, semicolons, trailing commas (multiline)
- Single quotes in TS/JS strings/imports
- `import type` for type-only imports
- `@/*` path alias for non-relative imports
- Interactive client components declare `'use client'`
- Hook names start with `use`, handlers with `on`, booleans with `is`
- Theme styling uses CSS variables and glassmorphism patterns

## 15. Testing Requirements And Current Coverage

### 15.1 Framework

- Vitest (`jsdom`) for unit/integration
- Testing Library for hooks/components
- Playwright for e2e smoke checks

### 15.2 Existing Test Coverage Areas

Current tests include:
- STT hook behavior (`hooks/__tests__/useSTT.test.ts`)
- Realtime checklist service
- Miro service
- LLM router/provider behavior
- Prompt budget and knowledge pack shape checks
- Run stats lifecycle tests
- Session state tests
- Dashboard/component tests
- Playwright smoke/head-tracking specs

### 15.3 Priority Test Gaps (Must Be Closed)

From concern audit and code review baseline:
- WebSocket lifecycle race conditions and reconnect behavior
- Session auto-submit timing edge cases
- PDF extraction edge-case files
- Head tracking state transitions under degraded camera input
- API input hardening and oversized/invalid payload paths

## 16. Known Concerns And Risk Register

### 16.1 High Priority

- No authentication and weak isolation model for multi-user operation
- Silent error catches in media/audio flows reduce debuggability
- Race windows around transcript finalization and submit timing
- Supabase client placeholder fallback can hide missing env issues

### 16.2 Medium Priority

- Very large page files create maintainability risk:
  - `app/(app)/analytics/page.tsx` (~1227 lines)
  - `app/(app)/history/page.tsx` (~604 lines)
  - `app/(app)/settings/page.tsx` (~625 lines)
  - `app/(app)/deck/page.tsx` (~584 lines)
- Complex `useSTT` hook (`~633 lines`) and head tracking hook (`~1126 lines`)
- Deck text cache in session currently unbounded

### 16.3 Performance Risks

- LLM latency and cold starts for first analysis
- MediaPipe inference overhead on lower-end devices
- Memory spikes for large PDFs during extraction

### 16.4 Data/Dependency Risks

- `pdf-parse` worker path assumptions can break on dependency layout changes
- RLS migration file references non-guaranteed schema (`settings` table)

## 17. Quality Gates

### 17.1 Functional Gates

- All pitch run APIs return correct status codes and stable contracts.
- Async lifecycle transitions are observable and deterministic.
- Results page handles queued/running/failed/complete states safely.
- Fallback analysis always returns valid schema for UI rendering.

### 17.2 Operational Gates

- Required env vars validated at startup for production modes.
- Recording uploads and deletes are idempotent and error-visible.
- Deck upload validation rejects unsupported type/size immediately.

### 17.3 UX Gates

- Session can start/stop without stale camera/mic handles.
- Polling results do not trap user in indefinite loading without explanation.
- History delete feedback is explicit and consistent.

## 18. Delivery Roadmap (Next Steps)

### Phase A - Reliability Hardening

- Remove silent catches in critical media + playback + submit flows
- Add explicit transcript completion guarantees before submission
- Improve websocket reconnect and cleanup semantics

### Phase B - Security And Data Integrity

- Introduce auth and per-user ownership checks
- Add RLS policies aligned with authenticated model
- Validate Supabase env vars strictly at startup

### Phase C - Maintainability And Test Expansion

- Split oversized pages/hooks into smaller modules
- Add targeted integration tests for queue + polling + STT races
- Add CI workflow for typecheck + tests + encoding checks

### Phase D - Product Polish

- Improve results export/share capabilities
- Improve observability and latency telemetry surfaces
- Refine deck-analysis coupling and prompts for higher scoring consistency

## 19. Demo Path Requirement

The minimum end-to-end path that must remain functional:

1. `/dashboard` -> click "Run a Pitch"
2. `/session` -> record speech and stop
3. Submit run and transition to `/results/[runId]`
4. Poll until complete and render feedback + QA outputs
5. Navigate to `/history` and verify run appears

Secondary demo path:
- Upload deck via `/deck` and include deck text in a pitch run for `spoken+deck` coverage.

## 20. Reference Map

- Product and engineering conventions: `CLAUDE.md`
- Planning audits: `.planning/codebase/*`
- Integration setup: `docs/SUPABASE_SETUP.md`, `docs/integrations/miro.md`
- Runtime overview: `README.md`
