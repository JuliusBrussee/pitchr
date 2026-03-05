# Architecture

**Analysis Date:** 2026-03-04

## Pattern Overview

**Overall:** Hybrid full-stack architecture: Next.js App Router frontend + dual backend surfaces (Next API routes and Supabase Edge Functions) with shared domain services and types.

**Key Characteristics:**
- UI and navigation run in `app/` with route groups (`app/(marketing)/`, `app/(auth)/`, `app/(public)/`, `app/(app)/`).
- Core pitch/deck/project/Q&A workflows are handled through Supabase Edge Functions (`supabase/functions/*`) and called from the client via `lib/supabase/fetch-edge.ts`.
- Billing, arena gameplay, profile, referral, newsletter, and waitlist endpoints are handled in Next API routes (`app/api/*`).
- Business logic is service-first (`services/*` in Node runtime, `supabase/functions/_shared/*` in edge runtime).
- Supabase is the primary system of record (Postgres + Storage), with request auth and route protection layered by middleware and helper modules.

## Layers

**Presentation Layer (Pages + Components):**
- Purpose: Render product surfaces and coordinate user flows.
- Contains: Route pages in `app/(app)/*`, `app/(marketing)/*`, `app/(auth)/*`, `app/(public)/*`; shared UI in `views/components/*`.
- Depends on: Hooks in `hooks/*`, context providers in `views/components/*Provider*.tsx`, edge/API clients.
- Used by: Browser users.

**Client Orchestration Layer (Hooks + Providers):**
- Purpose: Own session state, API/edge calls, media handling, onboarding/tutorial flow, and project context.
- Contains: `hooks/usePitchRun.ts`, `hooks/useSessionState.ts`, `hooks/useSTT.ts`, `hooks/useRecorder.ts`, `hooks/useBilling.ts`, `hooks/useGameMode.ts`, `views/components/ProjectProvider.tsx`.
- Depends on: `lib/supabase/fetch-edge.ts`, Next API routes (`/api/*`), shared types in `types/*`.
- Used by: Pages and reusable components.

**Node API Layer (Next Route Handlers):**
- Purpose: Handle authenticated app APIs that are currently kept inside Next runtime.
- Contains: `app/api/billing/*`, `app/api/arena/*`, `app/api/profile/route.ts`, `app/api/referral/*`, `app/api/newsletter/unsubscribe/route.ts`, `app/api/waitlist/route.ts`, `app/api/deck/generate/route.ts`, `app/api/blog/posts/route.ts`.
- Depends on: `lib/supabase/auth-helpers.ts`, `lib/supabase/admin.ts`, `services/*`, `models/userStats.ts`.
- Used by: Client `fetch('/api/...')` calls and webhooks/cron callers.

**Edge API Layer (Supabase Functions):**
- Purpose: Handle run lifecycle, deck management, project management, settings, transcription, and Q&A sessions close to Supabase.
- Contains: `supabase/functions/pitch-run/index.ts`, `supabase/functions/pitch-run-detail/index.ts`, `supabase/functions/deck-list/index.ts`, `supabase/functions/deck-upload/index.ts`, `supabase/functions/deck-detail/index.ts`, `supabase/functions/projects/index.ts`, `supabase/functions/settings/index.ts`, `supabase/functions/qna-session/index.ts`, `supabase/functions/transcribe-audio/index.ts`.
- Depends on: `supabase/functions/_shared/*` modules for run/project/billing/analysis/deck behavior.
- Used by: Client `fetchEdge(...)` calls from hooks/pages/components.

**Domain Service Layer:**
- Purpose: Encapsulate business logic and external integrations.
- Contains: `services/analysisService.ts`, `services/judgeAgentService.ts`, `services/prepAgentService.ts`, `services/scoringService.ts`, `services/billingService.ts`, `services/challengeService.ts`, `services/leagueService.ts`, `services/deckGenerationService.ts`.
- Depends on: `lib/llm/*`, `lib/prompts/*`, Supabase clients, config, and type definitions.
- Used by: Next API handlers and (in some legacy/local paths) controllers or queue modules.

**Data + Integration Layer:**
- Purpose: DB/storage access, auth/session primitives, and provider clients.
- Contains:
  - Supabase clients: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
  - Middleware: `middleware.ts`, `lib/supabase/middleware.ts`
  - Data model module: `models/userStats.ts`
  - LLM providers/router: `lib/llm/router.ts`, `lib/llm/providers/anthropic.ts`, `lib/llm/providers/openrouter.ts`
- Depends on: Env vars and external APIs (Supabase, Anthropic/OpenRouter, Stripe, ElevenLabs, Miro).
- Used by: All higher layers.

## Data Flow

**Primary Pitch Analysis Flow (current production path):**
1. User records or uploads in `app/(app)/session/page.tsx` or `app/(app)/upload/page.tsx`.
2. Client submits through `hooks/usePitchRun.ts` using `fetchEdge('pitch-run')`.
3. `supabase/functions/pitch-run/index.ts` validates request, resolves project context, inserts a queued run, and schedules background analysis.
4. Shared analysis logic in `supabase/functions/_shared/analysis-service.ts` calls Claude (and fallback model logic if needed) and computes result payload.
5. Run record is updated to `complete` or `failed` in `runs` table via `supabase/functions/_shared/run-service.ts`.
6. Results page `app/(app)/results/[runId]/page.tsx` polls `fetchEdge('pitch-run-detail')` until finished and renders analysis components.

**Deck + Project Context Flow:**
1. Client loads project context from `views/components/ProjectProvider.tsx` via `fetchEdge('projects')`.
2. Deck list/detail/upload operations call `deck-list`, `deck-detail`, and `deck-upload` edge functions.
3. Run submission can include `projectId`, `deckId`, and resolved deck text for coverage-aware scoring.

**Billing/Arena/Profile Flow (Next API path):**
1. Client hooks use `/api/*` endpoints (e.g., `hooks/useBilling.ts`, `hooks/useGameMode.ts`, `hooks/useReferral.ts`).
2. Route handlers in `app/api/*` authenticate via `getAuthenticatedUser` and perform domain actions using `services/*` and `models/userStats.ts`.
3. Responses return JSON payloads or `{ error: string }` failures.

**Auth and Route Protection:**
1. `middleware.ts` delegates to `lib/supabase/middleware.ts`.
2. Protected routes redirect unauthenticated users to `/login`; auth routes redirect signed-in users to `/dashboard`.
3. `app/auth/callback/route.ts` exchanges Supabase auth code and routes to onboarding or dashboard.

**State Management:**
- Client runtime state: React hooks and providers (`hooks/useSessionState.ts`, `views/components/ProjectProvider.tsx`, `views/components/SidebarContext.tsx`, `views/components/ThemeProvider.tsx`).
- Persistent state: Supabase tables (`runs`, `projects`, `settings`, `decks`, `slides`, billing and arena tables) and Supabase Storage buckets.
- In-memory optimizations: short-lived auth token cache in `lib/supabase/fetch-edge.ts`, in-flight dedup/cache utilities in `services/analysisCacheService.ts`.

## Key Abstractions

**Run:**
- Purpose: Canonical unit for one analyzed pitch.
- Examples: `types/pitch.ts` (`Run`), `supabase/functions/_shared/run-service.ts` (`RunRecord`, `toRunResponse`), `services/runService.ts` (Node-side variant).
- Pattern: Lifecycle state machine (`queued` -> `running` -> `complete`/`failed`) persisted in Supabase.

**Project Context:**
- Purpose: Scope runs/decks/settings to a user-selected project.
- Examples: `types/project.ts`, `supabase/functions/projects/index.ts`, `supabase/functions/_shared/project-service.ts`, `views/components/ProjectProvider.tsx`.
- Pattern: Active-project pointer in settings + explicit `projectId` override on requests.

**Analysis Result V2:**
- Purpose: Structured scoring, fixes, rewrite, delivery metrics, and metadata.
- Examples: `types/analysis-v2.ts`, normalization in `services/analysisNormalizationService.ts`.
- Pattern: Strongly typed JSON contract used by services, edge functions, and UI.

**LLM Router + Provider:**
- Purpose: Separate orchestration from provider-specific HTTP calls.
- Examples: `lib/llm/router.ts`, `lib/llm/providers/anthropic.ts`, `lib/llm/providers/openrouter.ts`.
- Pattern: Provider interface + runtime provider selection via env.

**API Surface Split:**
- Purpose: Separate stable app APIs by runtime concern.
- Examples: Next handlers in `app/api/*` and edge handlers in `supabase/functions/*`.
- Pattern: Next API for billing/arena/profile/webhook flows; edge functions for run/deck/project/qna core workflows.

## Entry Points

**Root Web Entry:**
- Location: `app/(marketing)/page.tsx`
- Triggers: GET `/`
- Responsibilities: Load marketing landing with blog content snippets.

**Protected App Shell:**
- Location: `app/(app)/layout.tsx`
- Triggers: Any `/dashboard`, `/session`, `/history`, `/results/*`, `/projects/*`, etc.
- Responsibilities: Wrap authenticated UX with `AuthProvider`, `SidebarProvider`, `ProjectProvider`, and tutorial context.

**Next API Entry Points:**
- Location: `app/api/*/route.ts`
- Triggers: Client and webhook HTTP calls.
- Responsibilities: Validate/auth requests and call domain services.

**Edge Function Entry Points:**
- Location: `supabase/functions/*/index.ts`
- Triggers: `fetchEdge(functionName)` requests from client.
- Responsibilities: CORS, auth, request validation, Supabase-backed operation execution.

**Auth Callback:**
- Location: `app/auth/callback/route.ts`
- Triggers: Supabase OAuth/email callback.
- Responsibilities: Exchange code for session and route user.

**Local Sidecar (dev/legacy support):**
- Location: `server.ts`
- Triggers: `yarn dev:server`.
- Responsibilities: Express + WebSocket STT proxy and local transcript save flow.

## Error Handling

**Strategy:** Fail-fast validation at boundaries + typed domain errors + graceful analysis fallback/persistence.

**Patterns:**
- Boundary validation in route handlers/edge functions (UUID checks, mode checks, required fields).
- Auth errors normalized to 401 using `AuthenticationError` (`lib/supabase/auth-helpers.ts`, `supabase/functions/_shared/supabase.ts`).
- Domain-specific errors mapped to statuses (for example `ProjectNotFoundError`, `RunNotFoundError`).
- Run pipeline persists failure state (`status='failed'`, `error_message`) rather than silently dropping jobs.
- Most handlers return consistent JSON error envelopes with `{ error: string }`.

## Cross-Cutting Concerns

**Authentication & Authorization:**
- Route protection in `middleware.ts` + `lib/supabase/middleware.ts`.
- Server handlers use Supabase-authenticated user context (`lib/supabase/auth-helpers.ts` and edge `_shared/supabase.ts`).
- RLS is relied on for user-scoped data in edge calls; admin clients are used selectively where elevated access is required.

**Validation:**
- Manual runtime validation is used across handlers and services (no centralized schema library).
- Edge functions and Next routes both enforce strict request shape before DB/LLM calls.

**Observability:**
- Logging is primarily `console.*` in handlers/services/edge functions.
- No centralized tracing pipeline in repository yet.

**Resilience:**
- LLM providers include timeout/retry behavior (`lib/llm/providers/*.ts`, edge analysis service).
- Client edge auth token resolution is cached to reduce repeated session lookups (`lib/supabase/fetch-edge.ts`).
- Analysis normalization provides compatibility for legacy stored payloads (`services/analysisNormalizationService.ts`).

**Testing:**
- Unit/integration tests are split across `services/__tests__/*`, `hooks/__tests__/*`, `views/components/**/__tests__/*`, and root `tests/*`.
- E2E coverage is in `tests/e2e/*` (Playwright).

---

*Architecture analysis: 2026-03-04*
*Update when backend surface split, auth model, or run pipeline changes*
