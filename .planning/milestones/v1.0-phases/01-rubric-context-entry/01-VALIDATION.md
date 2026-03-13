---
phase: 1
slug: rubric-context-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Testing Library |
| **Config file** | `vitest.config.ts` |
| **Quick smoke command** | Use the task-specific command from the Per-Task Verification Map (single behavior target). |
| **Wave-boundary command** | `yarn test -- tests/rubric-context-validation.test.ts tests/projects-edge-rubric-context.test.ts tests/projects-rubric-context.test.tsx` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | Smoke: ~10-25s, wave boundary: ~60-90s |

---

## Sampling Rate

- **After every task commit:** Run the task's targeted smoke command from the table below (single test/single behavior).
- **After every plan wave:** Run `yarn test -- tests/rubric-context-validation.test.ts tests/projects-edge-rubric-context.test.ts tests/projects-rubric-context.test.tsx`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** <=30 seconds for task smoke runs; <=90 seconds for wave-boundary runs.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | VAL-01 | unit | `yarn test -- tests/rubric-context-validation.test.ts -t "Whitespace-only values fail as required input"` | ? pending | ? pending |
| 1-01-02 | 01 | 1 | VAL-01 | edge-handler smoke | `yarn test -- tests/projects-edge-rubric-context.test.ts -t "rejects invalid analysis_system_prompt"` | ? pending | ? pending |
| 1-02-01 | 02 | 2 | PRJC-01 | component | `yarn test -- tests/projects-rubric-context.test.tsx -t "renders a dedicated Rubric & Context section"` | ? pending | ? pending |
| 1-02-02 | 02 | 2 | PRJC-02, VAL-01 | integration | `yarn test -- tests/projects-rubric-context.test.tsx -t "manual save workflow"` | ? pending | ? pending |

*Status: pending | green | red | flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements; no separate Wave 0 bootstrap is required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile full-screen editor focus/ergonomics | PRJC-01 | UI feel and viewport behavior are hard to assert robustly in unit tests | Open `/projects` on mobile viewport, expand rubric editor, verify focused full-screen experience and return path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency <= 30s for per-task smoke commands
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
