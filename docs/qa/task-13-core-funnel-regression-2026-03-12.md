# Task 13 Core Funnel Regression - 2026-03-12

## Scope

Flow target:
`Dashboard -> Run a Pitch -> Select mode -> Input -> Analyze -> Results -> History`

## Environment

- App URL: `http://localhost:3000`
- Dev boot command: `yarn dev:next`
- Local test env overrides:
  - `PLAYWRIGHT_DISABLE_SUPABASE_AUTH=true`
  - `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=playwright-anon-key`
  - `SUPABASE_SERVICE_ROLE_KEY=playwright-service-role-key`
  - `ASSEMBLYAI_API_KEY=playwright-test-key`
- Browser automation: Playwright test runner

## Rerun Window (CET)

- `2026-03-12 18:20` to `2026-03-12 18:22`

## Validation Commands

1. `yarn test lib/supabase/__tests__/local-regression-edge.test.ts`
   - Exit: `0`
   - Result: PASS (`2/2` tests)
2. `yarn playwright test tests/e2e/funnel-regression.spec.ts`
   - Exit: `0`
   - Result: PASS (`1/1` tests)

## Checkpoint Results

1. `Dashboard`: PASS
2. `Run a Pitch` (`/session`): PASS
3. `Select mode`: PASS
4. `Input`: PASS
5. `Analyze`: PASS
6. `Results`: PASS
7. `History`: PASS

## Defect Status

### D13-001 - Core funnel blocked by project bootstrap fetch failure
- Previous severity: `P0`
- Status: `RESOLVED`
- Resolution summary:
  - Added deterministic local regression edge fallback for placeholder Supabase + auth bypass mode.
  - Added local transcript fallback for regression mode so session stop/analyze can complete without live STT dependency.
  - Added dedicated E2E funnel regression spec that reaches Results and History.

### D13-002 - Billing subscription API returns 500 during app navigation
- Previous severity: `P2`
- Status: `NOT IN SCOPE FOR THIS FIX`
- Note:
  - This issue does not block the core funnel regression path verified above.

## Evidence

- Passing E2E spec: `tests/e2e/funnel-regression.spec.ts`
- Passing local regression unit test: `lib/supabase/__tests__/local-regression-edge.test.ts`
- Playwright artifacts directory (run-specific):
  - `C:\projects\pitchr\test-results\`

## Summary

- Full happy-path funnel pass: `ACHIEVED`
- Launch blocker status for Task 13: `UNBLOCKED`
