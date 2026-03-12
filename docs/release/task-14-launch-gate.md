# Task 14 Launch Verification Gate - 2026-03-12

## Required Commands

1. `yarn typecheck`
2. `yarn test`
3. `yarn playwright test tests/e2e/smoke.spec.ts`

## Execution Record (Europe/Amsterdam)

| Command | Start time | Exit code | Result |
| --- | --- | --- | --- |
| `yarn typecheck` | `2026-03-12T11:14:29+01:00` | `1` | FAIL |
| `yarn test` | `2026-03-12T11:15:14+01:00` | `1` | FAIL |
| `yarn playwright test tests/e2e/smoke.spec.ts` | `2026-03-12T11:18:14+01:00` | `1` | FAIL |

## Key Failure Signals

### `yarn typecheck`
- `app/(app)/qa/[runId]/page.tsx(363,61): Cannot find name 'mode'`
- `app/(app)/results/[runId]/page.tsx`: mode map key/type mismatches (`elevator`, `vc_pitch`)
- `instrumentation-client.ts(15,19): TS2554 Expected 2 arguments, but got 1`
- `services/prepAgentService.ts`: section key union mismatches (`demo`, `innovation`, `impact`, etc.)
- `views/components/results/SectionAccordion.tsx`: missing key properties on constrained map type

### `yarn test`
- Suite import failure: `tests/analytics-page.test.tsx` cannot resolve `@/app/(app)/analytics/page`
- Assertion failure: `lib/supabase/__tests__/middleware.test.ts` expected redirect `307`, received `200`

### `yarn playwright test tests/e2e/smoke.spec.ts`
- Blocked before execution:
  - `Error: http://localhost:3000 is already used ... set reuseExistingServer:true in config.webServer.`

## Gate Verdict

Launch verification gate status: `FAIL`  
Fresh required commands were executed and at least one failure occurred in each required gate.
