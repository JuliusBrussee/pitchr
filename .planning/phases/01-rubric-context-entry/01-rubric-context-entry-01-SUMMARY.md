---
phase: 01-rubric-context-entry
plan: "01"
subsystem: api
tags: [supabase-edge, validation, vitest, prompt-overrides]
requires: []
provides:
  - Shared rubric/context validation contract for analysis_system_prompt
  - Projects edge POST/PATCH enforcement for trim-empty and max-length input
  - Regression tests for validator behavior and handler-level response mapping
affects: [02-permissioned-context-management, 03-run-time-rubric-layering, context-aware-feedback]
tech-stack:
  added: []
  patterns:
    - "Dependency-free validation helpers shared across UI and edge runtimes"
    - "Edge handlers validate and normalize prompt overrides before persistence"
key-files:
  created:
    - supabase/functions/_shared/rubric-context.ts
    - tests/rubric-context-validation.test.ts
    - tests/projects-edge-rubric-context.test.ts
  modified:
    - supabase/functions/projects/index.ts
    - vitest.config.ts
key-decisions:
  - "Locked rubric/context max length at 4000 characters in shared contract."
  - "Applied validation only when promptOverrides.analysis_system_prompt is present to preserve non-rubric flows."
  - "Mapped Deno npm: supabase specifier to standard package alias in Vitest for edge-handler test execution."
patterns-established:
  - "Shared validators return structured valid/error results and normalized values."
  - "Projects POST/PATCH convert validation failures into 400 responses through ProjectValidationError."
requirements-completed: [VAL-01]
duration: 7min
completed: 2026-03-06
---

# Phase 01 Plan 01: Rubric Context Entry Summary

**Server-side analysis_system_prompt validation now enforces trim/empty/max-length rules and normalizes persisted rubric context through projects POST/PATCH handlers.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-06T10:35:30Z
- **Completed:** 2026-03-06T10:42:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added a runtime-neutral validator contract with a fixed 4,000-character limit and UI character counter helper.
- Integrated validator use in projects POST/PATCH flows so invalid rubric/context payloads return 400 and valid values are trimmed before save.
- Added focused regression tests covering validator behavior and projects edge-handler validation branches.

## Task Commits

Each task was committed atomically.

1. **Task 1: Create shared rubric/context validation contract with tests**
   - `228bf72` (test): failing RED tests for rubric/context validation
   - `bb52373` (feat): shared validator implementation and normalization contract
2. **Task 2: Enforce shared validation in projects POST/PATCH handlers**
   - `fe00636` (test): failing RED handler-level tests for invalid analysis_system_prompt
   - `1ba4a39` (feat): handler integration, normalization behavior, and passing edge-handler tests

## Files Created/Modified

- `supabase/functions/_shared/rubric-context.ts` - Shared max-length, character counter, and save-time validator.
- `supabase/functions/projects/index.ts` - Enforces prompt override validation/normalization in POST and PATCH.
- `tests/rubric-context-validation.test.ts` - Unit-level regression suite for trim/empty/max-length behavior.
- `tests/projects-edge-rubric-context.test.ts` - Handler-level POST/PATCH validation and normalization regression tests.
- `vitest.config.ts` - Resolver alias for Deno `npm:` supabase specifier during Node-based test execution.

## Decisions Made

- Chosen validator API returns structured `{ valid, value|error }` to avoid edge-runtime coupling and keep UI reuse straightforward.
- Validation is triggered only when `analysis_system_prompt` is explicitly present in `promptOverrides`, preserving existing update semantics.
- Retained `ProjectValidationError` mapping so invalid rubric/context payloads uniformly produce `400` error responses.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolved Vitest inability to import Deno `npm:` specifier**
- **Found during:** Task 2 (handler-level test execution)
- **Issue:** `projects/index.ts` transitively imports `supabase.ts`, and Vitest could not resolve `npm:@supabase/supabase-js@^2.97.0`, blocking test execution.
- **Fix:** Added a Vitest resolver alias mapping the Deno specifier to `@supabase/supabase-js`.
- **Files modified:** `vitest.config.ts`
- **Verification:** `yarn test -- tests/projects-edge-rubric-context.test.ts` and wave-boundary test command passed.
- **Committed in:** `1ba4a39`

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** Required to execute handler-level validation tests; no scope creep beyond test runtime compatibility.

## Issues Encountered

- Edge-function Deno imports are not directly Node/Vitest-resolvable without an alias bridge.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- VAL-01 boundary enforcement is complete at server level with regression coverage.
- Next phase can build on this contract for permissioned context management without reworking validation rules.

## Self-Check: PASSED

- Verified required files exist, including summary and all created validation/test files.
- Verified all task commit hashes are present in repository history.

---
*Phase: 01-rubric-context-entry*
*Completed: 2026-03-06*
