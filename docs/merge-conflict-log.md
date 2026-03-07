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
