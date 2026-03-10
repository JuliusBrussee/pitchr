# Pitchr Pre-Launch Launch-Readiness Plan (Mon-Fri)

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Ship a stable, test-verified, launch-ready product by Friday, March 13, 2026, with clear UX, reliable core flows, and a triage-ready maintenance posture.

**Architecture:** Focus this week on high-leverage fixes across app shell/runtime stability, route protection and user-facing error states, test/CI guardrails, and launch-day operations. Prioritize blockers first, then risk reducers, then polish.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Playwright, Supabase, Stripe, Sentry.

---

## Evidence Baseline (captured on 2026-03-09)

- `yarn typecheck` fails:
  - `Cannot find module '@vercel/speed-insights/next'`
  - `Cannot find module '@vercel/analytics/next'`
- `yarn playwright test tests/e2e/smoke.spec.ts` fails:
  - `Timed out waiting 120000ms from config.webServer.`
- Browser check (`http://localhost:3000`) returned `Internal Server Error`.
- Route parity drift exists between middleware protection and actual `(app)` routes.
- `docs/.planning` concerns call out:
  - silent deck-load failures
  - missing route parity checks
  - weak abuse protections on public endpoints
  - missing CI workflow in repo root.

---

## Weekly Taskboard (15 Tasks)

### Monday, 2026-03-09 - Stabilize launch blockers

### Task 1: Root-cause the app-shell crash and typecheck failures
**Primary skill:** `systematic-debugging`  
**Why now:** Current localhost shows `Internal Server Error`, and typecheck fails at app layout imports.  
**Deliverable:** Root-cause note + chosen fix path (correct import path vs optionalized integration).  
**Done when:** Repro steps and cause are documented in the PR description/worklog.

### Task 2: Fix Vercel analytics/speed-insights integration
**Primary skill:** `test-driven-development`  
**Related files:** `app/layout.tsx`, `instrumentation-client.ts`, optional `types/*.d.ts` shim if needed.  
**Deliverable:** Build-safe integration that does not break `yarn typecheck` or local runtime.  
**Done when:** `yarn typecheck` passes and homepage loads.

### Task 3: Re-enable deterministic Playwright smoke startup
**Primary skill:** `dev-browser`  
**Related files:** `playwright.config.ts`, possibly scripts/docs for startup assumptions.  
**Deliverable:** Smoke test can boot server reliably and reach app routes.  
**Done when:** `yarn playwright test tests/e2e/smoke.spec.ts` passes at least once locally.

---

### Tuesday, 2026-03-10 - Access control and user-facing error clarity

### Task 4: Add middleware-route parity safety test
**Primary skill:** `test-driven-development`  
**Related files:** `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/__tests__/middleware.test.ts`.  
**Deliverable:** Test that fails when a new protected route is added without middleware parity update.  
**Done when:** Test fails on mismatch and passes on parity.

### Task 5: Close known unprotected-route gaps
**Primary skill:** `systematic-debugging`  
**Related files:** `middleware.ts`, `lib/supabase/middleware.ts`.  
**Scope:** Ensure `(app)` routes like `/upload`, `/arena`, `/progress`, `/setup`, `/orb-preview` are intentionally protected/public by explicit policy, not omission.  
**Done when:** Manual unauth checks redirect consistently or intentionally allow access.

### Task 6: Surface deck-load failures in session/upload flows
**Primary skill:** `test-driven-development`  
**Related files:** `app/(app)/session/page.tsx`, `app/(app)/upload/page.tsx`, related tests in `tests/`.  
**Deliverable:** User-visible error state (toast/inline alert) with retry affordance.  
**Done when:** Failure path has automated test and visible message in browser run.

---

### Wednesday, 2026-03-11 - Reliability and abuse-resilience

### Task 7: Add guardrails for missing STT key in session UX
**Primary skill:** `dev-browser`  
**Related files:** `hooks/useSTT.ts`, session UI components/tests.  
**Deliverable:** Clear disabled state and guidance when `ASSEMBLYAI_API_KEY` is absent.  
**Done when:** Browser run shows explicit user-facing warning and no silent failure.

### Task 8: Harden billing redirect URL construction
**Primary skill:** `systematic-debugging`  
**Related files:** `app/api/billing/checkout/route.ts`, `day-pass/route.ts`, `credits/route.ts`, `portal/route.ts`.  
**Deliverable:** Use allowlisted base URL env var, not raw request origin.  
**Done when:** Invalid origin cannot produce unsafe redirect target; tests cover this.

### Task 9: Add minimal rate-limiting on public write endpoints
**Primary skill:** `test-driven-development`  
**Related files:** `app/api/waitlist/route.ts`, `app/api/newsletter/unsubscribe/route.ts`.  
**Deliverable:** Basic abuse throttling per IP/email key with explicit error response.  
**Done when:** Repeated burst requests are denied predictably and tested.

---

### Thursday, 2026-03-12 - Launch polish and quality gates

### Task 10: Add missing Sentry router transition hook
**Primary skill:** `systematic-debugging`  
**Related files:** `instrumentation-client.ts`.  
**Evidence:** Dev log repeatedly reports required `onRouterTransitionStart` export missing.  
**Done when:** Warning no longer appears in fresh dev boot logs.

### Task 11: Fix local dev origin warning in Next config
**Primary skill:** `systematic-debugging`  
**Related files:** `next.config.ts`.  
**Deliverable:** `allowedDevOrigins` configured for local tooling paths (`localhost`, `127.0.0.1` as needed).  
**Done when:** Warning disappears in dev logs.

### Task 12: Add baseline CI workflow for launch branch
**Primary skill:** `open-source-maintainer`  
**Related files:** `.github/workflows/ci.yml` (new), optionally `README.md`.  
**Deliverable:** CI runs `yarn typecheck`, `yarn test`, and targeted smoke or lint gate.  
**Done when:** Workflow runs green on branch and blocks regressions.

### Task 13: Run browser regression pass on core funnel
**Primary skill:** `dev-browser`  
**Flow:** Dashboard -> Run a Pitch -> Select mode -> Input -> Analyze -> Results -> History.  
**Deliverable:** Short defect list with screenshots + severity tags.  
**Done when:** At least one full happy-path pass is confirmed and defects triaged.

---

### Friday, 2026-03-13 (Launch Day) - Controlled release and rapid response

### Task 14: Final verification gate before public launch
**Primary skill:** `verification-before-completion`  
**Required commands:** `yarn typecheck`, `yarn test`, `yarn playwright test tests/e2e/smoke.spec.ts`.  
**Deliverable:** Launch check record with timestamps and outputs.  
**Done when:** All gates are fresh-green on launch branch.

### Task 15: Release branch completion + support posture
**Primary skills:** `requesting-code-review`, `finishing-a-development-branch`, `open-source-maintainer`  
**Deliverable:** Final review round, merge/PR completion decision, and launch-day triage board (P0/P1/P2 + owner + ETA).  
**Done when:** Branch is finalized with explicit option chosen (merge/PR/hold) and maintenance queue is ready.

---

## Execution Rules (apply to every task this week)

- Start each day with `brainstorming` on that day’s top 2-3 risks/opportunities before coding.
- Use `writing-plans` for any multi-step change cluster before implementation.
- Execute with `executing-plans` in small batches (max 3 tasks) and pause for review.
- Use `test-driven-development` for behavior changes: fail first, then fix.
- Use `systematic-debugging` for every runtime/test failure: evidence first, no guess-fixes.
- Use `verification-before-completion` before claiming task complete.
- Use `requesting-code-review` at end of each batch and before Friday finalization.
- Close with `finishing-a-development-branch` workflow on launch branch.

---

## Suggested Daily Ownership Split

- Product reliability owner: Tasks 1, 2, 3, 10, 11, 14
- API/security owner: Tasks 8, 9, 12
- Frontend UX owner: Tasks 4, 5, 6, 7, 13
- Maintainer/release owner: Task 15

