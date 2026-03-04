# Coding Conventions

**Analysis Date:** 2026-03-04

## Naming Patterns

**Files:**
- Next App Router reserved files are used as-is: `app/(app)/dashboard/page.tsx`, `app/(app)/layout.tsx`, `app/api/billing/credits/route.ts`.
- UI component files use PascalCase: `views/components/results/ScoreDashboard.tsx`, `views/components/ProjectSelect.tsx`.
- Hook files use `use` + camelCase: `hooks/usePitchRun.ts`, `hooks/useSessionState.ts`.
- Service files use camelCase, commonly with `Service` suffix: `services/analysisService.ts`, `services/pitchRunQueueService.ts`.
- Type/domain files are lower-case or kebab-case by domain: `types/analysis-v2.ts`, `types/pitch.ts`, `types/deckGeneration.ts`.

**Functions:**
- Exported functions are usually named function declarations (`export async function ...`) in services/routes: `services/runService.ts`, `app/api/deck/generate/route.ts`.
- Internal helpers use `function` declarations with descriptive verbs (`normalizeRubric`, `mergeDeliveryEvents`) in `services/analysisService.ts`.
- Type guards use `isX` naming (`isPitchMode`, `isInputType`) in `controllers/pitchController.ts`.
- API handlers are uppercase HTTP verbs (`GET`, `POST`) in `app/api/**/route.ts`.

**Variables:**
- Local/state variables are camelCase (`runId`, `displayScore`, `allRuns`) in `hooks/usePitchRun.ts` and `views/components/results/ScoreDashboard.tsx`.
- Booleans prefer `is/has/can` prefixes (`isAnalyzing`, `isDeckCategory`, `canPersistSendState`) in `hooks/usePitchRun.ts`, `services/analysisService.ts`, `app/api/waitlist/route.ts`.
- Constants use UPPER_SNAKE_CASE (`SPOKEN_CATEGORY_ORDER`, `VALID_TEMPLATES`, `MAX_EMAIL_LENGTH`) in `services/analysisService.ts`, `app/api/deck/generate/route.ts`, `app/api/waitlist/route.ts`.
- React refs use `Ref` suffix (`rafRef`, `statsRef`, `showTooltipRef`) in `views/components/results/ScoreDashboard.tsx` and `app/(app)/dashboard/page.tsx`.

**Types:**
- Interfaces and type aliases are PascalCase without `I` prefix (`AnalyzePitchInput`, `RunRecord`, `WaitlistInsertRow`) in `services/analysisService.ts`, `services/runService.ts`, `app/api/waitlist/route.ts`.
- Literal union types are used for constrained domain states (`'elevator' | 'vc_pitch'`) in `types/pitch.ts` and validator code in `controllers/pitchController.ts`.
- Type-only imports use `import type` heavily across the repo (example: `services/runService.ts`, `views/components/results/ScoreDashboard.tsx`).

## Code Style

**Formatting:**
- Base formatting is from `.editorconfig`: UTF-8, LF, final newline, 2-space indent, trimmed trailing whitespace (except Markdown).
- Semicolons are used consistently in TS/TSX files (example: `hooks/usePitchRun.ts`, `services/runService.ts`).
- Trailing commas are common in multi-line arrays/objects/params (example: `services/analysisService.ts`, `app/(app)/dashboard/page.tsx`).
- Primary quote style in app TS/TSX is single-quote strings/imports; JSX props use double quotes.
- Some modules use double quotes throughout (notably `app/api/waitlist/route.ts`, `services/miro/__tests__/miroService.integration.test.ts`, `playwright.config.ts`). Preserve local file style when editing those files.

**Linting and Type Checking:**
- No active ESLint config is present (`.eslintrc*` and `eslint.config.*` are absent at repo root).
- Type safety is enforced via `strict: true` in `tsconfig.json`.
- The defined static check command is `yarn typecheck` (`package.json`).

## Import Organization

**Observed order (follow this unless file-local conventions differ):**
1. Framework/core imports (`react`, `next/*`) — e.g., `app/(app)/dashboard/page.tsx`.
2. Third-party packages (`lucide-react`, `@supabase/supabase-js`) — e.g., `services/runService.ts`.
3. Internal alias imports via `@/` — e.g., `services/analysisService.ts`, `hooks/usePitchRun.ts`.
4. Type imports (`import type { ... }`) grouped near related imports — e.g., `controllers/pitchController.ts`.

**Path aliases:**
- `@/*` maps to project root (configured in `tsconfig.json` and `vitest.config.ts`).
- Prefer `@/` imports over long relative traversals for app code.

## Error Handling

**Service/controller layer:**
- Validate early and fail fast with explicit errors (`PitchValidationError` in `controllers/pitchController.ts`).
- Domain-specific error classes extend `Error` (`RunNotFoundError` in `services/runService.ts`).
- Services generally `throw` on persistence/invariant failures with contextual messages (`services/runService.ts`, `services/billingService.ts`).

**API route layer:**
- Wrap handlers in `try/catch` and return structured JSON errors.
- Error response shape should remain `{ error: string }` with explicit status codes (examples: `app/api/billing/credits/route.ts`, `app/api/deck/generate/route.ts`, `app/api/profile/route.ts`).
- Auth failures usually map to `401` (examples: `app/api/billing/credits/route.ts`, `app/api/referral/route.ts`).

**Unknown errors:**
- Narrow unknown values before reading `.message`: `error instanceof Error ? error.message : String(error)` (used in `lib/llm/router.ts`, `hooks/usePitchRun.ts`).

## Logging

**Current approach:**
- Logging uses `console.error`, `console.warn`, and occasional `console.log`; no centralized logger abstraction.
- Prefix log messages with a bracketed scope for filtering (`[billing/credits]`, `[judge-agent]`, `[waitlist]`) in `app/api/billing/credits/route.ts`, `services/judgeAgentService.ts`, `app/api/waitlist/route.ts`.
- Log at integration boundaries (API handlers, queue processors, provider adapters), not inside simple pure helpers.

## Comments

**Patterns in codebase:**
- Section-divider comments are common in larger files: `/* ——— Section ——— */` in `app/(app)/dashboard/page.tsx` and `services/billingService.ts`.
- Short rationale comments are used for non-obvious behavior/fallbacks (example: schema fallback paths in `app/api/waitlist/route.ts`).
- JSDoc is used selectively for API endpoints (`app/api/billing/credits/route.ts`).
- `TODO/FIXME/HACK` markers are currently rare; prefer either immediate fix or tracked issue.

## Function Design

- Favor guard clauses and early returns for validation and branching (examples: `controllers/pitchController.ts`, `app/api/deck/generate/route.ts`).
- Extract small pure helpers for normalization/transforms (`normalizeRubric`, `mergeDeliveryEvents` in `services/analysisService.ts`).
- Use object parameters for multi-field inputs in services (`AnalyzePitchInput` in `services/analysisService.ts`, params objects in `services/billingService.ts`).
- In hooks/components, keep side effects in `useEffect` and memoize callbacks where re-renders matter (`app/(app)/dashboard/page.tsx`, `hooks/usePitchRun.ts`).

## Module Design

**Exports:**
- Named exports are the default for services, hooks, utils, and shared components (examples: `services/runService.ts`, `hooks/usePitchRun.ts`, `views/components/results/ScoreDashboard.tsx`).
- Default exports are expected for Next.js entry files (`page.tsx`, `layout.tsx`, `global-error.tsx`) and a few legacy components (example: `views/components/HeadCoachSandbox.jsx`).

**Barrels:**
- Barrel exports are used selectively where it improves UI import ergonomics (`views/components/ui/index.ts`, `views/components/results/index.ts`).
- Avoid broad barreling for service layers; import service modules directly.

**Client/server boundary:**
- Interactive React files include `'use client';` at top (`hooks/usePitchRun.ts`, `views/components/results/ScoreDashboard.tsx`, `app/(app)/dashboard/page.tsx`).
- API route and server/service files omit it (`app/api/**/route.ts`, `services/**`).

## UI Styling Conventions

- Tailwind utility classes are primary for layout/spacing/typography (`views/components/results/ScoreDashboard.tsx`, `app/(app)/dashboard/page.tsx`).
- Design tokens and theme values are CSS variables in `app/globals.css` (`--bg-surface`, `--text-primary`, `--border-color`, `--blur-strength`).
- Dynamic color/theming values are often applied inline with CSS variables (`style={{ color: 'var(--text-primary)' }}` patterns in `views/components/results/ScoreDashboard.tsx`).
- Glassmorphism/backdrop blur styling is an established visual pattern (`app/globals.css`, `views/components/results/ScoreDashboard.tsx`).

---

*Convention analysis: 2026-03-04*
*Update when patterns change*
