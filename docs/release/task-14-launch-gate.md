# Task 14 - Launch Verification Gate (2026-03-12)

## Command Results

| Command | Run Window (CET) | Exit | Result |
| --- | --- | --- | --- |
| `yarn typecheck` | 11:15-11:16 | `1` | FAIL |
| `yarn test` | 11:16-11:17 | `1` | FAIL |
| `yarn playwright test tests/e2e/smoke.spec.ts` | 11:17-11:18 | `1` | FAIL |

## Key Failure Evidence

### `yarn typecheck`

- `instrumentation-client.ts(15,19): error TS2554: Expected 2 arguments, but got 1.`
- Multiple pre-existing type errors in:
  - `app/(app)/qa/[runId]/page.tsx`
  - `app/(app)/results/[runId]/page.tsx`
  - `services/prepAgentService.ts`
  - `views/components/results/SectionAccordion.tsx`

### `yarn test`

- Failed suite: `tests/analytics-page.test.tsx`
  - Import resolution error for `@/app/(app)/analytics/page`
- Failed test: `lib/supabase/__tests__/middleware.test.ts`
  - `redirects EEA users without compliance completion to /compliance/check`
  - Expected status `307`, received `200`

### `yarn playwright test tests/e2e/smoke.spec.ts`

- Initial run failed because `http://localhost:3000` was already in use.
- Fresh rerun after stopping listeners failed with:
  - `Error: Process from config.webServer exited early.`
- Web server stderr during diagnostic repro included:
  - `ENOENT ... pitchr-next-cache ... vendor-chunks/@opentelemetry.js`

## Gate Verdict

- Launch verification gate status: `FAILED`
- Blocking categories:
  1. TypeScript compile failures
  2. Unit/integration regression failures
  3. Unstable Playwright webServer startup
