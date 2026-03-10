# Task 1 Root Cause Note - App Shell Crash and Typecheck Failures

Date: 2026-03-10
Branch: codex/mon-task1-app-shell-crash

## Summary
The app-shell/typecheck failures were caused by a dependency install-state drift, not by incorrect import paths in `app/layout.tsx`.

## Reproduction Evidence
Initial typecheck (before dependency sync):

```bash
yarn typecheck
```

Observed errors:

- `app/layout.tsx(5,31): error TS2307: Cannot find module '@vercel/speed-insights/next'`
- `app/layout.tsx(6,27): error TS2307: Cannot find module '@vercel/analytics/next'`

Additional evidence at the time of failure:

- `node_modules/@vercel` directory was absent.
- `yarn why @vercel/analytics` and `yarn why @vercel/speed-insights` confirmed both dependencies were declared in the workspace graph.

## Root Cause
`package.json` declared `@vercel/analytics` and `@vercel/speed-insights`, but the local install state had not materialized those packages in `node_modules`.

Because `app/layout.tsx` imports from those modules directly, TypeScript and runtime shell boot both fail when install state is stale/incomplete.

## Chosen Fix Path
Task 2 owns implementation hardening. The selected path is:

1. Keep canonical imports in `app/layout.tsx`.
2. Add explicit integration-safety checks so missing `@vercel/*` dependencies fail early with actionable diagnostics.
3. Verify with `yarn typecheck` and homepage smoke load.

## Verification After Sync
Dependency sync command:

```bash
yarn install
```

Post-sync validation:

```bash
yarn typecheck
```

Result: pass.

## Notes
This task intentionally isolates diagnosis from implementation so the remediation and tests are committed in Task 2 on its own branch.
