# Merge Conflict Log

## Purpose
This file is the canonical running log for merge-conflict tracking and conflict-prone integration notes for `C:\dev\pitchr`.

## Latest Snapshot
- Timestamp: `2026-03-07 21:07:00 +01:00`
- Scope: merged latest `origin/main` into `lucasfeature`, then reapplied local analytics/live-feedback changes.
- Conflict marker scan (`<<<<<<<`, `=======`, `>>>>>>>`): **none found** in `*.ts`, `*.tsx`, `*.md`.

## Snapshot History
- Timestamp: `2026-03-07 21:18:00 +01:00`
- Scope: continuation pass for analytics project-link validation + live-feedback/session-beat integration verification.
- Conflict marker scan (`<<<<<<<`, `=======`, `>>>>>>>`): **none found** in `*.ts`, `*.tsx`, `*.md`.
- Timestamp: `2026-03-07 21:07:00 +01:00`
- Scope: `main` -> `lucasfeature` merge + stash reapply.
- Merge commit: `8a74405` (`Merge origin/main into lucasfeature`).
- Real merge conflicts resolved:
  - `supabase/functions/_shared/analysis-service.ts`
  - `supabase/functions/pitch-run/index.ts`
  - `supabase/functions/projects/index.ts`
  - `app/(app)/session/page.tsx` (stash reapply conflict)
- Resolution policy:
  - Kept `main` rate-limit flow (`checkRateLimit`, `RateLimitExceededError`, `rateLimitResponse`) across edge endpoints.
  - Kept lucasfeature rubric-context metadata and project-specific analysis context wiring.
  - Kept duration override support (`targetDurationSeconds`) in analysis pipeline.
  - Kept session pre-config + overtime UI while preserving live rubric + beat progress integration.
- Verification:
  - `yarn vitest tests/analytics-page.test.tsx tests/live-feedback.test.ts tests/use-stt-resume.test.ts services/__tests__/sectionFeedbackService.test.ts views/components/__tests__/MetricsPanel.test.tsx --run` -> passed (13 tests).
  - `yarn typecheck` -> passed.

## Current Integration Conflict Notes
### Live Session Feedback Integration
- Area: `session` live metrics + realtime checklist + new live rubric preview.
- Risk: duplicate sources of truth between session UI state and STT state.
- Resolution: live rubric/beat progress computed from current `session.checklist` + `session.metrics` through one shared pure function.

### Pause/Resume Checklist Reset
- Area: STT websocket resume path.
- Risk: resume sending `session_config` resets server checklist session and appears as beat regression.
- Resolution: resume no longer re-sends `session_config` on an already-open websocket.

### Results Beat Visibility
- Area: results page beat accordion.
- Risk: missing backend `section_feedback` leads to empty beat panel.
- Resolution: deterministic client fallback builds beat sections from transcript + mode when server sections are absent.

### Analytics Project Scoping
- Area: `/analytics` data query for currently active project.
- Risk: accidental regression to all-project aggregation.
- Resolution: verified runtime request includes active `projectId` (`GET /pitch-run?projectId=<active>&summary=true`) and client keeps projectId guard filtering.

## Update Protocol
1. Add a new timestamped snapshot entry after each merge or rebase touching these areas.
2. Record any real marker conflicts and final chosen resolution.
3. Keep this log append-only for auditability.
- Timestamp: `2026-03-07 22:55:00 +01:00`
- Scope: rubric UX simplification + scoring-context plumbing update.
- Conflict-prone files touched:
  - `app/(app)/projects/[projectId]/page.tsx`
  - `views/components/ProjectRubricRequirementsEditor.tsx`
  - `views/components/CreateProjectModal.tsx`
  - `supabase/functions/pitch-run/index.ts`
- Integration note:
  - Removed multi-field project context form from project detail and consolidated rubric/context editing into one saved textarea.
  - Pitch-run now injects project description/target_market/key_metrics/extra_notes into analysis system prompt context so non-rubric notes influence scoring.
- Validation:
  - `yarn typecheck` -> passed.
  - `yarn test tests/projects-rubric-context.test.tsx tests/rubric-policy.test.ts tests/projects-edge-rubric-context.test.ts` -> passed (15 tests).
- Timestamp: `2026-03-08 13:10:00 +01:00`
- Scope: adaptive mode-native scoring runtime + schema-driven results rendering.
- Conflict-prone files touched:
  - `supabase/functions/_shared/analysis-service.ts`
  - `supabase/functions/pitch-run/index.ts`
  - `views/components/results/ResultsPresentation.tsx`
  - `app/(app)/results/[runId]/page.tsx`
  - `types/analysis-v2.ts`
  - `types/adaptive-analysis.ts`
- Integration note:
  - The edge analysis path now compiles a runtime evaluation schema from transcript-derived mode artifacts plus uploaded rubric text, then projects legacy summary fields from adaptive dimension results for backward compatibility.
  - Results rendering now resolves runtime presentation schemas and can render adaptive alert and dimension-group sections without changing the existing visual system.
- Validation:
  - `yarn tsc --noEmit --pretty false` -> passed.
  - `yarn vitest run tests/adaptive-rubric-compiler.test.ts tests/judge-agent-service.test.ts tests/results-presentation.test.tsx tests/run-normalization.test.ts tests/analysis-normalization.test.ts tests/analytics-page.test.tsx tests/history-page.test.tsx` -> passed.
- Timestamp: `2026-03-08 19:36:35 +01:00`
- Scope: merged current `main` into `lucasfeature`, then restored the local adaptive-scoring/results worktree changes.
- Merge commit: `32cf056` (`Merge branch 'main' into lucasfeature`).
- Real merge conflicts resolved:
  - none
- Stash reapply conflicts resolved:
  - none
- Integration note:
  - `main` brought in the blog layout/content refresh, STT/transcription updates, session/history changes, and shared UI additions on top of `lucasfeature`.
  - Local adaptive analysis, results presentation, and schema-generation work reapplied cleanly after the merge without dropping the in-progress files.
- Validation:
  - `rg -n "<<<<<<<|=======|>>>>>>>" -g "*.ts" -g "*.tsx" -g "*.md" .` -> no live conflict markers outside the log's instructional text.
  - `yarn typecheck` -> passed.
  - `yarn test` -> passed (59 files, 330 tests).
- Timestamp: `2026-03-08 20:10:00 +01:00`
- Scope: phase 05-01 public route ownership and landing crawlability handoffs.
- Conflict-prone files:
  - `app/(marketing)/page.tsx`
  - `views/components/landing/LandingClient.tsx`
- Integration note:
  - Added dedicated `/delivery-rubric`, `/scoring-logic`, and `/growth-pricing` marketing routes from the shared public-page shell.
  - Landing navigation, footer, and story handoffs now point to dedicated routes, and launch/blog/pricing teaser content no longer depends on `ssr: false` route gaps.
- Timestamp: `2026-03-08 20:24:27 +01:00`
- Scope: phase 05-02 public SEO and discoverability foundation.
- Conflict-prone files:
  - `app/sitemap.ts`
  - `playwright.config.ts`
  - `tests/public-seo-foundations.test.ts`
- Integration note:
  - Public-route canonical URLs now resolve from the shared site helper used by page metadata, JSON-LD, and sitemap generation.
  - Playwright smoke coverage now depends on `yarn dev` and validates the landing-to-deep-page handoff cluster plus Journal routing.
- Timestamp: `2026-03-10 14:35:00 +01:00`
- Scope: orchestration mediation audit for prelaunch tasks 1-5 integration chain with subagent-generated branch transitions.
- Audit trigger:
  - unexpected branch switches during task execution
  - concurrent subagent edits landing on task branches
- Conflict marker scan (`<<<<<<<`, `=======`, `>>>>>>>`): pending explicit scan (executed in final verification stage).
- Observed integration state:
  - `arav_multi_impl_features` at merge commit `9099c94` (`merge: task5 route protection gaps`).
  - Task branch heads retained for traceability:
    - `codex/mon-task1-app-shell-crash` -> `b866c19`
    - `codex/mon-task2-vercel-analytics-integration` -> `b8fc46b`
    - `codex/mon-task3-playwright-smoke-startup` -> `c26fe79`
    - `codex/tue-task4-middleware-route-parity` -> `258370e`
    - `codex/tue-task5-route-protection-gaps` -> `26bdc3f`
- Resolution policy for mediation:
  - Keep merged commits and audit/integrate; do not rewrite history.
  - Continue remaining work from current head with explicit branch/commit/merge logging.
- Timestamp: `2026-03-10 15:04:14 +01:00`
- Scope: MED-1 unexpected-changes mediator follow-up audit (workspace drift + merge-safety check for ongoing runs).
- Evidence commands:
  - `git status --porcelain=v2 --branch` -> clean worktree/index on `arav_multi_impl_features`; ahead `+22`, behind `0` vs `origin/arav_multi_impl_features`.
  - `git diff --name-status origin/arav_multi_impl_features..HEAD` -> 22-commit delta across app, middleware, tests, and docs.
  - `git merge-tree $(git merge-base HEAD main) main HEAD` -> merge-forecast hotspots: `.gitignore`, `app/layout.tsx` (`changed in both`).
  - `Get-ChildItem -Recurse -File | Select-String -Pattern '^(<<<<<<<|=======|>>>>>>>)'` (excluding `node_modules`) -> no live conflict markers found.
  - `git stash list` -> historical stash entries present on unrelated branches (no active stash apply in progress).
- Unexpected-change assessment:
  - No non-orchestrated file edits currently active in the working tree.
  - Integration risk is concentrated in branch drift and overlap with `main` on shared bootstrap files.
- Mediation policy update:
  - Keep this branch non-destructive; do not reset/rewrite.
  - Before new merges, preflight with `git merge-tree` and resolve `.gitignore` + `app/layout.tsx` first.
  - Continue append-only logging here for every mediation run.
