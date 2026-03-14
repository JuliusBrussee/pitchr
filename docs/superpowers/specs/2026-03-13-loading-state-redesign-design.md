# Loading State Redesign — Design Spec

## Problem

Three issues with the current "Analyzing your pitch" loading state:

1. **Double overlay** — `AnalyzingOverlay` renders on the session page, then again on the results page (run is still `queued`/`running` when redirected)
2. **Tab-switch re-render** — polling resets visibility-dependent state, causing the overlay to flash when switching tabs
3. **Hard-stuck navigation** — full-screen overlay + `beforeunload` handler blocks all user navigation during analysis

## Design

Replace the blocking full-screen overlay with a non-blocking system: **skeleton results page + sidebar analysis indicator**.

### Flow

**Step 1 — Session page after submit:**
- Remove `AnalyzingOverlay` from the session page entirely
- After `runPitchAnalysis()` succeeds and returns `runId`, show a brief "Pitch submitted!" confirmation state (not a blocking overlay) with two CTAs: "View Progress" (links to `/results/{runId}`) and "Go to Dashboard"
- Redirect to `/results/{runId}` immediately via `router.push()` (same as current behavior — no added delay). The "Pitch submitted!" confirmation is shown as a brief flash before navigation, not a gate.
- Remove the `beforeunload` handler — users can navigate freely

**Step 2 — Results page (skeleton while analyzing):**
- When `run.status` is `queued` or `running`, render a skeleton layout matching the real results structure instead of `AnalyzingOverlay`
- Skeleton includes: score circle placeholder, rubric category cards (2x2 grid), top fixes placeholder — all with coral shimmer animation
- An inline progress indicator at the bottom of the skeleton shows the current analysis step (reusing the step labels from `AnalyzingOverlay`) with a spinner and time estimate
- Polling continues as-is but the skeleton state is visually stable — no re-renders on tab switch because we're not toggling overlay visibility
- When analysis completes, skeleton transitions to real results (existing card entrance animations apply)

**Step 3 — Sidebar analysis indicator:**
- Add a new item to the sidebar (between nav items and tools section, or as an overlay on the Session nav item) that appears only during active analysis
- Visual: pulsing coral gradient icon with a spinner, labeled "Analyzing..."
- Clicking it navigates to `/results/{runId}` — the indicator acts as a persistent link to the in-progress analysis
- When analysis completes: icon turns green with a checkmark, label changes to "Results ready!", persists for ~5s then fades away
- When analysis fails: icon turns red with an X, label shows "Analysis failed", links to the failed results page
- This indicator is visible on every page — dashboard, history, settings, etc.

**Step 4 — Session page blocked during analysis:**
- While a run is `queued` or `running`, the "Start Session" button in the sidebar is disabled
- Tooltip on hover: "Analysis in progress"
- The session page itself shows a message: "Your current pitch is being analyzed. You can start a new session once it completes."
- This prevents starting a new recording while one is still processing

### State Management

Add an `AnalysisTracker` context provider (nested inside `AuthProvider` in `layout.tsx`, since it needs `fetchEdge`):

```typescript
interface AnalysisTrackerState {
  activeRunId: string | null;
  activeRun: Run | null;
  activeRunStatus: RunStatus | null;
  isPolling: boolean;
  error: string | null;
  startTracking: (runId: string) => void;
  stopTracking: () => void;
}
```

- `startTracking(runId)` is called from the session page after `runPitchAnalysis()` returns
- The tracker polls `pitch-run-detail` for status updates (reusing the same polling logic from the results page, extracted to a shared hook)
- When status reaches `complete` or `failed`, it stops polling and fires a `billing:refresh` event
- `stopTracking()` is called by a `useEffect` timer inside `SidebarAnalysisIndicator` ~5s after completion, or on manual dismiss. Since the sidebar is always mounted, this cleanup is reliable.

**Polling ownership protocol:** The tracker is the single owner of polling for active runs. The results page NEVER starts its own poll when `tracker.activeRunId === runId`. Instead, it reads `tracker.activeRun` directly. The results page only runs its own `useRunPoller` for historical runs (where `tracker.activeRunId` is null or differs from the page's `runId`). This is enforced by passing `enabled: tracker.activeRunId !== runId` to `useRunPoller`.

**Orb state:** The session page resets `session.setOrbState('idle')` before redirecting. The orb is not tied to the tracker.

### Shared Polling Hook

Extract polling logic from the results page into a reusable hook:

```typescript
function useRunPoller(runId: string | null, options?: {
  enabled?: boolean;  // default true — set false to skip polling
}): {
  run: Run | null;
  status: RunStatus | null;
  loading: boolean;
  error: string | null;
}
```

Preserves configurable polling intervals via `getRunPollMs()` (reads from env vars).

This hook is used by both:
- `AnalysisTracker` (global polling, runs everywhere)
- Results page (passes `enabled: tracker.activeRunId !== runId` — only polls for historical runs)

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AnalysisTracker` (context) | `views/components/AnalysisTrackerProvider.tsx` | Global analysis state + polling |
| `useRunPoller` (hook) | `hooks/useRunPoller.ts` | Shared polling logic |
| `SidebarAnalysisIndicator` | `views/components/SidebarAnalysisIndicator.tsx` | Sidebar icon during analysis |
| `ResultsSkeleton` | `views/components/results/ResultsSkeleton.tsx` | Skeleton UI for results page |
| `AnalysisStepIndicator` | `views/components/results/AnalysisStepIndicator.tsx` | Inline step progress (replaces full overlay) |

### Files Modified

| File | Change |
|------|--------|
| `app/(app)/session/page.tsx` | Remove `AnalyzingOverlay`, remove `beforeunload`, add `startTracking()`, show confirmation state |
| `app/(app)/results/[runId]/page.tsx` | Replace `AnalyzingOverlay` with `ResultsSkeleton`, consume `AnalysisTracker` |
| `views/components/AppSidebar.tsx` | Add `SidebarAnalysisIndicator` |
| `views/components/StartSessionButton.tsx` | Disable when `activeRunId` exists |
| `app/(app)/layout.tsx` | Wrap with `AnalysisTrackerProvider` |

### Files Removed

| File | Reason |
|------|--------|
| `views/components/AnalyzingOverlay.tsx` | Replaced by skeleton + sidebar indicator |

### Visual Design

**Skeleton shimmer:** Uses CSS custom properties (`--shimmer-base`, `--shimmer-highlight`) that respect dark/light theme, defaulting to coral-tinted values in dark mode. Slides left-to-right over placeholder blocks.

**Sidebar indicator:**
- Active: coral gradient background (`linear-gradient(135deg, #ff5941, #ffaa33)`), white spinner inside, pulsing dot badge
- Complete: green background (`#22c55e`), white checkmark
- Failed: red background (`#ef4444`), white X icon

**Step indicator on results skeleton:** Coral-tinted banner (`rgba(255, 89, 65, 0.08)` background, `rgba(255, 89, 65, 0.15)` border) with spinner and step label.

### Edge Cases

- **Multiple tabs:** `AnalysisTracker` persists `activeRunId` to `localStorage`. Each tab polls independently (no leader election — simplicity over efficiency). The polling is lightweight (one GET every 2-8s) and the edge function is cached, so duplicate polls are acceptable.
- **Page refresh during analysis:** Tracker checks `localStorage` for `activeRunId` on mount, resumes tracking if found.
- **Analysis completes while on different page:** Sidebar indicator shows "Results ready!" — clicking navigates to results.
- **Network failure during polling:** Same exponential backoff + 90s timeout as current implementation. Sidebar indicator shows error state.
- **User starts new session before previous completes:** Blocked by disabled "Start Session" button + session page message.
