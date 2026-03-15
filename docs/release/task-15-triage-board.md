# Task 15 - Launch-Day Triage Board (2026-03-12)

## P0

| ID | Issue | Owner | ETA |
| --- | --- | --- | --- |
| P0-01 | Typecheck failures across app/results/prep + `instrumentation-client.ts` signature mismatch | Frontend + Platform | 4h |
| P0-02 | Playwright smoke gate unstable (`webServer` exits early, cache/vendor-chunk ENOENT path) | DX/Infra | 4h |

## P1

| ID | Issue | Owner | ETA |
| --- | --- | --- | --- |
| P1-01 | `tests/analytics-page.test.tsx` import target missing (`@/app/(app)/analytics/page`) | Frontend | 2h |
| P1-02 | Middleware test regression (`EEA compliance redirect` expected `307`, got `200`) | Backend/Auth | 3h |
| P1-03 | Core funnel blocked in regression env by project bootstrap fetch failure | Backend + QA | 1d |

## P2

| ID | Issue | Owner | ETA |
| --- | --- | --- | --- |
| P2-01 | `/api/billing/subscription` 500 noise during local app navigation | Backend/Billing | 1d |
| P2-02 | Local regression docs/screenshots need centralized storage for repeatable audits | QA | 1d |

## R2 Resolution Notes (2026-03-12)

- P1-01: Unit test target moved from deleted `/analytics` page to current `/insights` page, with expectations updated for current query and range behavior.
- P1-02: Middleware compliance redirect expectation was stale. Compliance flow and `/compliance/check` gating were intentionally removed in commit `2915fb5` ("Remove GDPR compliance flow and routes"); middleware tests now assert auth-only behavior.
