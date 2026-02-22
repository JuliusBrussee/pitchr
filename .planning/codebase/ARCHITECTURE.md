# Architecture

**Analysis Date:** 2026-02-22

## Pattern Overview

**Overall:** MVC adapted for Next.js App Router with event-driven session management

**Key Characteristics:**
- Page routes handle UI orchestration and Suspense boundaries
- Controllers validate requests and queue background work
- Services contain business logic, LLM orchestration, and external integrations
- Hooks manage client-side state and media streams
- Models handle data persistence (Supabase database)
- Real-time metrics calculated live during session (no backend polling)

## Layers

**Presentation (Views):**
- Purpose: React components rendering UI and managing user interactions
- Location: `app/(app)/` (page routes), `views/components/`, `views/screens/`
- Contains: Page components, interactive UI controls, modal dialogs
- Depends on: Hooks, ThemeProvider context, TypeScript types
- Used by: Browser user interactions

**Application (Hooks):**
- Purpose: Client-side state management, media stream handling, API orchestration
- Location: `hooks/`
- Contains: `useSessionState` (metrics/checklist/insights), `usePitchRun` (API calls), `useSTT` (speech-to-text), `useRecorder` (audio/video recording), `useDeckSlides`, `useMediaStream`, `useHeadTracking`
- Depends on: Services, types, context providers
- Used by: Page components and other hooks

**Controllers (API Routes):**
- Purpose: HTTP request validation, response marshaling, background job queuing
- Location: `app/api/` route handlers
- Contains: `pitchController.ts` (validation, runs), deck controller logic, miro sync
- Depends on: Services, database models
- Used by: Client fetch calls, Next.js routing

**Services (Business Logic):**
- Purpose: Core business logic, LLM integration, external APIs, data transformation
- Location: `services/`
- Contains:
  - `analysisService.ts` - Main pitch analysis orchestration (build context → judge agent → scoring)
  - `judgeAgentService.ts` - LLM-based feedback generation
  - `prepAgentService.ts` - Context building for judge (rubric application, deck integration)
  - `scoringService.ts` - Composite score calculation from rubric
  - `runService.ts` - Run CRUD and lifecycle (queued/running/complete/failed)
  - `realtimeChecklistService.ts` - Live checklist item updates during session
  - `deckService.ts` - Deck upload, PDF parsing, slide extraction
  - `recordingService.ts` - Audio/video upload to Supabase Storage
- Depends on: LLM providers, Supabase client, types, config
- Used by: Controllers, hooks, other services

**LLM & Prompts:**
- Purpose: Model provider abstraction, prompt templates
- Location: `lib/llm/`, `lib/prompts/`
- Contains:
  - Providers: `lib/llm/providers/anthropic.ts` (Claude), fallback handling
  - Prompts: `system.ts`, `judge.ts` (rubric questions), `rubric.ts`, `rewrite.ts`, `deckGeneration.ts`
- Depends on: Environment variables (API keys)
- Used by: analysisService, judge agent, prep agent

**Models (Data Layer):**
- Purpose: Data schema definitions and Supabase CRUD
- Location: `models/`, types in `types/`
- Contains: `run.ts` (insert/query/update runs), schema interfaces
- Depends on: Supabase client, types
- Used by: Services, controllers

**Configuration:**
- Purpose: Constants, rubrics, mode definitions, sample data
- Location: `config/`
- Contains: `modes.ts` (pitch configs), `rubric.ts`, `sampleResult.ts` (fallback), `realtimeChecklist.ts`
- Used by: Services, controllers, hooks

**Utilities:**
- Purpose: Shared helpers, audio processing, video frame extraction
- Location: `lib/` subdirectories
- Contains: Supabase singleton, audio utilities, head tracking (MediaPipe), video frame rendering
- Used by: Hooks, components, services

## Data Flow

**Session Flow (Live Pitch):**

1. User navigates to `/session` → `SessionPageContent` initializes
2. `useMediaStream` requests webcam/microphone access
3. User starts session → `useRecorder` captures audio/video stream
4. `useSTT` streams audio to ElevenLabs Realtime API → transcription
5. Transcription updates `useSessionState` → metrics calculated live (WPM, filler words, duration)
6. `realtimeChecklistService` evaluates checklist items on new transcript chunks
7. `useHeadTracking` analyzes head position via MediaPipe (engagement scoring)
8. User stops session → audio/video uploaded to Supabase via `recordingService`

**Analysis Flow (Backend):**

1. User submits pitch → `usePitchRun` POSTs to `/api/pitch/run`
2. `pitchController` validates request, creates queued run record, enqueues background job
3. Background worker calls `analysisService.analyzePitch()`
4. `prepAgentService` builds scoring context (rubric, examples, deck text if present)
5. `judgeAgentService` calls Claude with rubric questions → raw feedback JSON
6. `scoringService` calculates composite score from rubric breakdown
7. Run record updated with final analysis → `runService.updateRun()`
8. Client polls `/api/pitch/run/[runId]` until status changes from 'queued' to 'complete'

**Results Flow:**

1. User navigates to `/results/[runId]` → fetches run via `/api/pitch/run/[runId]` (GET)
2. Displays `AnalysisResult` feedback, rubric breakdown, delivery metrics
3. Can regenerate specific outputs (`feedback` or `qa_1min`) by re-submitting with `regenerate` param

**Deck Flow:**

1. User uploads PDF → POST `/api/deck/upload` → `deckService` extracts text via pdf-parse
2. Slides table populated with slide text extracted via regex/text segmentation
3. During pitch, `useDeckSlides` loads deck, renders PDF slide by slide
4. Optional: deck text included in analysis context for deck rubric scoring

## State Management

**Client-Side:**
- `useSessionState` - Metrics, checklist, insights (controlled, updates on transcript change)
- `useMediaStream` - Webcam/mic stream state
- `useSTT` - Realtime transcription buffer
- ThemeProvider context - Orb visual state
- SidebarContext - Session active flag

**Server-Side:**
- Supabase `runs` table - Complete run records with analysis results
- Supabase `decks` + `slides` tables - Deck metadata and extracted text
- Supabase `storage` bucket - Audio/video files (public anonymous access)
- Background job queue - Queued pitch analyses (implicit via `status: 'queued'` in DB)

**No intermediate caching layer** - Analysis results cached only in Supabase, fallback sample in memory

## Key Abstractions

**Run:**
- Purpose: Encapsulates a single pitch submission with all its metadata
- Schema: `id`, `mode`, `status`, `transcript`, `audio_url`, `analysis`, `overall_score`, `meta`
- Examples: `models/run.ts`, `types/pitch.ts`
- Pattern: Immutable record, status moves through lifecycle (queued → running → complete/failed)

**AnalysisResult:**
- Purpose: Complete LLM-generated feedback with scores and metrics
- Schema: `overall_score`, `rubric_breakdown`, `top_fixes`, `delivery_metrics`, `one_line_verdict`
- Examples: `types/analysis-v2.ts`
- Pattern: Serialized JSON from Claude, normalized and validated on load

**Session State:**
- Purpose: Live real-time session metrics and checklist items
- Contains: WPM, filler word count, word count, duration, checklist items, insights
- Examples: `hooks/useSessionState.ts`
- Pattern: Calculated from transcript in real-time (no backend persistence during session)

**ScoringContext:**
- Purpose: Rich context passed to judge agent for consistent evaluation
- Contains: Pitch stage, mode, rubric definitions, examples, deck text, transcript segments
- Examples: `services/prepAgentService.ts`
- Pattern: Built once per run, passed to all LLM calls to reduce hallucination

## Entry Points

**Root:**
- Location: `app/page.tsx`
- Triggers: User visits `/`
- Responsibilities: Redirects to `/dashboard`

**Dashboard:**
- Location: `app/(app)/dashboard/page.tsx`
- Triggers: User navigates to `/dashboard` or logs in
- Responsibilities: Landing page, run history summary, quick actions

**Session (Live Pitch):**
- Location: `app/(app)/session/page.tsx`
- Triggers: User clicks "Start Session" or navigates to `/session`
- Responsibilities:
  - Initialize media streams (camera, microphone)
  - Manage recording and transcription lifecycle
  - Display real-time metrics and checklist
  - Submit for analysis on stop

**Results:**
- Location: `app/(app)/results/[runId]/page.tsx`
- Triggers: User clicks "View Results" or navigates to `/results/abc123`
- Responsibilities:
  - Poll for analysis completion if run still queued
  - Display feedback, rubric breakdown, fixes, delivery metrics
  - Allow regeneration (QA or rewrite)

**Pitch API:**
- Location: `app/api/pitch/run/route.ts`
- Triggers: `usePitchRun` POST with `CreatePitchRunRequest`
- Responsibilities: Validate, create run record, enqueue analysis, return `CreatePitchRunResponse`

**Pitch GET:**
- Location: `app/api/pitch/run/route.ts` (GET)
- Triggers: History page fetches all runs
- Responsibilities: List completed runs with stats

**Run Detail:**
- Location: `app/api/pitch/run/[runId]/route.ts`
- Triggers: Results page fetches specific run status
- Responsibilities: Poll for completion, return updated run with analysis

## Error Handling

**Strategy:** Graceful degradation with fallback sample result

**Patterns:**
- Controllers validate input before queueing (throw `PitchValidationError`)
- Services catch LLM errors, increment attempt count, retry if retriable (429, 5xx)
- After max retries, use `SAMPLE_RESULT` fallback with `is_fallback: true` flag
- Client displays error banner if response has error field, but shows fallback analysis
- STT errors logged but session continues (user can enter text manually)
- Database errors include migration hints if columns missing

**Try-Catch Locations:**
- `analysisService.analyzePitch()` wraps full pipeline, catches any error and returns fallback
- `anthropic.ts` provider has try-catch with retry logic
- `runService` operations catch Supabase errors and wrap with hint messages
- Hook callbacks (`usePitchRun`, `useSTT`) catch errors and expose via state

**No suppression:** All catch blocks either re-throw, log, or return explicit error state

## Cross-Cutting Concerns

**Logging:**
- Console.log for debug info (transcript chunks, metric updates)
- Telemetry object passed through service chain for latency/attempt tracking
- No structured logging framework (would need to add)

**Validation:**
- Controller layer: Type guards for PitchMode, InputType, PitchStage
- Service layer: Schema validation via destructuring and assertions
- Client layer: Form field validation in components

**Authentication:**
- None in MVP (anonymous public access to Supabase)
- Next.js has no route protection (all app routes public)

**Caching:**
- Analysis cache in `analysisCacheService.ts` keyed by transcript hash
- LLM response deduplication via in-flight tracking
- No HTTP cache headers set

**Type Safety:**
- Strict TypeScript mode enabled
- Branded types for PitchMode, InputType, RunStatus
- Import type used for type-only imports
- No `any` types (use unknown with type guards)

---

*Architecture analysis: 2026-02-22*
