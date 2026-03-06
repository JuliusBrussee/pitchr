# Pitchr: Project-Specific Rubric Context

## What This Is

Pitchr is a pitch coaching app that analyzes user submissions and returns scoring plus actionable feedback. This project adds project-level rubric context so feedback is tailored to the specific rules of a user's target pitch opportunity. The primary user is the pitch submitter configuring context inside each project.

## Core Value

Users get feedback that reflects their actual project-specific rubric and constraints, not generic pitch advice.

## Requirements

### Validated

- ✓ Users can submit a pitch and receive rubric-based analysis feedback - existing
- ✓ Users can review analysis results with score breakdown and recommendations - existing
- ✓ Users can work across multiple projects and navigate project-specific workflows - existing

### Active

- [ ] User can open a specific project and paste project-specific rubric/context text
- [ ] Project owner/admin can create and edit saved rubric/context for that project
- [ ] Saved project rubric/context is automatically layered onto the default rubric for every run in that project
- [ ] Feedback output naturally incorporates project rubric/context so guidance feels specific to the user's pitch rules

### Out of Scope

- File upload and document parsing for rubric ingestion - deferred to a later version
- Per-run include/exclude toggles for project rubric context - deferred; v1 always applies saved context
- Full replacement of the default rubric - deferred; v1 layers custom context on top
- Separate rubric-influence explanation section in output - deferred; v1 integrates influence directly into feedback

## Context

The existing architecture already has a scoring pipeline (`prepAgentService` -> `judgeAgentService` -> `scoringService`) and project-oriented UI surfaces where users manage work. Users report current feedback is helpful but too generic when external pitch programs impose custom rules. Adding saved project rubric/context should increase practical relevance without changing the core run lifecycle.

## Constraints

- **Scope**: V1 is a single project-level text input for rubric/context - keeps implementation focused and shippable quickly
- **Rubric Strategy**: Custom rubric/context layers onto default scoring rubric - preserves baseline consistency
- **Permissions**: Only project owner/admin can edit rubric/context - avoids conflicting edits
- **UX Location**: Configuration lives in project settings from the projects listing flow - keeps navigation intuitive

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use project-level pasted text as rubric/context input in v1 | Fastest path to relevance without file parsing complexity | - Pending |
| Always apply saved project rubric/context for project runs | Reduces cognitive load and keeps behavior predictable | - Pending |
| Keep feedback integration implicit (no separate influence panel) | Prioritizes clean UX while still improving specificity | - Pending |
| Primary user is pitch submitter | Aligns feature design with day-to-day product usage | - Pending |

---
*Last updated: 2026-03-05 after initialization*
