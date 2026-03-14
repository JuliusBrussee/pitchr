# Phase 1: Rubric Context Entry - Research

**Researched:** 2026-03-05
**Domain:** Project-scoped rubric/context configuration UX and validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Section placement
- Place the `Rubric & Context` editor inside each project card on `/projects`.
- Keep it collapsed by default behind an `Edit Rubric & Context` call-to-action.
- Allow only one project editor open at a time to reduce page clutter.
- On mobile, launch a focused full-screen editor view from the card for comfortable long-text editing.

#### Validation UX
- Max length is `4,000` characters.
- Show a live character counter (`current/max`) and enforce a hard limit while typing.
- Disable `Save` until the trimmed input is non-empty.
- Show validation errors inline at field level with a red error state.

#### Save interaction
- Use explicit manual save (`Save` button), not auto-save.
- Show an `Unsaved changes` status while draft differs from saved value.
- On successful save, show inline success feedback in the editor (e.g., `Saved just now`).
- On failed save, keep draft text, show inline error, and present a `Retry` action.

### Claude's Discretion
- Exact copywriting for helper text and validation messages.
- Visual polish details (icons, spacing, subtle motion) within existing design language.
- Precise success timestamp wording/format.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRJC-01 | User can open a selected project and access a dedicated `Rubric & Context` configuration section. | Reuse `app/(app)/projects/page.tsx` card surface and add collapsible per-project editor with single-open behavior. |
| PRJC-02 | User can paste project-specific rubric/context text and save it to that project. | Persist via existing `ProjectProvider.updateProject` -> edge `projects` `PATCH` path using `promptOverrides`. |
| VAL-01 | System validates rubric/context input as non-empty and within configured max length. | Enforce validation in UI and edge function; block save on invalid input; return inline actionable errors. |
</phase_requirements>

## Summary

Phase 1 should be implemented as an extension of the existing `/projects` card workflow, not a new route family or a new backend surface. The codebase already has end-to-end project mutation plumbing (`ProjectProvider` + `supabase/functions/projects`) and a persisted `prompt_overrides` JSONB column that is already consumed downstream by pitch runs.

The key implementation risk is validation drift between UI and edge function. The UI must hard-limit input at 4,000 chars and disable save for trimmed-empty text, but the edge function must enforce the same constraints to prevent bypass. Keep save explicit/manual and preserve draft text on failures.

The second risk is accidental `promptOverrides` clobbering. `updateProject` writes `prompt_overrides` as a full object payload, so sending only one key can overwrite sibling overrides. Merge existing overrides with the rubric/context key before PATCH.

**Primary recommendation:** Implement with existing stack and APIs, add shared validation constants, and enforce identical rules in client + edge before wiring UI polish.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `^15.0.3` | Projects page UI surface (`app/(app)/projects/page.tsx`) | Existing app-router page already owns project CRUD UX. |
| `react` | `^19.0.0` | Controlled textarea/editor state and validation state | Current forms in codebase already use this pattern. |
| `@supabase/supabase-js` (edge import) | `^2.97.0` | Persist project updates via edge function | Existing authenticated edge pipeline already in use. |
| Supabase Edge Function `projects` | repo-managed | Server-side validation + persistence for project updates | Avoids introducing duplicate API layers. |
| PostgreSQL `projects.prompt_overrides` JSONB | migration `20260226000003` | Storage for per-project rubric/context text | Already present and used by run-time prompt override flow. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^0.575.0` | Inline status and affordance icons | For save status / error affordances in editor card UI. |
| `vitest` | `^4.0.18` | Unit/integration verification | For UI validation logic and provider mutation behavior. |
| `@testing-library/react` | `^16.3.2` | User-behavior component tests | For CTA expand/collapse, save enablement, and error rendering tests. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local controlled state + existing provider | `react-hook-form` + schema lib | More abstraction than needed for a single textarea field in phase scope. |
| Existing edge `projects` PATCH | New `/api/projects/rubric` route | Duplicates auth/validation/persistence path and increases maintenance. |
| Manual save (locked decision) | Debounced auto-save | Conflicts with explicit UX decision and makes error/retry state harder to reason about. |

**Installation:**
```bash
# No new dependencies required for Phase 1.
```

## Architecture Patterns

### Recommended Project Structure
```
app/
`-- (app)/
    `-- projects/
        `-- page.tsx                      # Card UI, editor open-state, save UX
views/
`-- components/
    `-- ProjectProvider.tsx               # Existing updateProject integration
supabase/
`-- functions/
    `-- projects/
        `-- index.ts                      # Server validation + PATCH persistence
types/
`-- project.ts                            # Prompt override typing surface
```

### Pattern 1: Card-Scoped Editor State (Single Open Editor)
**What:** Keep editor draft/save state local to `/projects` page and key it by project ID, with one editor open at a time.
**When to use:** Any per-project edit flow shown inline in cards.
**Example:**
```typescript
// Source: app/(app)/projects/page.tsx, views/components/ProjectProvider.tsx
const [openProjectId, setOpenProjectId] = useState<string | null>(null);
const [draftByProjectId, setDraftByProjectId] = useState<Record<string, string>>({});

function openEditor(projectId: string, initialValue: string) {
  setOpenProjectId(projectId);
  setDraftByProjectId((prev) => ({ ...prev, [projectId]: initialValue }));
}
```

### Pattern 2: Dual-Layer Validation (Client + Edge)
**What:** Enforce identical rules in UI and API (`trim().length > 0`, `length <= 4000`).
**When to use:** Any user-controlled text persisted through edge functions.
**Example:**
```typescript
// Source: supabase/functions/projects/index.ts, app/(app)/session/page.tsx
const RUBRIC_MAX_CHARS = 4_000;

function validateRubricContext(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('Rubric/context must be a string.');
  const value = raw.trim();
  if (value.length === 0) throw new Error('Rubric/context is required.');
  if (value.length > RUBRIC_MAX_CHARS) {
    throw new Error(`Rubric/context must be ${RUBRIC_MAX_CHARS} characters or less.`);
  }
  return value;
}
```

### Pattern 3: Safe Prompt Overrides Merge
**What:** Merge existing `promptOverrides` instead of replacing the object.
**When to use:** Updating one override key in a shared JSONB object.
**Example:**
```typescript
// Source: views/components/ProjectProvider.tsx, supabase/functions/_shared/project-service.ts
await updateProject({
  projectId: project.id,
  promptOverrides: {
    ...project.promptOverrides,
    analysis_system_prompt: nextRubricContext,
  },
});
```

### Anti-Patterns to Avoid
- **Client-only validation:** Invalid payloads can still be sent directly to edge endpoint.
- **Object replacement without merge:** Overwrites unrelated prompt override keys.
- **Auto-save in this phase:** Violates locked UX decision and complicates retry semantics.
- **Separate route/state silo for mobile editor:** Creates parity drift; use same validation + save path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| New persistence endpoint | Custom rubric-specific API route | Existing `projects` edge `PATCH` | Current path already handles auth, project scoping, and update semantics. |
| Rich text editor | Custom markdown/WYSIWYG editor | Native controlled `<textarea>` | Phase goal is plain text entry + validation, not formatting features. |
| Custom notification bus | Global toast state machine | Inline success/error state in card | Current projects UX already uses inline mutation feedback patterns. |
| Custom project metadata table | New DB column set for v1 text only | Existing `prompt_overrides` JSONB | Avoids migration complexity in first phase while preserving future flexibility. |

**Key insight:** Phase 1 is a workflow wiring problem, not a platform redesign; reuse current project mutation and validation primitives.

## Common Pitfalls

### Pitfall 1: Validation Rule Mismatch
**What goes wrong:** UI blocks invalid text, but API still accepts it (or vice versa).
**Why it happens:** Rules duplicated ad hoc across files.
**How to avoid:** Define one shared max constant and mirror exact checks in both layers.
**Warning signs:** Bug reports where direct API calls save invalid text, or UI blocks valid input.

### Pitfall 2: Whitespace-Only Inputs Saved
**What goes wrong:** User saves `"   "` and later sees blank rubric unexpectedly applied.
**Why it happens:** Length checks run before trim normalization.
**How to avoid:** Always validate on trimmed text for emptiness and save trimmed value.
**Warning signs:** Stored values appear non-empty in DB but render blank in UI.

### Pitfall 3: Overwriting Existing Prompt Overrides
**What goes wrong:** Saving rubric/context clears other keys in `prompt_overrides`.
**Why it happens:** PATCH sends a partial object without merging.
**How to avoid:** Merge with existing `project.promptOverrides` before update.
**Warning signs:** Non-rubric project behaviors regress after saving context.

### Pitfall 4: Save-State UX Desynchronization
**What goes wrong:** `Saved` state appears when request actually failed or when draft changed after save.
**Why it happens:** Success/error flags not tied to draft-vs-saved diff.
**How to avoid:** Track `savedValue` and compute dirty state from current draft.
**Warning signs:** Users see `Saved just now` while still having unsaved edits.

## Code Examples

Verified patterns from current codebase:

### Existing Edge Mutation Flow (Client)
```typescript
// Source: views/components/ProjectProvider.tsx
const response = await fetchEdge('projects', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(input),
});
```

### Existing Length-Guard Pattern (Client)
```typescript
// Source: app/(app)/session/page.tsx
const MAX_TRANSCRIPT_CHARS = 50_000;
if (transcript.length > MAX_TRANSCRIPT_CHARS) {
  setAnalysisError(`Transcript is too long (...)`);
  return;
}
```

### Existing Strict Payload Validation Pattern (Edge)
```typescript
// Source: supabase/functions/miro-fix-board/index.ts
if (typeof patch.notes !== 'undefined') {
  if (typeof patch.notes !== 'string') return false;
  if (patch.notes.length > 600) return false;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic scoring prompt without project-specific override entry UX | Project-scoped prompt overrides persisted on `projects.prompt_overrides` and consumed in pitch-run | Migration `20260226000003` and current `pitch-run` edge logic | Phase 1 can focus on editor/validation because persistence and runtime consumption path already exists. |
| Legacy `/api/*` implementations for several features | Edge-function-first flow (comments in edge files mark route replacements) | 2026 edge migration wave | Keep Phase 1 in edge path for consistency and lower integration risk. |

**Deprecated/outdated:**
- Building new Next.js API handlers for project rubric persistence in this phase: use `supabase/functions/projects` instead.

## Open Questions

1. **Canonical key naming for rubric/context**
   - What we know: Existing runtime reads `prompt_overrides.analysis_system_prompt`.
   - What's unclear: Whether product wants a new semantic key (e.g., `rubric_context`) now or later.
   - Recommendation: Keep `analysis_system_prompt` in Phase 1, defer key migration to a later compatibility phase.

2. **Mobile full-screen editor implementation mechanism**
   - What we know: Locked decision requires focused full-screen editor on mobile.
   - What's unclear: Route-based view (`/projects/[id]/rubric`) vs modal/drawer implementation.
   - Recommendation: Prefer in-page full-screen overlay/modal first to avoid routing churn in Phase 1.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.0.18` + Testing Library |
| Config file | `vitest.config.ts` |
| Quick run command | `yarn test -- tests/projects-rubric-context.test.tsx` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRJC-01 | Projects page exposes dedicated `Rubric & Context` section and expandable editor per card | component/integration | `yarn test -- tests/projects-rubric-context.test.tsx -t "renders Rubric & Context section"` | NO - Wave 0 |
| PRJC-02 | Valid non-empty <= 4000 text can be saved for selected project | component/integration | `yarn test -- tests/projects-rubric-context.test.tsx -t "saves valid rubric context"` | NO - Wave 0 |
| VAL-01 | Empty/oversized inputs show inline errors and block persistence | unit + component | `yarn test -- lib/projects/__tests__/rubricValidation.test.ts tests/projects-rubric-context.test.tsx -t "validation"` | NO - Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test -- tests/projects-rubric-context.test.tsx`
- **Per wave merge:** `yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/projects-rubric-context.test.tsx` - covers PRJC-01, PRJC-02, VAL-01 UI behavior
- [ ] `lib/projects/rubricValidation.ts` + `lib/projects/__tests__/rubricValidation.test.ts` - shared validation logic and unit tests
- [ ] `supabase/functions/projects` validation coverage (either extracted pure validator testable in Vitest or Deno-native edge tests) - ensures API parity with UI rules

## Sources

### Primary (HIGH confidence)
- [C:/dev/pitchr/.planning/phases/01-rubric-context-entry/01-CONTEXT.md](C:/dev/pitchr/.planning/phases/01-rubric-context-entry/01-CONTEXT.md) - locked decisions and phase boundary
- [C:/dev/pitchr/.planning/REQUIREMENTS.md](C:/dev/pitchr/.planning/REQUIREMENTS.md) - requirement IDs and acceptance scope
- [C:/dev/pitchr/app/(app)/projects/page.tsx](C:/dev/pitchr/app/(app)/projects/page.tsx) - target UI integration surface
- [C:/dev/pitchr/views/components/ProjectProvider.tsx](C:/dev/pitchr/views/components/ProjectProvider.tsx) - update pipeline and mutation pattern
- [C:/dev/pitchr/supabase/functions/projects/index.ts](C:/dev/pitchr/supabase/functions/projects/index.ts) - server request validation and PATCH endpoint
- [C:/dev/pitchr/supabase/functions/_shared/project-service.ts](C:/dev/pitchr/supabase/functions/_shared/project-service.ts) - `prompt_overrides` persistence semantics
- [C:/dev/pitchr/supabase/functions/pitch-run/index.ts](C:/dev/pitchr/supabase/functions/pitch-run/index.ts) - current runtime consumption of `analysis_system_prompt`
- [C:/dev/pitchr/supabase/migrations/20260226000003_projects_and_project_scoping.sql](C:/dev/pitchr/supabase/migrations/20260226000003_projects_and_project_scoping.sql) - projects schema and RLS
- https://react.dev/reference/react-dom/components/textarea - textarea API (`maxLength`, controlled inputs)
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/maxlength - browser-level max length behavior
- https://supabase.com/docs/guides/functions - edge function runtime and patterns

### Secondary (MEDIUM confidence)
- [C:/dev/pitchr/.planning/codebase/TESTING.md](C:/dev/pitchr/.planning/codebase/TESTING.md) - test conventions (helpful, but may lag code reality)
- [C:/dev/pitchr/.planning/codebase/CONVENTIONS.md](C:/dev/pitchr/.planning/codebase/CONVENTIONS.md) - style conventions summary

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Directly observed in `package.json`, existing pages, and edge function paths
- Architecture: HIGH - Derived from active code paths already used for project updates
- Pitfalls: HIGH - Based on concrete current behavior (`prompt_overrides` replacement semantics, dual-layer validation patterns)

**Research date:** 2026-03-05
**Valid until:** 2026-04-04
