# Phase 1: Rubric Context Entry - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a project-level `Rubric & Context` entry flow where users can open a project, enter rubric/context text, and save only valid input (non-empty and within max length). Permissions, run-time layering, and feedback influence behavior are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Section placement
- Place the `Rubric & Context` editor inside each project card on `/projects`.
- Keep it collapsed by default behind an `Edit Rubric & Context` call-to-action.
- Allow only one project editor open at a time to reduce page clutter.
- On mobile, launch a focused full-screen editor view from the card for comfortable long-text editing.

### Validation UX
- Max length is `4,000` characters.
- Show a live character counter (`current/max`) and enforce a hard limit while typing.
- Disable `Save` until the trimmed input is non-empty.
- Show validation errors inline at field level with a red error state.

### Save interaction
- Use explicit manual save (`Save` button), not auto-save.
- Show an `Unsaved changes` status while draft differs from saved value.
- On successful save, show inline success feedback in the editor (e.g., `Saved just now`).
- On failed save, keep draft text, show inline error, and present a `Retry` action.

### Claude's Discretion
- Exact copywriting for helper text and validation messages.
- Visual polish details (icons, spacing, subtle motion) within existing design language.
- Precise success timestamp wording/format.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(app)/projects/page.tsx`: Existing project-card surface and mutation patterns are already in place.
- `views/components/ProjectProvider.tsx`: Existing `updateProject` flow and edge-function wiring for project updates.
- `supabase/functions/projects/index.ts`: Existing authenticated `PATCH` path for project updates.
- `types/project.ts`: Existing project shape includes `promptOverrides` object suitable for project-level text settings.

### Established Patterns
- Project management UX is centered in `/projects` with card-based controls and inline success/error messaging.
- Form controls typically disable actions for invalid input and render local inline errors.
- Styling follows existing themed card/surface patterns (`var(--bg-surface)`, border states, concise action buttons).

### Integration Points
- Add Rubric & Context editing controls into the project-card workflow in `/projects`.
- Persist context through existing project update path (`ProjectProvider` -> Edge `projects` `PATCH`).
- Keep client and API validation aligned for empty/length checks.

</code_context>

<specifics>
## Specific Ideas

- Keep the projects page readable by default; editing should be intentional via a collapsed CTA.
- For mobile, favor focused editor space over cramped inline typing.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-rubric-context-entry*
*Context gathered: 2026-03-05*
