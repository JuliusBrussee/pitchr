# Task 1 Root Cause Note - App Shell Crash and Typecheck Failures

Date: 2026-03-10
Branch: codex/mon-task1-app-shell-crash

## 1) Root Cause with Evidence

### Reproduction observed
Running `yarn typecheck` produced:
- `app/layout.tsx(5,31): error TS2307: Cannot find module '@vercel/speed-insights/next'`
- `app/layout.tsx(6,27): error TS2307: Cannot find module '@vercel/analytics/next'`

### Investigation evidence
- `package.json` already declared both dependencies (`@vercel/analytics`, `@vercel/speed-insights`).
- `yarn why @vercel/analytics` and `yarn why @vercel/speed-insights` both resolved to workspace dependencies.
- Before reinstall, `node_modules/@vercel` was absent locally.
- After `yarn install`, `node_modules/@vercel/analytics` and `node_modules/@vercel/speed-insights` were present.
- After install, `yarn typecheck` completed with exit code 0.

### Root cause
The failure was caused by local dependency installation drift (declared dependencies missing from installed modules), not a broken import path in `app/layout.tsx` or a code defect in `instrumentation-client.ts`.

## 2) Fix Path Options

### Option A (recommended): install-state remediation + guardrails
- Keep existing imports in `app/layout.tsx`.
- Enforce install consistency (`yarn install --immutable` in CI/preflight) and run `yarn typecheck` as gate.
- Add operator note to sprint worklog so root cause is not mistaken for code regression.

Pros: minimal risk, no behavior change, aligns with true root cause.
Cons: does not make app resilient to intentionally missing optional packages.

### Option B: code-level optional integration wrappers
- Replace direct Vercel imports with wrappers/no-op fallbacks.
- Add optional type shims.

Pros: can tolerate missing packages.
Cons: adds complexity and divergence from standard Next/Vercel integration despite dependency being required.

Recommendation: Option A.

## 3) Concise Execution Plan (5-8 steps)
1. Confirm failure via `yarn typecheck` and capture exact TS2307 lines.
2. Verify dependency declaration exists in `package.json`.
3. Verify installation state via `yarn why` and `node_modules/@vercel` presence.
4. Repair install state with `yarn install`.
5. Re-run `yarn typecheck` and confirm green.
6. Record root cause and chosen fix path in sprint worklog.
7. Merge diagnostic note branch to base.

## 4) Verification Commands and Expected Results
- `yarn typecheck`
  - Expected (broken install): TS2307 for `@vercel/*/next` in `app/layout.tsx`.
  - Expected (after install repair): exit code 0.
- `yarn why @vercel/analytics && yarn why @vercel/speed-insights`
  - Expected: both resolve as direct workspace deps.
- `Get-ChildItem node_modules/@vercel -Name`
  - Expected: includes `analytics`, `speed-insights`.
