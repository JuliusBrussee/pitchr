# Loading State Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blocking full-screen `AnalyzingOverlay` with a non-blocking system: skeleton results page + sidebar analysis indicator + global `AnalysisTracker` context.

**Architecture:** Extract polling into a shared `useRunPoller` hook, add an `AnalysisTrackerProvider` context that owns global polling and persists state to localStorage, then wire up three new visual components (ResultsSkeleton, AnalysisStepIndicator, SidebarAnalysisIndicator). The session page calls `startTracking(runId)` immediately after submitting and navigates away without blocking.

**Tech Stack:** React context, Vitest + @testing-library/react, Tailwind, CSS custom properties, lucide-react icons, localStorage for persistence.

---

## Chunk 1: Shared Polling Hook

### Task 1: Extract `useRunPoller` hook

**Files:**
- Create: `hooks/useRunPoller.ts`
- Create: `hooks/__tests__/useRunPoller.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// hooks/__tests__/useRunPoller.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunPoller } from '@/hooks/useRunPoller';

const mockFetchEdge = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
}));

function makeRunResponse(status: string, overrides = {}) {
  return new Response(
    JSON.stringify({ run: { id: 'run-1', status, overallScore: 0, ...overrides } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('useRunPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null run when runId is null', () => {
    const { result } = renderHook(() => useRunPoller(null));
    expect(result.current.run).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });

  it('does not poll when enabled=false', () => {
    renderHook(() => useRunPoller('run-1', { enabled: false }));
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });

  it('fetches run on mount when enabled=true', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.run?.status).toBe('complete');
    expect(result.current.error).toBeNull();
  });

  it('sets loading=true while queued/running and schedules next poll', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(mockFetchEdge).toHaveBeenCalledTimes(1));
    expect(result.current.run?.status).toBe('queued');
    expect(result.current.loading).toBe(true);
    // Advance timer to trigger next poll
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    await act(async () => { vi.advanceTimersByTime(3000); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.run?.status).toBe('complete');
  });

  it('sets error on non-ok response', async () => {
    mockFetchEdge.mockResolvedValue(new Response('{}', { status: 500 }));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.run).toBeNull();
  });

  it('stops polling when enabled changes to false', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result, rerender } = renderHook(
      ({ enabled }) => useRunPoller('run-1', { enabled }),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(mockFetchEdge).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });
    vi.clearAllMocks();
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test hooks/__tests__/useRunPoller.test.ts
```

Expected: FAIL with "Cannot find module '@/hooks/useRunPoller'"

- [ ] **Step 3: Implement `useRunPoller`**

`getRunPollMs` is copied from the results page (to be deleted from there later).

```typescript
// hooks/useRunPoller.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { Run, RunStatus } from '@/types/pitch';

function getRunPollMs(): { initial: number; max: number; step: number } {
  const initialRaw = process.env.NEXT_PUBLIC_RUN_POLL_INITIAL_MS;
  const maxRaw = process.env.NEXT_PUBLIC_RUN_POLL_MAX_MS;
  const stepRaw = process.env.NEXT_PUBLIC_RUN_POLL_STEP_MS;
  const initial = Number.parseInt(initialRaw ?? '', 10);
  const max = Number.parseInt(maxRaw ?? '', 10);
  const step = Number.parseInt(stepRaw ?? '', 10);
  return {
    initial: Number.isFinite(initial) && initial >= 1_000 ? initial : 2_000,
    max: Number.isFinite(max) && max >= 2_000 ? max : 8_000,
    step: Number.isFinite(step) && step >= 250 ? step : 500,
  };
}

interface UseRunPollerOptions {
  /** When false, no fetch or polling is performed. Default: true */
  enabled?: boolean;
}

interface UseRunPollerResult {
  run: Run | null;
  status: RunStatus | null;
  loading: boolean;
  error: string | null;
}

export function useRunPoller(
  runId: string | null,
  options?: UseRunPollerOptions,
): UseRunPollerResult {
  const enabled = options?.enabled ?? true;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref for enabled so the polling loop always reads the latest value
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const fetch = useCallback(async () => {
    if (!runId || !enabledRef.current) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const polling = getRunPollMs();
    let nextDelayMs = polling.initial;
    let isFetching = false;
    const pollStartedAt = Date.now();
    const POLL_TIMEOUT_MS = 90_000;

    const pollRun = async () => {
      if (isFetching || !enabledRef.current) return;
      isFetching = true;
      try {
        const response = await fetchEdge('pitch-run-detail', {
          cache: 'no-store',
          params: { runId },
        });
        if (cancelled || !enabledRef.current) return;
        if (!response.ok) {
          setRun(null);
          setError('Failed to load run.');
          setLoading(false);
          return;
        }
        const payload = (await response.json()) as { run?: Run } | Run;
        const nextRun = (payload as { run?: Run }).run ?? (payload as Run);
        if (!nextRun?.id) {
          setRun(null);
          setError('Run not found.');
          setLoading(false);
          return;
        }
        if (cancelled || !enabledRef.current) return;
        setRun(nextRun);
        if (nextRun.status === 'queued' || nextRun.status === 'running') {
          if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
            setError('Analysis is taking longer than expected. Please try again.');
            setLoading(false);
            return;
          }
          setLoading(true);
          const delay =
            typeof document !== 'undefined' && document.visibilityState === 'hidden'
              ? Math.min(nextDelayMs * 2, polling.max)
              : nextDelayMs;
          timer = setTimeout(() => {
            nextDelayMs = Math.min(nextDelayMs + polling.step, polling.max);
            void pollRun();
          }, delay);
          return;
        }
        setLoading(false);
        setError(null);
      } catch {
        if (cancelled || !enabledRef.current) return;
        setRun(null);
        setError('Failed to load run.');
        setLoading(false);
      } finally {
        isFetching = false;
      }
    };

    setLoading(true);
    setError(null);
    void pollRun();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  useEffect(() => {
    if (!runId || !enabled) {
      setRun(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cleanup: (() => void) | undefined;
    void fetch().then((c) => { cleanup = c; });
    return () => { cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, enabled]);

  return {
    run,
    status: run?.status ?? null,
    loading,
    error,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test hooks/__tests__/useRunPoller.test.ts
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useRunPoller.ts hooks/__tests__/useRunPoller.test.ts
git commit -m "feat: add useRunPoller shared polling hook extracted from results page"
```

---

## Chunk 2: AnalysisTrackerProvider

### Task 2: Create the `AnalysisTrackerProvider` context

**Files:**
- Create: `views/components/AnalysisTrackerProvider.tsx`
- Create: `tests/analysisTracker.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/analysisTracker.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AnalysisTrackerProvider, useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';

const mockFetchEdge = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

function makeRunResponse(status: string) {
  return new Response(
    JSON.stringify({ run: { id: 'run-1', status, overallScore: 0 } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(AnalysisTrackerProvider, null, children)
);

describe('AnalysisTrackerProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue(localStorageMock as unknown as Storage);
    localStorageMock.clear();
  });

  it('starts with no active run', () => {
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    expect(result.current.activeRunId).toBeNull();
    expect(result.current.isPolling).toBe(false);
  });

  it('startTracking sets activeRunId and persists to localStorage', () => {
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    expect(result.current.activeRunId).toBe('run-abc');
    expect(localStorageMock.getItem('pitchr_active_run_id')).toBe('run-abc');
  });

  it('stopTracking clears activeRunId and localStorage', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    await waitFor(() => expect(result.current.isPolling).toBe(true));
    act(() => { result.current.stopTracking(); });
    expect(result.current.activeRunId).toBeNull();
    expect(localStorageMock.getItem('pitchr_active_run_id')).toBeNull();
  });

  it('resumes tracking from localStorage on mount', async () => {
    localStorageMock.setItem('pitchr_active_run_id', 'run-persisted');
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    await waitFor(() => expect(result.current.activeRunId).toBe('run-persisted'));
  });

  it('dispatches billing:refresh when run completes', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    await waitFor(() => expect(result.current.activeRun?.status).toBe('complete'));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'billing:refresh' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/analysisTracker.test.tsx
```

Expected: FAIL with "Cannot find module '@/views/components/AnalysisTrackerProvider'"

- [ ] **Step 3: Implement `AnalysisTrackerProvider`**

```typescript
// views/components/AnalysisTrackerProvider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRunPoller } from '@/hooks/useRunPoller';
import type { Run, RunStatus } from '@/types/pitch';

const LS_KEY = 'pitchr_active_run_id';

interface AnalysisTrackerState {
  activeRunId: string | null;
  activeRun: Run | null;
  activeRunStatus: RunStatus | null;
  isPolling: boolean;
  error: string | null;
  startTracking: (runId: string) => void;
  stopTracking: () => void;
}

const AnalysisTrackerContext = createContext<AnalysisTrackerState | null>(null);

export function useAnalysisTracker(): AnalysisTrackerState {
  const ctx = useContext(AnalysisTrackerContext);
  if (!ctx) throw new Error('useAnalysisTracker must be used inside AnalysisTrackerProvider');
  return ctx;
}

export function AnalysisTrackerProvider({ children }: { children: React.ReactNode }) {
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  });

  // Stop polling once run reaches terminal state
  const terminalRef = useRef(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { run, status, loading, error } = useRunPoller(activeRunId, {
    enabled: Boolean(activeRunId) && pollingEnabled,
  });

  // Fire billing:refresh and stop polling when analysis finishes
  useEffect(() => {
    if (!run) return;
    if ((run.status === 'complete' || run.status === 'failed') && !terminalRef.current) {
      terminalRef.current = true;
      setPollingEnabled(false);
      window.dispatchEvent(new Event('billing:refresh'));
    }
  }, [run]);

  const startTracking = useCallback((runId: string) => {
    terminalRef.current = false;
    setPollingEnabled(true);
    setActiveRunId(runId);
    try { localStorage.setItem(LS_KEY, runId); } catch {}
  }, []);

  const stopTracking = useCallback(() => {
    setActiveRunId(null);
    setPollingEnabled(false);
    terminalRef.current = false;
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  return (
    <AnalysisTrackerContext.Provider
      value={{
        activeRunId,
        activeRun: run,
        activeRunStatus: status,
        isPolling: loading,
        error,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </AnalysisTrackerContext.Provider>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test tests/analysisTracker.test.tsx
```

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add views/components/AnalysisTrackerProvider.tsx tests/analysisTracker.test.tsx
git commit -m "feat: add AnalysisTrackerProvider global analysis state context"
```

---

## Chunk 3: Wire AnalysisTrackerProvider into Layout

### Task 3: Wrap app layout with `AnalysisTrackerProvider`

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Add import and wrap the provider**

In `app/(app)/layout.tsx`:

1. Add import:
```typescript
import { AnalysisTrackerProvider } from '@/views/components/AnalysisTrackerProvider';
```

2. Wrap `<EarlyAdopterProvider>` (or its children) with `<AnalysisTrackerProvider>`. The tracker needs to be inside `AuthProvider` (which it will be, since `AppLayout` nests under it). Place `AnalysisTrackerProvider` just inside `ProjectProvider`:

```tsx
// In AppLayout's return, change:
<ProjectProvider>
  <EarlyAdopterProvider>
    <AppLayoutInner>{children}</AppLayoutInner>
  </EarlyAdopterProvider>
</ProjectProvider>
// To:
<ProjectProvider>
  <EarlyAdopterProvider>
    <AnalysisTrackerProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AnalysisTrackerProvider>
  </EarlyAdopterProvider>
</ProjectProvider>
```

- [ ] **Step 2: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/layout.tsx
git commit -m "feat: wrap app layout with AnalysisTrackerProvider"
```

---

## Chunk 4: Results Page Skeleton Components

### Task 4: Create `ResultsSkeleton` and `AnalysisStepIndicator`

**Files:**
- Create: `views/components/results/ResultsSkeleton.tsx`
- Create: `views/components/results/AnalysisStepIndicator.tsx`

These are purely visual components. We'll do a smoke render test for `AnalysisStepIndicator` since it has step logic.

- [ ] **Step 1: Write smoke test for `AnalysisStepIndicator`**

```typescript
// tests/analysisStepIndicator.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AnalysisStepIndicator } from '@/views/components/results/AnalysisStepIndicator';

describe('AnalysisStepIndicator', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalysisStepIndicator />);
    expect(container.firstChild).not.toBeNull();
  });

  it('shows a step label', () => {
    const { getByText } = render(<AnalysisStepIndicator />);
    expect(getByText(/processing transcript/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/analysisStepIndicator.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement `AnalysisStepIndicator`**

This is an inline version of the step display from `AnalyzingOverlay` — no backdrop, no orb, just the current step in a coral-tinted banner.

```typescript
// views/components/results/AnalysisStepIndicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { FileText, Brain, BarChart3, Lightbulb, Rocket } from 'lucide-react';

const ANALYSIS_STEPS = [
  { label: 'Processing transcript', icon: FileText, duration: '~3s' },
  { label: 'Analyzing structure & clarity', icon: Brain, duration: '~6s' },
  { label: 'Scoring rubric categories', icon: BarChart3, duration: '~5s' },
  { label: 'Generating fixes & rewrite', icon: Lightbulb, duration: '~5s' },
  { label: 'Preparing results', icon: Rocket, duration: '~2s' },
];

const EXTRA_WAIT_HINT_MS = 25_000;

export function AnalysisStepIndicator() {
  const [step, setStep] = useState(0);
  const [showExtraWait, setShowExtraWait] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 3_500),
      setTimeout(() => setStep(2), 9_000),
      setTimeout(() => setStep(3), 14_000),
      setTimeout(() => setStep(4), 19_000),
      setTimeout(() => setShowExtraWait(true), EXTRA_WAIT_HINT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = ANALYSIS_STEPS[step] ?? ANALYSIS_STEPS[0];
  const Icon = current.icon;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
      style={{
        backgroundColor: 'rgba(255, 89, 65, 0.08)',
        border: '1px solid rgba(255, 89, 65, 0.15)',
        color: 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {/* Spinner */}
      <div
        className="w-5 h-5 rounded-full border-2 flex-shrink-0 animate-spin"
        style={{
          borderColor: 'rgba(255, 89, 65, 0.2)',
          borderTopColor: '#ff5941',
        }}
      />
      <Icon size={14} style={{ color: '#ff5941' }} strokeWidth={2} className="flex-shrink-0" />
      <span className="flex-1 font-medium" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
        {current.label}
      </span>
      <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
        {showExtraWait ? 'Still working...' : `Step ${step + 1} of ${ANALYSIS_STEPS.length}`}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run smoke test to verify it passes**

```bash
yarn test tests/analysisStepIndicator.test.tsx
```

Expected: PASS

- [ ] **Step 5: Implement `ResultsSkeleton`**

```typescript
// views/components/results/ResultsSkeleton.tsx
'use client';

import { AnalysisStepIndicator } from './AnalysisStepIndicator';

function ShimmerBlock({
  height = '1rem',
  width = '100%',
  rounded = 'rounded-lg',
}: {
  height?: string;
  width?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`${rounded} results-skeleton-shimmer`}
      style={{
        height,
        width,
        backgroundColor: 'rgba(255, 89, 65, 0.06)',
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(255,89,65,0.08) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function ResultsSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-4 pr-1">
      {/* Header skeleton */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShimmerBlock height="2.5rem" width="2.5rem" rounded="rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <ShimmerBlock height="1.25rem" width="10rem" />
            <ShimmerBlock height="0.75rem" width="7rem" />
          </div>
        </div>
        <div className="flex gap-2">
          <ShimmerBlock height="2rem" width="7rem" rounded="rounded-lg" />
          <ShimmerBlock height="2rem" width="5rem" rounded="rounded-lg" />
        </div>
      </header>

      {/* Score hero skeleton */}
      <div
        className="rounded-2xl border p-6 flex flex-col items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <ShimmerBlock height="7rem" width="7rem" rounded="rounded-full" />
        <ShimmerBlock height="1.5rem" width="14rem" />
        <ShimmerBlock height="0.875rem" width="20rem" />
      </div>

      {/* Rubric 2x2 grid skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <ShimmerBlock height="0.75rem" width="60%" />
            <ShimmerBlock height="2rem" width="3rem" rounded="rounded-lg" />
            <ShimmerBlock height="0.625rem" width="90%" />
            <ShimmerBlock height="0.625rem" width="75%" />
          </div>
        ))}
      </div>

      {/* Top fixes skeleton */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <ShimmerBlock height="0.75rem" width="6rem" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <ShimmerBlock height="1.5rem" width="1.5rem" rounded="rounded-lg" />
            <div className="flex-1 flex flex-col gap-1.5">
              <ShimmerBlock height="0.875rem" width="80%" />
              <ShimmerBlock height="0.75rem" width="60%" />
            </div>
          </div>
        ))}
      </div>

      {/* Step indicator */}
      <AnalysisStepIndicator />

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add views/components/results/ResultsSkeleton.tsx views/components/results/AnalysisStepIndicator.tsx tests/analysisStepIndicator.test.tsx
git commit -m "feat: add ResultsSkeleton and AnalysisStepIndicator components"
```

---

## Chunk 5: Update Results Page

### Task 5: Replace `AnalyzingOverlay` with `ResultsSkeleton` on the results page

**Files:**
- Modify: `app/(app)/results/[runId]/page.tsx`

- [ ] **Step 1: Add tracker consumption and replace loading state**

In `app/(app)/results/[runId]/page.tsx`:

1. Add imports at top:
```typescript
import { useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';
import { ResultsSkeleton } from '@/views/components/results/ResultsSkeleton';
```

2. Remove:
```typescript
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
```

3. In `ResultsPage()`, add after params extraction:
```typescript
const tracker = useAnalysisTracker();
// This page only polls for historical runs — tracker owns polling for the active run
const isTrackerRun = tracker.activeRunId === runId;
```

4. Add `enabled: !isTrackerRun` option to the polling `useEffect`. Wrap the existing fetch in a condition so it does nothing when the tracker owns this run:

Inside the `useEffect` at line ~308, before `let cancelled = false;`, add:
```typescript
if (isTrackerRun) {
  // Tracker owns polling for this run — read its state directly
  setRun(tracker.activeRun);
  setLoading(tracker.isPolling);
  setRunError(tracker.error);
  return;
}
```

5. Also add a secondary `useEffect` to sync tracker state into local state when `isTrackerRun`:
```typescript
useEffect(() => {
  if (!isTrackerRun) return;
  setRun(tracker.activeRun);
  setLoading(tracker.isPolling);
  if (tracker.error) setRunError(tracker.error);
}, [isTrackerRun, tracker.activeRun, tracker.isPolling, tracker.error]);
```

6. Replace the loading guard (lines ~498-517):
```tsx
// BEFORE:
if (loading) {
  if (run && (run.status === 'queued' || run.status === 'running')) {
    return <AnalyzingOverlay isVisible />;
  }
  return (
    <main ...>
      <div ...><div ... /><p ...>Loading results...</p></div>
    </main>
  );
}

// AFTER:
if (loading) {
  if (run && (run.status === 'queued' || run.status === 'running')) {
    return <ResultsSkeleton />;
  }
  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--text-muted)', opacity: 0.5 }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading results...</p>
      </div>
    </main>
  );
}
```

Also remove the `getRunPollMs` function from this file — it now lives in `hooks/useRunPoller.ts`. (Only remove the local copy if `useRunPoller` is imported, but since the existing polling logic in this page is kept for historical runs, keep `getRunPollMs` local for now. We'll clean up in a future pass if needed.)

- [ ] **Step 2: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 3: Run existing tests**

```bash
yarn test 2>&1 | tail -20
```

Expected: All existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/results/[runId]/page.tsx
git commit -m "feat: replace AnalyzingOverlay with ResultsSkeleton on results page, consume AnalysisTracker"
```

---

## Chunk 6: SidebarAnalysisIndicator

### Task 6: Create `SidebarAnalysisIndicator` and integrate into sidebar

**Files:**
- Create: `views/components/SidebarAnalysisIndicator.tsx`
- Modify: `views/components/AppSidebar.tsx`

- [ ] **Step 1: Implement `SidebarAnalysisIndicator`**

```typescript
// views/components/SidebarAnalysisIndicator.tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, X, Loader2 } from 'lucide-react';
import { useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';

export function SidebarAnalysisIndicator() {
  const { activeRunId, activeRunStatus, stopTracking } = useAnalysisTracker();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = activeRunStatus === 'complete';
  const isFailed = activeRunStatus === 'failed';
  const isActive = Boolean(activeRunId) && (activeRunStatus === 'queued' || activeRunStatus === 'running' || isComplete || isFailed);

  // Auto-dismiss 5s after completion
  useEffect(() => {
    if (isComplete || isFailed) {
      dismissTimerRef.current = setTimeout(() => {
        stopTracking();
      }, 5_000);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isComplete, isFailed, stopTracking]);

  if (!isActive || !activeRunId) return null;

  const bgColor = isComplete
    ? '#22c55e'
    : isFailed
      ? '#ef4444'
      : undefined;

  const label = isComplete
    ? 'Results ready!'
    : isFailed
      ? 'Analysis failed'
      : 'Analyzing...';

  return (
    <Link
      href={`/results/${activeRunId}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-opacity hover:opacity-80 mb-1"
      style={{
        background: bgColor ?? 'linear-gradient(135deg, #ff5941, #ffaa33)',
        color: 'white',
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        {isComplete ? (
          <Check size={14} strokeWidth={3} />
        ) : isFailed ? (
          <X size={14} strokeWidth={3} />
        ) : (
          <Loader2 size={14} className="animate-spin" />
        )}
        {/* Pulsing dot badge for active state */}
        {!isComplete && !isFailed && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: '#ffaa33', border: '1.5px solid rgba(0,0,0,0.2)' }}
          />
        )}
      </div>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Add `SidebarAnalysisIndicator` to `AppSidebar`**

In `views/components/AppSidebar.tsx`:

1. Add import:
```typescript
import { SidebarAnalysisIndicator } from '@/views/components/SidebarAnalysisIndicator';
```

2. In the JSX, add `<SidebarAnalysisIndicator />` between the nav items and the divider (before `{/* Divider */}`):
```tsx
{/* Analysis in progress indicator */}
<SidebarAnalysisIndicator />

{/* Divider */}
<div className="my-4 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
```

- [ ] **Step 3: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add views/components/SidebarAnalysisIndicator.tsx views/components/AppSidebar.tsx
git commit -m "feat: add SidebarAnalysisIndicator with coral/green/red states"
```

---

## Chunk 7: Update Session Page

### Task 7: Remove `AnalyzingOverlay` from session page; add `startTracking`; remove `beforeunload`; show confirmation state

**Files:**
- Modify: `app/(app)/session/page.tsx`

- [ ] **Step 1: Make the changes in session page**

In `SessionPageContent`:

1. Remove the import of `AnalyzingOverlay`:
```typescript
// DELETE: import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
```

2. Add import for tracker:
```typescript
import { useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';
```

3. In `SessionPageContent`, add:
```typescript
const { startTracking } = useAnalysisTracker();
```

4. Add a confirmation state variable alongside `showAnalyzing`:
```typescript
const [showSubmittedConfirmation, setShowSubmittedConfirmation] = useState(false);
const submittedRunIdRef = useRef<string | null>(null);
```

5. In the auto-submit `useEffect`, after `router.push(...)`:
```typescript
const result = await runPitchAnalysis({ ... });
session.setOrbState('idle');            // reset orb before navigating
startTracking(result.runId);            // start global tracking
submittedRunIdRef.current = result.runId;
setShowSubmittedConfirmation(true);     // brief flash
router.push(`/results/${result.runId}`);
```

6. Remove the `beforeunload` `useEffect` entirely (lines ~349-356):
```typescript
// DELETE the entire block:
useEffect(() => {
  if (!showAnalyzing) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [showAnalyzing]);
```

7. Remove `<AnalyzingOverlay isVisible={showAnalyzing} />` from the JSX return.

8. Remove `setShowAnalyzing(true)` from `handleStopSession` (it's no longer needed — the session page no longer shows a blocking overlay). Update `handleStopSession`:
```typescript
const handleStopSession = useCallback(() => {
  session.stopSession();
  stt.stop();
  setIsPaused(false);
}, [session, stt]);
```
Also remove `setShowAnalyzing(false)` from `handleStartSession`, `handlePauseSession`, `handleConfirmDiscard` and the transcript length guard (replace all with no-ops since `showAnalyzing` is gone). Remove the `showAnalyzing` state entirely.

9. Add dependency `startTracking` to the auto-submit `useEffect` deps array.

- [ ] **Step 2: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Run relevant tests**

```bash
yarn test tests/session-page.deck-load-error.test.tsx tests/session-page.stt-guardrails.test.tsx
```

Expected: PASS (these test session page render, check they still work after removing AnalyzingOverlay).

- [ ] **Step 4: Commit**

```bash
git add app/(app)/session/page.tsx
git commit -m "feat: session page calls startTracking after submit, removes blocking overlay and beforeunload"
```

---

## Chunk 8: Disable Start Session During Analysis

### Task 8: Disable "Start Session" button when `activeRunId` exists

**Files:**
- Modify: `views/components/StartSessionButton.tsx`
- Modify: `views/components/AppSidebar.tsx` (sidebar's Link version of Start Session)

- [ ] **Step 1: Update `StartSessionButton` to accept and enforce `disabled` prop**

In `views/components/StartSessionButton.tsx`:

1. Add `disabled?: boolean; disabledReason?: string;` to `StartSessionButtonProps`.

2. In the Start Session button render (not the Pause button), apply disabled state:
```tsx
<button
  onClick={handleClick}
  disabled={disabled}
  title={disabled ? (disabledReason ?? 'Unavailable') : undefined}
  className="session-start-btn"
  style={disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
>
```

- [ ] **Step 2: Pass `disabled` from `AppSidebar` when analysis is active**

In `views/components/AppSidebar.tsx`:

1. Add import:
```typescript
import { useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';
```

2. Inside `AppSidebar`, consume the tracker:
```typescript
const { activeRunId } = useAnalysisTracker();
const isAnalysisInProgress = Boolean(activeRunId);
```

3. Pass to `StartSessionButton`:
```tsx
<StartSessionButton
  onClick={onStartSession}
  isSessionActive={isSessionActive}
  disabled={isAnalysisInProgress}
  disabledReason="Analysis in progress"
/>
```

4. Also disable the static Link version of Start Session (when `onStartSession` is not set):
```tsx
{onStartSession ? (
  <StartSessionButton
    onClick={onStartSession}
    isSessionActive={isSessionActive}
    disabled={isAnalysisInProgress}
    disabledReason="Analysis in progress"
  />
) : (
  <div className="session-start-wrap">
    <div className="session-start-glow" />
    <Link
      href="/session"
      className={`session-start-btn no-underline${isAnalysisInProgress ? ' opacity-50 pointer-events-none' : ''}`}
      aria-disabled={isAnalysisInProgress}
      title={isAnalysisInProgress ? 'Analysis in progress' : undefined}
    >
      <span className="session-start-btn__icon"><Play size={15} fill="currentColor" /></span>
      Start Session
    </Link>
  </div>
)}
```

- [ ] **Step 3: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add views/components/StartSessionButton.tsx views/components/AppSidebar.tsx
git commit -m "feat: disable Start Session button while analysis is in progress"
```

---

## Chunk 9: Delete AnalyzingOverlay

### Task 9: Remove `AnalyzingOverlay` (no longer referenced)

**Files:**
- Delete: `views/components/AnalyzingOverlay.tsx`

- [ ] **Step 1: Verify there are no remaining imports**

```bash
grep -r "AnalyzingOverlay" app/ views/ hooks/ lib/ services/ --include="*.tsx" --include="*.ts" -l
```

Expected: No output (no remaining usages).

- [ ] **Step 2: Delete the file**

```bash
rm views/components/AnalyzingOverlay.tsx
```

- [ ] **Step 3: Build check**

```bash
yarn build:claude 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 4: Run full test suite**

```bash
yarn test 2>&1 | tail -20
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete AnalyzingOverlay — fully replaced by skeleton + sidebar indicator"
```

---

## Final Verification

- [ ] **Manual smoke test in browser:**
  1. Start `yarn dev`
  2. Record a short pitch and submit
  3. Verify: session page does NOT show blocking overlay; instead navigates to results immediately
  4. Verify: results page shows skeleton cards with coral shimmer while `status === 'queued'`/`'running'`
  5. Verify: sidebar shows pulsing coral "Analyzing..." indicator while run is active
  6. Verify: when analysis completes, skeleton transitions to real results, sidebar turns green "Results ready!"
  7. Navigate to dashboard during analysis — verify sidebar indicator persists and links to results
  8. Verify: "Start Session" button is disabled during active analysis
  9. Refresh during analysis — verify tracker resumes from localStorage

- [ ] **Run full test suite one final time**

```bash
yarn test
```

Expected: All PASS.
