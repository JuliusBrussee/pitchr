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
- Browser automation: Playwright MCP

## Checkpoint Results

1. `Dashboard`: PASS (page loads, start session entry visible)
2. `Run a Pitch` (`/session`): BLOCKED
3. `Select mode`: BLOCKED (cannot reach mode selection due project gate)
4. `Input`: BLOCKED
5. `Analyze`: BLOCKED
6. `Results`: BLOCKED
7. `History`: PASS (page loads, empty state renders)

## Defects

### D13-001 - Core funnel blocked by project bootstrap fetch failure
- Severity: `P0`
- Area: Session start/project setup
- Repro:
  1. Open `/dashboard`
  2. Click `Start Session`
  3. Land on `/session/select-project?returnTo=/session`
  4. Observe `Failed to fetch` and disabled start path without any project
  5. Attempt project creation from `/projects` -> `Create Project`
  6. Submit form; observe `Failed to fetch` persists and no project is created
- Observed impact:
  - Core funnel cannot progress to mode selection/input/analyze/results.
- Evidence:
  - `C:\projects\pitchr\.tmp\task13-session-select-project-blocked.png`
  - `C:\projects\pitchr\.tmp\task13-project-create-failed.png`
  - Console/network errors include failed requests to `https://example.supabase.co/functions/v1/projects`.
- Suspected root cause:
  - Auth-bypass test environment still depends on a reachable Supabase functions endpoint for project CRUD.

### D13-002 - Billing subscription API returns 500 during app navigation
- Severity: `P2`
- Area: Dashboard/History side calls
- Repro:
  1. Open `/dashboard` or `/history`
  2. Inspect console/network
  3. Observe failed request to `/api/billing/subscription` (500)
- Observed impact:
  - Core UI still renders, but noisy errors and potential billing-state regressions.
- Evidence:
  - `C:\projects\pitchr\.tmp\task13-dashboard-loaded.png`
  - `C:\projects\pitchr\.tmp\task13-history-loaded.png`

## Summary

- Full happy-path funnel pass: `NOT ACHIEVED`
- Blocking reason: project creation/bootstrap fetch failure in current local regression environment.
- Recommendation: unblock project bootstrap for local regression mode (stub/local edge endpoint or resilient offline fallback) before launch gate sign-off.
