# Roadmap: Pitchr Project-Specific Rubric Context

## Overview

This roadmap delivers project-specific rubric context as a focused extension of Pitchr's existing project and scoring flow. The sequence moves from project-level configuration, to secure ownership controls, to automatic scoring integration, and then to user-visible feedback specificity and UX clarity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Rubric Context Entry** - Users can access project rubric settings and save valid project context text.
- [ ] **Phase 2: Permissioned Context Management** - Only owner/admin can create or update saved project context with edit attribution.
- [ ] **Phase 3: Run-Time Rubric Layering** - Every project run automatically layers saved context onto default rubric with provenance and fallback handling.
- [ ] **Phase 4: Context-Aware Feedback UX** - Feedback and settings messaging clearly reflect project-context influence and behavior.

## Phase Details

### Phase 1: Rubric Context Entry
**Goal**: Users can open a project, enter rubric/context text, and save only valid input.
**Depends on**: Nothing (first phase)
**Requirements**: PRJC-01, PRJC-02, VAL-01
**Success Criteria** (what must be TRUE):
  1. User can open a selected project and find a dedicated `Rubric & Context` section.
  2. User can paste rubric/context text and save it when the text is non-empty and within the configured max length.
  3. User sees clear validation errors for empty or oversized input, and invalid input is not saved.
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md - Shared rubric/context validation contract and edge enforcement
- [ ] 01-02-PLAN.md - Projects page Rubric & Context editor UX, save flow, and integration tests

### Phase 2: Permissioned Context Management
**Goal**: Project rubric/context can only be edited by authorized users, with clear edit attribution.
**Depends on**: Phase 1
**Requirements**: PRJC-03, PERM-01, PERM-02
**Success Criteria** (what must be TRUE):
  1. Project owner/admin can create and update rubric/context for their project.
  2. Non-owner users cannot edit rubric/context through project settings UI.
  3. Unauthorized create/update attempts are rejected through API enforcement.
  4. After a successful save, the project context reflects the latest `updated_at` and `updated_by` attribution.
**Plans**: TBD

### Phase 3: Run-Time Rubric Layering
**Goal**: Scoring runs consistently use project context on top of default rubric, with traceable run provenance and resilient fallback.
**Depends on**: Phase 2
**Requirements**: SCOR-01, SCOR-02, SCOR-04, VAL-03
**Success Criteria** (what must be TRUE):
  1. Every scoring run in a project automatically loads that project's saved rubric/context.
  2. Scoring behavior preserves default rubric baseline while layering project rubric/context on top.
  3. Run details record which rubric/context reference was applied for that specific run.
  4. If project rubric/context is unavailable or invalid at run time, scoring falls back to default rubric and records the fallback event.
**Plans**: TBD

### Phase 4: Context-Aware Feedback UX
**Goal**: Users receive feedback and product messaging that clearly reflects project-specific rubric influence.
**Depends on**: Phase 3
**Requirements**: SCOR-03, VAL-02
**Success Criteria** (what must be TRUE):
  1. Feedback recommendations and critique emphasis reflect project-specific rubric/context rather than generic guidance.
  2. Project settings explicitly state that saved rubric/context is automatically applied to all runs in that project.
  3. Users can observe different critique emphasis when the same pitch is analyzed under different project rubric/context definitions.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rubric Context Entry | 0/2 | Not started | - |
| 2. Permissioned Context Management | 0/TBD | Not started | - |
| 3. Run-Time Rubric Layering | 0/TBD | Not started | - |
| 4. Context-Aware Feedback UX | 0/TBD | Not started | - |
