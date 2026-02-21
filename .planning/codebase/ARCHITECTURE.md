# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** MVC (Model-View-Controller) adapted for Next.js App Router

**Key Characteristics:**
- Pages/Routes as view entry points (`app/(app)/*/page.tsx`)
- Controllers orchestrate HTTP operations (`controllers/pitchController.ts`)
- Services encapsulate business logic and LLM orchestration (`services/analysisService.ts`, `services/scoringService.ts`)
- Models handle data persistence via localStorage (MVP stage) (`models/run.ts`)
- Hooks bridge component state and API calls (`hooks/usePitchRun.ts`, `hooks/useSessionState.ts`)

## Layers

**Presentation Layer (Views):**
- Purpose: Render UI and handle user interaction
- Location: `app/(app)/*/page.tsx` (route pages), `views/components/` (reusable components)
- Contains: React components using 'use client' directive, Tailwind CSS styling, form inputs, display logic
- Depends on: Hooks, types, components from `views/components/`
- Used by: Browser/Next.js app router

**Controller Layer:**
- Purpose: Validate HTTP requests, orchestrate API workflows, call services
- Location: `controllers/pitchController.ts`
- Contains: Request validation, service coordination, response formatting
- Depends on: Services (`analysisService`), types
- Used by: API route handlers (`app/api/*/route.ts`)

**Service Layer:**
- Purpose: Implement business logic, coordinate external integrations, manage LLM calls
- Location: `services/analysisService.ts`, `services/scoringService.ts`, `services/claude/`, `services/gemini/`, `services/elevenlabs/`, `services/miro/`
- Contains: Pitch analysis pipeline, delivery metrics calculation, LLM prompting, external service wrappers
- Depends on: LLM router, prompts, types, config
- Used by: Controllers, hooks

**LLM Integration Layer:**
- Purpose: Route requests to configured LLM provider with unified interface
- Location: `lib/llm/router.ts`, `lib/llm/providers/anthropic.ts`, `lib/llm/providers/openrouter.ts`, `lib/llm/types.ts`
- Contains: Provider abstraction, environment-based routing, completion request handling
- Depends on: Provider implementations, types
- Used by: Services (`analysisService`)

**Prompt Layer:**
- Purpose: Define and manage LLM prompts with specialized builders
- Location: `lib/prompts/system.ts`, `lib/prompts/rubric.ts`, `lib/prompts/rewrite.ts`
- Contains: System prompts, rubric evaluation builders, repair/rewrite prompts
- Depends on: Config, types
- Used by: Services (`analysisService`)

**Model Layer (Data):**
- Purpose: Persist and retrieve run data via localStorage
- Location: `models/run.ts`
- Contains: CRUD operations (getRuns, saveRun, deleteRun), validation, stats calculation
- Depends on: Types
- Used by: Hooks (`usePitchRun`), pages

**Hook Layer (Client State Management):**
- Purpose: Bridge component state with API and service calls
- Location: `hooks/usePitchRun.ts`, `hooks/useSessionState.ts`, `hooks/useMediaStream.ts`, `hooks/useSTT.ts`, `hooks/useDeckSlides.ts`
- Contains: State management, async API orchestration, media stream handling, speech-to-text integration
- Depends on: Models, types, services
- Used by: Components and pages

**Configuration Layer:**
- Purpose: Centralize domain-specific constants and configurations
- Location: `config/modes.ts` (pitch modes), `config/rubric.ts` (rubric definitions), `config/sampleResult.ts` (fallback demo data), `config/prompts/` (prompt configs)
- Contains: Pitch mode definitions, rubric category weights, sample analysis results
- Depends on: Types
- Used by: Services, controllers, components

## Data Flow

**Pitch Analysis Flow (Main User Journey):**

1. User enters session page (`app/(app)/session/page.tsx`)
2. Page calls `usePitchRun()` hook to get `runPitchAnalysis()` function
3. User records audio/enters text transcript, clicks submit
4. Hook makes POST request to `/api/pitch/run`
5. API route handler calls `runPitchAnalysisController(body)`
6. Controller validates request, calls `analyzePitch(transcript, mode)` service
7. Service calls `completeWithLlmRouter()` with system prompt + rubric prompt
8. LLM router checks `process.env.LLM_PROVIDER` and routes to provider (anthropic or openrouter)
9. Provider returns JSON analysis result
10. Service calls `calculateDeliveryMetrics()` to extract WPM, filler words, repeated phrases
11. Service returns `AnalysisResult` to controller
12. Controller generates `runId`, returns to hook
13. Hook saves `Run` to localStorage via `saveRun()` model
14. Page redirects to `/results/[runId]`
15. Results page fetches run from localStorage via `getRun(runId)` model
16. Results page displays score breakdown, fixes, rewrite script, delivery metrics

**Session State Flow (Real-time Metrics):**

1. Session page initializes `useSessionState()` hook
2. Hook maintains state for: orbState, metrics, checklist, insights, speechBubbles
3. When session is active, hook runs intervals to simulate live metric updates
4. speechBubbles expire after 4 seconds via cleanup effect
5. Page passes state/setters to `SessionCanvas`, `MetricsPanel`, `SiriBubble` components
6. Components render real-time UI updates

**Storage Flow:**

1. Run data persists only to browser localStorage (MVP)
2. Key: `pitchr_runs` (from `RUN_STORAGE_KEY`)
3. Value: JSON array of Run objects sorted by createdAt desc
4. On save: Run is added/updated to array, array is serialized to JSON, written to localStorage
5. On load: JSON is parsed, validated against Run shape, returned as array
6. On delete: Run is filtered out of array, remaining runs written back

**State Management:**

- Client state: Hooks manage session, media stream, analysis state
- Persistent state: localStorage stores Run objects (analysis results, transcripts)
- Theme state: `ThemeProvider` context manages dark/light mode and orb state
- Sidebar state: `SidebarContext` tracks active session and navigation

## Key Abstractions

**Run (Pitch Attempt Record):**
- Purpose: Encapsulates a single pitch analysis result
- Examples: `types/pitch.ts` (type def), `models/run.ts` (persistence), `hooks/usePitchRun.ts` (creation)
- Pattern: Immutable data structure with id, createdAt, mode, inputType, transcript, audioUrl, analysis, overallScore

**AnalysisResult (LLM Output):**
- Purpose: Structured output from LLM evaluation
- Examples: `types/analysis.ts` (type def), `services/analysisService.ts` (generation), `app/(app)/results/[runId]/page.tsx` (display)
- Pattern: JSON schema enforced by LLM prompt + server-side validation

**PitchMode (Domain Model):**
- Purpose: Differentiates evaluation context and time limits
- Examples: `types/pitch.ts` (type def: 'elevator' | 'vc_pitch'), `config/modes.ts` (mode config with duration limits)
- Pattern: Union type with config lookup to apply mode-specific rubric weights

**RubricScore (Evaluation Category):**
- Purpose: Represents scoring for a single rubric dimension
- Examples: `types/analysis.ts` (type def), `lib/prompts/rubric.ts` (prompt builder), `app/(app)/results/[runId]/page.tsx` (display as breakdown)
- Pattern: Category + score (0-20) + max_score + rationale

**Fix (Actionable Improvement):**
- Purpose: Ranked, prioritized feedback with impact level
- Examples: `types/analysis.ts` (type def), `lib/prompts/rubric.ts` (extracted by LLM), `app/(app)/results/[runId]/page.tsx` (sorted by rank and impact)
- Pattern: rank + category + issue description + fix suggestion + impact level (high/medium/low)

## Entry Points

**Home/Root Page:**
- Location: `app/page.tsx`
- Triggers: User visits /
- Responsibilities: Redirects to /dashboard

**Dashboard (App Root):**
- Location: `app/(app)/dashboard/page.tsx`
- Triggers: User navigates to /dashboard
- Responsibilities: Shows run stats, history list, quick access to session/demo

**Session Page (Recording/Analysis):**
- Location: `app/(app)/session/page.tsx`
- Triggers: User clicks "Start Session" button
- Responsibilities: Orchestrates recording, STT, LLM analysis, displays live metrics via SiriBubble orb

**Results Page (Score Display):**
- Location: `app/(app)/results/[runId]/page.tsx`
- Triggers: User completes analysis or views historical run
- Responsibilities: Loads run from localStorage, displays score breakdown, fixes, rewrite script, delivery metrics

**History Page:**
- Location: `app/(app)/history/page.tsx`
- Triggers: User clicks History in sidebar
- Responsibilities: Lists all past runs with filtering, deletion, sort options

**API: Pitch Run Endpoint:**
- Location: `app/api/pitch/run/route.ts`
- Triggers: POST request from `usePitchRun()` hook
- Responsibilities: JSON validation, calls `runPitchAnalysisController()`, returns analysis result

## Error Handling

**Strategy:** Try-catch at controller layer, fallback to demo result if all LLMs fail

**Patterns:**

- **Request Validation Error:** `PitchValidationError` raised in controller → 400 response with error message
- **LLM Failure:** `completeWithLlmRouter()` fails → service catches, returns fallback result from `SAMPLE_RESULT`
- **API Error Response:** 500 status with error message string in `CreatePitchRunErrorResponse.error`
- **Hook Error Handling:** `usePitchRun()` stores error in state, rethrows to component
- **Component Error Boundaries:** Not implemented (TODO)

**Fallback Strategy:**

1. Try primary LLM provider (anthropic)
2. If fails, try secondary provider (openrouter)
3. If both fail, return cached `SAMPLE_RESULT` from `config/sampleResult.ts`
4. Set `fallback: true` in response to signal UI that result is demo data

## Cross-Cutting Concerns

**Logging:** Not centralized. Console.log calls scattered in services. TODO: implement structured logging.

**Validation:**

- Request validation: `pitchController.ts` validates mode, inputType, transcript length
- Type validation: Zod-like runtime checks in `models/run.ts` (isRun, isAnalysisResult)
- LLM output validation: Prompt engineering + JSON parsing, no formal schema validation

**Authentication:** Not implemented (out of MVP scope)

**Caching:**

- LLM responses: Implicit via localStorage (analyzed runs cached client-side)
- Prompts: Loaded from `lib/prompts/` files (static)
- Config: Loaded from `config/` files (static)

**Error Recovery:**

- Transient LLM failures: Fallback to demo result
- Data corruption: Model layer filters invalid Run objects silently
- State inconsistency: No explicit recovery (TODO)

---

*Architecture analysis: 2026-02-21*
