# Merge Analytics + Progress → Insights Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Analytics and Progress pages into a single "Insights" page, reducing nav from 3 data pages to 2.

**Architecture:** Extract 5 inline chart sub-components from `analytics/page.tsx` into standalone files under `views/components/insights/`. Modify `ProgressHero` to accept streak/session props. Create new `/insights` route that merges both pages' data fetching and rendering. Update sidebar nav and add `/progress` redirect.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react icons

**Spec:** `docs/superpowers/specs/2026-03-11-merge-analytics-progress-design.md`

---

## Chunk 1: Extract chart components and clean up dead code

### Task 1: Extract analytics helper functions into shared module

**Files:**
- Create: `lib/analytics.ts`
- Reference: `app/(app)/analytics/page.tsx:30-394`

- [ ] **Step 1: Create `lib/analytics.ts` with all types and helper functions**

Extract the following from `app/(app)/analytics/page.tsx` lines 30-394 into a new shared module. This includes all types (`RubricBreakdownItem`, `DeliveryMetrics`, `RunRecord`, `TrendPoint`, `RubricTrendPoint`, `TimeBucket`) and all helper/compute functions (`toFiniteNumber`, `toDayKey`, `formatDayLabel`, `mean`, `startOfDay`, `addDays`, `startOfMonth`, `addMonths`, `buildTimeBuckets`, `labelStride`, `applySparseLabels`, `normalizeCategory`, `sortChronological`, `getDaysAgo`, `filterByRange`, `computeTrend`, `computeStatDeltas`, `computeRubricTrend`, `computeWpmTrend`, `computeFillerData`).

```typescript
// lib/analytics.ts
// All types and functions from analytics/page.tsx lines 30-394, exported.
// Keep the exact same implementations — just add `export` to each function and type.
// Also export the CATEGORY_LABELS constant (from line 750):
export const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};
```

All types should use `export interface` / `export type`. All functions should use `export function`.

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && npx tsc --noEmit lib/analytics.ts 2>&1 | head -20`
Expected: No errors (or only errors about missing imports that will resolve with full build)

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts
git commit -m "refactor: extract analytics helpers into shared lib/analytics module"
```

---

### Task 2: Extract chart sub-components into `views/components/insights/`

**Files:**
- Create: `views/components/insights/ScoreTrendChart.tsx`
- Create: `views/components/insights/RubricTrendChart.tsx`
- Create: `views/components/insights/WpmTrendChart.tsx`
- Create: `views/components/insights/FillerTrendChart.tsx`
- Create: `views/components/insights/FillerAggregateTable.tsx`
- Create: `views/components/insights/index.ts`
- Reference: `app/(app)/analytics/page.tsx:642-1160`

- [ ] **Step 1: Create `ScoreTrendChart.tsx`**

Extract the `ScoreTrendChart` function component from `analytics/page.tsx` lines 642-748 into its own file. Add necessary imports:

```typescript
// views/components/insights/ScoreTrendChart.tsx
'use client';

import type { TrendPoint } from '@/lib/analytics';
import { getScoreColor } from '@/views/components/ui';

export function ScoreTrendChart({ data }: { data: TrendPoint[] }) {
  // ... exact same implementation from analytics/page.tsx lines 643-748
}
```

- [ ] **Step 2: Create `RubricTrendChart.tsx`**

Extract from `analytics/page.tsx` lines 758-891. Imports needed: `CATEGORY_LABELS` from `@/lib/analytics`, `RUBRIC_COLORS` and `getRubricColor` from `@/views/components/ui`, and the `RubricTrendPoint` type from `@/lib/analytics`.

```typescript
// views/components/insights/RubricTrendChart.tsx
'use client';

import type { RubricTrendPoint } from '@/lib/analytics';
import { CATEGORY_LABELS } from '@/lib/analytics';
import { RUBRIC_COLORS, getRubricColor } from '@/views/components/ui';

export function RubricTrendChart({ data }: { data: RubricTrendPoint[] }) {
  // ... exact same implementation from analytics/page.tsx lines 758-891
}
```

- [ ] **Step 3: Create `WpmTrendChart.tsx`**

Extract from `analytics/page.tsx` lines 894-1013.

```typescript
// views/components/insights/WpmTrendChart.tsx
'use client';

export function WpmTrendChart({ data }: { data: { label: string; wpm: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 894-1013
}
```

- [ ] **Step 4: Create `FillerTrendChart.tsx`**

Extract from `analytics/page.tsx` lines 1016-1112.

```typescript
// views/components/insights/FillerTrendChart.tsx
'use client';

export function FillerTrendChart({ data }: { data: { label: string; total: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 1016-1112
}
```

- [ ] **Step 5: Create `FillerAggregateTable.tsx`**

Extract from `analytics/page.tsx` lines 1115-1160.

```typescript
// views/components/insights/FillerAggregateTable.tsx
'use client';

export function FillerAggregateTable({ data }: { data: { word: string; total: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 1115-1160
}
```

- [ ] **Step 6: Create barrel export `index.ts`**

```typescript
// views/components/insights/index.ts
export { ScoreTrendChart } from './ScoreTrendChart';
export { RubricTrendChart } from './RubricTrendChart';
export { WpmTrendChart } from './WpmTrendChart';
export { FillerTrendChart } from './FillerTrendChart';
export { FillerAggregateTable } from './FillerAggregateTable';
```

- [ ] **Step 7: Verify build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -20`
Expected: Build succeeds (new files are not yet imported anywhere, so no breakage)

- [ ] **Step 8: Commit**

```bash
git add views/components/insights/
git commit -m "refactor: extract chart sub-components into views/components/insights"
```

---

### Task 3: Update ProgressHero to accept streak and sessionCount props

**Files:**
- Modify: `views/components/progress/ProgressHero.tsx:213-313`

- [ ] **Step 1: Add `streak` and `sessionCount` optional props to `ProgressHeroProps`**

In `views/components/progress/ProgressHero.tsx`, update the interface at line 213:

```typescript
interface ProgressHeroProps {
  progress: ProgressSummary;
  latestScore: number;
  animationDelay?: string;
  streak?: number;
  sessionCount?: number;
}
```

- [ ] **Step 2: Render streak and session count boxes inside the hero**

In the `ProgressHero` component, destructure the new props and add stat boxes after the Score Ring div (after line 253, before the Level Info div). These render only when the props are provided:

```tsx
export function ProgressHero({ progress, latestScore, animationDelay, streak, sessionCount }: ProgressHeroProps) {
```

Add after the `{/* Score Ring */}` div (line 253) and before `{/* Level Info */}` div (line 257), insert a new flex column to the right of the ring but before the level info — or more naturally, add it as a flex-shrink-0 column at the end of the hero's flex row (after the Level Info div, before the closing `</div>` of the relative flex row at line 310):

```tsx
        {/* Streak & Sessions (shown when props provided) */}
        {(streak != null || sessionCount != null) && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {streak != null && (
              <div
                className="rounded-xl px-3 py-2.5 text-center"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Streak
                </div>
                <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: '#ffaa33' }}>
                  {streak}
                </div>
              </div>
            )}
            {sessionCount != null && (
              <div
                className="rounded-xl px-3 py-2.5 text-center"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Sessions
                </div>
                <div className="text-lg font-bold tabular-nums mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {sessionCount}
                </div>
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -20`
Expected: Build succeeds. Existing usage in progress page passes no streak/sessionCount, so boxes don't render (backward compatible).

- [ ] **Step 4: Commit**

```bash
git add views/components/progress/ProgressHero.tsx
git commit -m "feat: add optional streak and sessionCount props to ProgressHero"
```

---

### Task 4: Clean up dead code in progress components

**Files:**
- Modify: `views/components/progress/index.ts`
- Delete: `views/components/progress/ProgressKanban.tsx`
- Delete: `views/components/progress/StreakBadge.tsx`
- Delete: `views/components/progress/MomentumPanel.tsx`
- Delete: `views/components/progress/ScoreTimeline.tsx`
- Delete: `views/components/progress/CategoryProgressCard.tsx`

- [ ] **Step 1: Update barrel export**

Replace `views/components/progress/index.ts` with:

```typescript
export { ProgressHero } from './ProgressHero';
export { SkillLadder } from './SkillLadder';
export { FixTracker } from './FixTracker';
```

- [ ] **Step 2: Delete unused component files**

```bash
rm views/components/progress/ProgressKanban.tsx
rm views/components/progress/StreakBadge.tsx
rm views/components/progress/MomentumPanel.tsx
rm views/components/progress/ScoreTimeline.tsx
rm views/components/progress/CategoryProgressCard.tsx
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -20`
Expected: Build may fail because `progress/page.tsx` still imports the deleted components. This is expected — we'll fix it in Chunk 2 when we replace the page. If it fails, that's OK, just confirm the errors are only from `progress/page.tsx` imports.

- [ ] **Step 4: Commit**

```bash
git add -u views/components/progress/
git commit -m "refactor: remove unused progress components (MomentumPanel, ScoreTimeline, CategoryProgressCard, ProgressKanban, StreakBadge)"
```

---

## Chunk 2: Create Insights page and update routing

### Task 5: Create the Insights page

**Files:**
- Create: `app/(app)/insights/page.tsx`
- Reference: `app/(app)/analytics/page.tsx` (for analytics rendering patterns)
- Reference: `app/(app)/progress/page.tsx` (for progress rendering patterns)

- [ ] **Step 1: Create `app/(app)/insights/page.tsx`**

This is the main merged page. It combines data fetching from both pages and renders the layout specified in the design spec. Key details:

**Imports:**
```typescript
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  Radio,
  Activity,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  SectionHeader,
  TimeRangeSelector,
  EmptyState,
  Skeleton,
  SkeletonStatRow,
  SkeletonCard,
  useDelayedLoading,
} from '@/views/components/ui';
import type { TimeRange } from '@/views/components/ui';
import { ProgressHero, SkillLadder, FixTracker } from '@/views/components/progress';
import {
  ScoreTrendChart,
  RubricTrendChart,
  WpmTrendChart,
  FillerTrendChart,
  FillerAggregateTable,
} from '@/views/components/insights';
import { AchievementSummary } from '@/views/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { normalizeRuns as normalizeSharedRuns } from '@/lib/runNormalization';
import { computeProgress } from '@/lib/progress';
import type { ProgressRunRecord, ProgressSummary } from '@/lib/progress';
import {
  filterByRange,
  computeTrend,
  computeStatDeltas,
  computeRubricTrend,
  computeWpmTrend,
  computeFillerData,
} from '@/lib/analytics';
import type { RunRecord } from '@/lib/analytics';
```

**Data fetching:** Use the Progress page's approach — fetch with `{ allProjects: 'true', summary: 'true' }`. Store raw runs. Apply project filter and time range filter client-side. Run both `computeProgress()` (for hero, skill ladder, fixes) and analytics compute functions (for charts) on the same filtered data.

**Normalization:** The page needs to produce both `RunRecord` (for analytics charts) and `ProgressRunRecord` (for `computeProgress`). The raw data from the API contains fields for both. Create a local `normalizeRunForAnalytics` function that maps the raw run to `RunRecord` type (needs `id`, `projectId`, `overallScore`, `createdAt`, `analysis.rubric_breakdown`, `analysis.delivery_metrics` with `wpm`, `duration_seconds`, `filler_words`). Create a `normalizeRunForProgress` function (same as existing in progress page — needs `mode`, `projectName`, `analysis.one_line_verdict`, `analysis.top_fixes`).

**State:**
```typescript
const [range, setRange] = useState<TimeRange>('30D');
const [filterProjectId, setFilterProjectId] = useState('all');
const [allRuns, setAllRuns] = useState<RawRun[]>([]); // raw from API
const [loading, setLoading] = useState(true);
const [fetchError, setFetchError] = useState(false);
```

**Computed values (all useMemo):**
```typescript
// Filter by project
const projectFilteredRuns = filterProjectId === 'all' ? allRuns : allRuns.filter(r => r.projectId === filterProjectId);

// For progress (no time range filter — progress is cumulative)
const progressRuns: ProgressRunRecord[] = projectFilteredRuns.map(normalizeRunForProgress);
const progress: ProgressSummary = computeProgress(progressRuns);

// For analytics (apply time range filter)
const analyticsRuns: RunRecord[] = projectFilteredRuns.map(normalizeRunForAnalytics);
const timeFilteredRuns = filterByRange(analyticsRuns, range);
const trendData = computeTrend(timeFilteredRuns, range);
const rubricTrend = computeRubricTrend(timeFilteredRuns, range);
const wpmTrend = computeWpmTrend(timeFilteredRuns);
const fillerData = computeFillerData(timeFilteredRuns);
const deltas = computeStatDeltas(timeFilteredRuns);
```

**Render order (matching spec):**
1. Header row: icon + "Insights" title + ProjectSelect dropdown + TimeRangeSelector
2. ProgressHero with `streak={progress.currentStreak}` and `sessionCount={progress.totalSessions}`
3. Summary strip: 3 StatCards (Avg WPM, Avg Duration, Filler Words — computed from `timeFilteredRuns`)
4. Score Trend chart in GlassCard
5. Category Trends chart in GlassCard
6. Skill Ladder section with SectionHeader
7. Delivery Metrics: two GlassCards side by side — WPM chart + Filler Words (FillerTrendChart + FillerAggregateTable)
8. Fix Tracker in GlassCard
9. Achievements in GlassCard

**Empty state:** When `progress.totalSessions === 0`, show the same empty state as the current progress page (with fetchError handling and retry button).

**Loading state:** Same skeleton pattern as current progress page.

**Achievements:** Same `useAchievements` + `processRuns` pattern as current progress page.

**latestScore:** Same computation as current progress page: `progress.overallTrend[progress.overallTrend.length - 1]?.score ?? 0`

- [ ] **Step 2: Verify the page builds**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -30`
Expected: Build succeeds. The `/insights` route should be available.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/insights/page.tsx
git commit -m "feat: create merged Insights page combining Analytics and Progress"
```

---

### Task 6: Update sidebar navigation

**Files:**
- Modify: `views/components/AppSidebar.tsx:35-42`

- [ ] **Step 1: Update NAV_ITEMS array**

In `views/components/AppSidebar.tsx`, replace the analytics and progress entries in the `NAV_ITEMS` array (lines 35-42):

```typescript
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'session', label: 'Session', icon: Radio, href: '/session' },
  { id: 'history', label: 'History', icon: Clock, href: '/history' },
  { id: 'insights', label: 'Insights', icon: TrendingUp, href: '/insights' },
  { id: 'arena', label: 'Arena', icon: Swords, href: '/arena' },
];
```

This removes Analytics and replaces Progress with Insights. `BarChart3` import can be removed if no longer used elsewhere in the file.

- [ ] **Step 2: Clean up unused import**

Remove `BarChart3` from the lucide-react import at line 9 if it's no longer referenced anywhere in the file.

- [ ] **Step 3: Verify build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat: update sidebar nav — replace Analytics+Progress with Insights"
```

---

### Task 7: Replace progress page with redirect, delete analytics page

**Files:**
- Replace: `app/(app)/progress/page.tsx`
- Delete: `app/(app)/analytics/page.tsx`

- [ ] **Step 1: Replace progress page with redirect**

Replace the entire content of `app/(app)/progress/page.tsx` with a redirect:

```typescript
import { redirect } from 'next/navigation';

export default function ProgressRedirect() {
  redirect('/insights');
}
```

- [ ] **Step 2: Delete analytics page**

```bash
rm app/\(app\)/analytics/page.tsx
```

Also check if the analytics directory has any other files (layout.tsx, etc.):

```bash
ls app/\(app\)/analytics/
```

If only `page.tsx` existed, remove the directory:

```bash
rmdir app/\(app\)/analytics/
```

- [ ] **Step 3: Verify full build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -30`
Expected: Build succeeds. `/insights` works, `/progress` redirects, `/analytics` is gone.

- [ ] **Step 4: Commit**

```bash
git add -A app/\(app\)/progress/ app/\(app\)/analytics/ app/\(app\)/insights/
git commit -m "feat: redirect /progress to /insights, delete /analytics page"
```

---

### Task 8: Manual verification

- [ ] **Step 1: Start dev server and verify**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn dev`

Check in browser:
1. `/insights` loads the merged page with Hero, charts, skill ladder, delivery metrics, fix tracker, achievements
2. `/progress` redirects to `/insights`
3. `/analytics` returns 404
4. Sidebar shows "Insights" instead of "Analytics" and "Progress"
5. Project filter dropdown works
6. Time range selector works (7D / 30D / 90D / All)
7. History page is unchanged

- [ ] **Step 2: Verify production build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -10`
Expected: Build succeeds with no errors.
