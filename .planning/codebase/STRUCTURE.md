# Codebase Structure

**Analysis Date:** 2026-03-04

## Directory Layout

```text
pitchr/
├── app/                             # Next.js App Router pages, layouts, and Next API routes
│   ├── (marketing)/                 # Public marketing routes (/, /blog, /privacy, /terms)
│   ├── (auth)/                      # Auth routes (/login, /signup)
│   ├── (public)/                    # Public product routes (/try)
│   ├── (app)/                       # Main signed-in product routes
│   ├── api/                         # Next route handlers (billing, arena, profile, waitlist, etc.)
│   ├── auth/callback/route.ts       # Supabase auth callback handler
│   └── layout.tsx                   # Global HTML shell + theme provider
├── views/components/                # Reusable React UI components and providers
├── hooks/                           # Client state and API/edge integration hooks
├── services/                        # Node-runtime domain/business services
├── lib/                             # Low-level utilities (supabase, llm, prompts, analytics, head tracking)
├── models/                          # Data-access-focused model module(s)
├── types/                           # Shared TypeScript domain contracts
├── config/                          # Product/business constants and config maps
├── supabase/                        # Supabase project config, edge functions, and SQL migrations
│   ├── functions/                   # Deno edge function endpoints + shared modules
│   │   ├── _shared/                # Shared edge-function business/data helpers
│   │   ├── pitch-run/              # Core run creation + async analysis entrypoint
│   │   ├── pitch-run-detail/       # Run fetch/delete endpoint
│   │   ├── projects/               # Project CRUD + active project resolution
│   │   ├── deck-*/                 # Deck upload/list/detail/generate endpoints
│   │   ├── qna-*/                  # Q&A session lifecycle endpoints
│   │   └── settings/               # User settings endpoint
│   └── migrations/                  # Supabase SQL schema history (source of truth)
├── tests/                           # Cross-cutting tests + Playwright e2e
├── content/                         # Blog and weekly content source files
├── knowledge/                       # Curated/snapshotted knowledge assets
├── scripts/                         # Utility/build scripts
├── .planning/                       # GSD planning artifacts and codebase maps
├── middleware.ts                    # Route protection and auth redirects
├── server.ts                        # Local STT sidecar (Express + WS)
├── stt.ts                           # CLI STT utility
├── next.config.ts                   # Next.js config
├── package.json                     # Scripts/dependencies
└── tsconfig.json                    # TypeScript compiler config
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router surface.
- Contains: Route groups, page/layout files, and Next API `route.ts` handlers.
- Key files: `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(marketing)/page.tsx`, `app/auth/callback/route.ts`.
- Subdirectories:
  - `app/(app)/`: product pages such as `app/(app)/session/page.tsx`, `app/(app)/results/[runId]/page.tsx`, `app/(app)/projects/page.tsx`.
  - `app/api/`: Next API handlers including `app/api/billing/*`, `app/api/arena/*`, `app/api/profile/route.ts`, `app/api/waitlist/route.ts`.

**`views/components/`:**
- Purpose: UI building blocks and feature-level presentational components.
- Contains: Generic UI primitives (`views/components/ui/*`), domain widgets (`views/components/results/*`, `views/components/arena/*`), and providers (`views/components/ProjectProvider.tsx`, `views/components/AuthProvider.tsx`).
- Key files: `views/components/SessionCanvas.tsx`, `views/components/MetricsPanel.tsx`, `views/components/ProjectProvider.tsx`.
- Subdirectories: `arena/`, `results/`, `dashboard/`, `onboarding/`, `landing/`, `billing/`, `achievements/`, `deck-pdf/`, `ui/`.

**`hooks/`:**
- Purpose: Client-side orchestration and state.
- Contains: Media/session hooks, API/edge integration hooks, and feature hooks.
- Key files: `hooks/usePitchRun.ts`, `hooks/useSessionState.ts`, `hooks/useSTT.ts`, `hooks/useBilling.ts`, `hooks/useGameMode.ts`.
- Subdirectories: `hooks/__tests__/` for hook tests.

**`services/`:**
- Purpose: Domain/business logic in Node runtime.
- Contains: Analysis/scoring, billing, arena, deck generation, queue orchestration, Miro, Q&A helpers.
- Key files: `services/analysisService.ts`, `services/judgeAgentService.ts`, `services/scoringService.ts`, `services/billingService.ts`, `services/challengeService.ts`, `services/deckGenerationService.ts`.
- Subdirectories: `services/miro/*`, `services/qna/*`, `services/__tests__/*`.

**`lib/`:**
- Purpose: Shared low-level integration and utility modules.
- Contains: Supabase client factories, LLM router/providers, prompt builders, analytics/head-tracking helpers, and public-site metadata utilities.
- Key files: `lib/site.ts`, `lib/metadata/publicPageMetadata.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/fetch-edge.ts`, `lib/llm/router.ts`, `lib/prompts/judge.ts`.
- Subdirectories: `lib/metadata/`, `lib/supabase/`, `lib/llm/`, `lib/prompts/`, `lib/headTracking/`, `lib/review/`.

**`models/`:**
- Purpose: Data-access-centric model modules.
- Contains: `models/userStats.ts` (streaks, badges, leaderboard persistence logic).
- Key files: `models/userStats.ts`.
- Subdirectories: none currently.

**`types/`:**
- Purpose: Shared domain schemas for client/server/edge code.
- Contains: pitch run contracts, analysis schema v2, billing/arena/project/qna types.
- Key files: `types/pitch.ts`, `types/analysis-v2.ts`, `types/arena.ts`, `types/project.ts`, `types/qna.ts`.

**`config/`:**
- Purpose: Product configuration and static constants.
- Contains: mode/rubric/billing/arena/tutorial/try-flow configs.
- Key files: `config/modes.ts`, `config/rubric.ts`, `config/billing.ts`, `config/arena.ts`, `config/sampleResult.ts`.

**`supabase/`:**
- Purpose: Supabase runtime artifacts.
- Contains: edge functions (`supabase/functions/*`), shared edge modules (`supabase/functions/_shared/*`), and SQL migrations (`supabase/migrations/*`).
- Key files: `supabase/config.toml`, `supabase/functions/pitch-run/index.ts`, `supabase/functions/projects/index.ts`.

**`tests/`:**
- Purpose: Cross-cutting test coverage outside co-located `__tests__`.
- Contains: integration/unit tests and e2e specs.
- Key files: `tests/pitch-run-queue.test.ts`, `tests/controller-queue.test.ts`, `tests/e2e/smoke.spec.ts`.

**`content/` and `knowledge/`:**
- Purpose: Source content and reference knowledge.
- Contains: blog markdown/MDX and curated snapshots.
- Key files: `content/blog/*.mdx`, `content/weekly/*.md`, `knowledge/curated/*.md`.

## Key File Locations

**Entry Points:**
- `app/(marketing)/page.tsx`: Root web landing page (`/`).
- `app/(app)/layout.tsx`: Main authenticated app shell (providers + sidebar).
- `middleware.ts`: Request-time auth/redirect middleware.
- `app/auth/callback/route.ts`: Auth code exchange and post-login routing.
- `app/api/*/route.ts`: Next API backend entrypoints.
- `supabase/functions/*/index.ts`: Edge function backend entrypoints.
- `server.ts`: Local STT sidecar entrypoint (`yarn dev:server`).

**Configuration:**
- `package.json`: scripts and dependency graph.
- `next.config.ts`: Next runtime/build behavior.
- `tsconfig.json`: compiler options + path aliases.
- `vitest.config.ts`: unit/integration test runner config.
- `playwright.config.ts`: e2e config.
- `supabase/config.toml`: local Supabase project config.
- `.env.example`: environment variable template.

**Core Logic:**
- `services/analysisService.ts`: Node-side analysis orchestrator.
- `supabase/functions/_shared/analysis-service.ts`: Edge-side analysis orchestrator.
- `services/judgeAgentService.ts`: Judge prompt execution + schema enforcement.
- `services/scoringService.ts`: deterministic score composition.
- `services/billingService.ts`: plan/usage/subscription logic.
- `services/challengeService.ts`: arena challenge domain logic.
- `models/userStats.ts`: stats, streaks, badge, leaderboard DB logic.

**Auth + Data Access:**
- `lib/supabase/client.ts`: browser Supabase client singleton.
- `lib/supabase/server.ts`: server-side Supabase client creator.
- `lib/supabase/admin.ts`: service-role Supabase client.
- `lib/supabase/auth-helpers.ts`: authenticated-user helper for Next API routes.
- `lib/supabase/fetch-edge.ts`: client transport to edge functions with auth headers.
- `lib/site.ts`: shared public site URL, canonical URL, and sitemap route helpers.
- `lib/metadata/publicPageMetadata.ts`: shared public metadata and breadcrumb JSON-LD builders.

**Testing:**
- `services/__tests__/*`: service-level tests.
- `hooks/__tests__/*`: hook-level tests.
- `views/components/**/__tests__/*`: component-level tests.
- `tests/*.test.ts`: integration/regression tests.
- `tests/e2e/*.spec.ts`: Playwright e2e tests.

## Naming Conventions

**Files:**
- Route handlers use `route.ts` (e.g., `app/api/billing/checkout/route.ts`).
- Next pages use `page.tsx` and layouts use `layout.tsx`.
- Hooks use `useX.ts` naming (`hooks/usePitchRun.ts`).
- Services use `*Service.ts` naming (`services/challengeService.ts`).
- Shared edge endpoints use kebab-case directories (`supabase/functions/pitch-run/`).
- Tests use `*.test.ts` / `*.test.tsx` and often live in `__tests__/`.

**Directories:**
- Next route groups use parentheses (e.g., `app/(app)/`, `app/(marketing)/`).
- Feature/domain grouping is preferred under `views/components/*` and `services/*`.
- Edge functions are one directory per endpoint under `supabase/functions/`.

**Special Patterns:**
- `index.ts` is used as edge-function entrypoint in `supabase/functions/*`.
- Placeholder directories are retained with `.gitkeep` in some partially-migrated folders (for example `controllers/deck/.gitkeep`, `app/api/qna/.gitkeep`).

## Where to Add New Code

**New Product Feature (UI + data path):**
- Page/UI: `app/(app)/<feature>/page.tsx` and `views/components/<feature>/*`.
- Client orchestration: `hooks/use<Feature>.ts`.
- Shared types: `types/<feature>.ts` or extend `types/pitch.ts` / `types/analysis-v2.ts`.
- Tests: co-located `__tests__` plus `tests/` integration coverage.

**New Backend Endpoint:**
- Use `supabase/functions/<endpoint>/index.ts` for run/deck/project/qna/settings-style workflows.
- Use `app/api/<domain>/<action>/route.ts` for billing/arena/profile/referral/waitlist/webhook-style workflows.
- Shared edge helper logic: `supabase/functions/_shared/<domain>-service.ts`.
- Node service logic: `services/<domain>Service.ts`.

**New Domain Logic:**
- Primary service implementation: `services/<domain>Service.ts`.
- Low-level provider/integration helpers: `lib/<domain>/*`.
- Model-centric DB operations: `models/<domain>.ts` (if needed).
- Add tests in `services/__tests__/<domain>Service.test.ts` and related integration tests in `tests/`.

**Schema Changes:**
- Add migration in `supabase/migrations/<timestamp>_<name>.sql`.
- Keep edge/shared type mappings in sync (`supabase/functions/_shared/types.ts`, `types/*`).

## Special Directories

**`.next/`:**
- Purpose: Next.js build/cache output.
- Source: generated by `yarn dev` / `yarn build`.
- Committed: No.

**`supabase/.temp/`:**
- Purpose: Supabase CLI local metadata/state.
- Source: generated by Supabase local tooling.
- Committed: Typically no (ephemeral).

**`node_modules/`:**
- Purpose: installed dependencies.
- Source: generated by Yarn.
- Committed: No.

**`controllers/`:**
- Purpose: legacy/partial controller layer from earlier API architecture.
- Source: manually maintained, mostly placeholders except `controllers/pitchController.ts` used by tests/local queue paths.
- Committed: Yes.

**`migrations/` (repo root):**
- Purpose: legacy SQL migration folder retained for compatibility/history.
- Source: manually maintained historic artifacts.
- Committed: Yes (but active schema source is `supabase/migrations/`).

**`pitch backend/`:**
- Purpose: legacy/reference transcript corpus files.
- Source: manually curated text assets.
- Committed: Yes.

---

*Structure analysis: 2026-03-04*
*Update when route groups, API surface split, or Supabase function layout changes*
