# Merge Analytics + Progress → Insights Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Analytics and Progress pages into a single "Insights" page, reducing nav from 3 data pages to 2.

**Architecture:** Extract 5 inline chart sub-components from `analytics/page.tsx` into standalone files under `views/components/insights/`. Modify `ProgressHero` to accept streak/session props. Create new `/insights` route that merges both pages' data fetching and rendering. Update sidebar nav and add `/progress` redirect.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react icons

**Spec:** `docs/superpowers/specs/2026-03-11-merge-analytics-progress-design.md`

---

## Chunk 1: Extract chart components and update ProgressHero

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

Additionally, **extend `computeStatDeltas`** to also compute WPM and filler deltas. Add to the return type:

```typescript
// Add these fields to the return object of computeStatDeltas:
// WPM delta
const newerWpm = newerHalf.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm));
const olderWpm = olderHalf.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm));
let wpmDelta: string | undefined;
let wpmDir: 'up' | 'down' | undefined;
let wpmIsGood: boolean | undefined;
if (newerWpm.length > 0 && olderWpm.length > 0) {
  const avgNewerWpm = newerWpm.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / newerWpm.length;
  const avgOlderWpm = olderWpm.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / olderWpm.length;
  const wpmDiff = Math.round(avgNewerWpm - avgOlderWpm);
  if (wpmDiff !== 0) {
    wpmDelta = `${Math.abs(wpmDiff)} WPM`;
    wpmDir = wpmDiff > 0 ? 'up' : 'down';
    // WPM closer to 130-160 is better; simplify: treat increase as neutral
    wpmIsGood = undefined;
  }
}

// Filler delta (total count across sessions)
const newerFillers = newerHalf.map(r =>
  (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0)
);
const olderFillers = olderHalf.map(r =>
  (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0)
);
let fillerDelta: string | undefined;
let fillerDir: 'up' | 'down' | undefined;
let fillerIsGood: boolean | undefined;
if (newerFillers.length > 0 && olderFillers.length > 0) {
  const avgNewerFiller = newerFillers.reduce((s, v) => s + v, 0) / newerFillers.length;
  const avgOlderFiller = olderFillers.reduce((s, v) => s + v, 0) / olderFillers.length;
  const fillerDiff = Math.round(avgNewerFiller - avgOlderFiller);
  if (fillerDiff !== 0) {
    fillerDelta = `${Math.abs(fillerDiff)}`;
    fillerDir = fillerDiff > 0 ? 'up' : 'down';
    fillerIsGood = fillerDiff < 0; // fewer fillers = better
  }
}

// Add to return: wpmDelta, wpmDir, wpmIsGood, fillerDelta, fillerDir, fillerIsGood
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors related to `lib/analytics.ts`

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

Extract the `ScoreTrendChart` function component from `analytics/page.tsx` lines 642-748 (include closing brace) into its own file:

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

Extract from `analytics/page.tsx` lines 758-892 (include closing brace). Imports needed: `CATEGORY_LABELS` from `@/lib/analytics`, `RUBRIC_COLORS` and `getRubricColor` from `@/views/components/ui`, and the `RubricTrendPoint` type from `@/lib/analytics`.

```typescript
// views/components/insights/RubricTrendChart.tsx
'use client';

import type { RubricTrendPoint } from '@/lib/analytics';
import { CATEGORY_LABELS } from '@/lib/analytics';
import { RUBRIC_COLORS, getRubricColor } from '@/views/components/ui';

export function RubricTrendChart({ data }: { data: RubricTrendPoint[] }) {
  // ... exact same implementation from analytics/page.tsx lines 758-892
}
```

- [ ] **Step 3: Create `WpmTrendChart.tsx`**

Extract from `analytics/page.tsx` lines 894-1014 (include closing brace).

```typescript
// views/components/insights/WpmTrendChart.tsx
'use client';

export function WpmTrendChart({ data }: { data: { label: string; wpm: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 894-1014
}
```

- [ ] **Step 4: Create `FillerTrendChart.tsx`**

Extract from `analytics/page.tsx` lines 1016-1113 (include closing brace).

```typescript
// views/components/insights/FillerTrendChart.tsx
'use client';

export function FillerTrendChart({ data }: { data: { label: string; total: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 1016-1113
}
```

- [ ] **Step 5: Create `FillerAggregateTable.tsx`**

Extract from `analytics/page.tsx` lines 1115-1161 (include closing brace).

```typescript
// views/components/insights/FillerAggregateTable.tsx
'use client';

export function FillerAggregateTable({ data }: { data: { word: string; total: number }[] }) {
  // ... exact same implementation from analytics/page.tsx lines 1115-1161
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

Destructure the new props in the component signature:

```tsx
export function ProgressHero({ progress, latestScore, animationDelay, streak, sessionCount }: ProgressHeroProps) {
```

Add the stat boxes **at the end of the hero's flex row** — after the Level Info `</div>` (line 309), before the closing `</div>` of the `relative flex items-center gap-8` container (line 310). This places them on the right side of the hero card:

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

## Chunk 2: Create Insights page, update routing, clean up

### Task 4: Create the Insights page

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

**Note:** `useTutorial` is intentionally omitted — tutorial tour attributes are dropped per spec. They can be re-added later with `/insights`-specific IDs if needed.

**Raw run type:** Define a local `RawRun` interface that covers all fields needed by both normalizers. The API returns data with all these fields:

```typescript
interface RawRun {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  projectId?: string;
  projectName?: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: {
      duration_seconds: number;
      wpm: number;
      filler_rate: number;
      filler_words?: { word: string; count: number }[];
    };
    top_fixes?: { rank: number; category: string; issue: string; fix: string; impact: string }[];
  };
}
```

**Normalization functions:** Two local functions to map `RawRun` to each consumer's expected type:

```typescript
function normalizeForProgress(raw: RawRun): ProgressRunRecord {
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    overallScore: raw.overallScore,
    mode: raw.mode,
    projectId: raw.projectId,
    projectName: raw.projectName,
    analysis: {
      one_line_verdict: raw.analysis.one_line_verdict,
      rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
      delivery_metrics: {
        duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
        wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
        filler_rate: raw.analysis.delivery_metrics?.filler_rate ?? 0,
      },
      top_fixes: raw.analysis.top_fixes ?? [],
    },
  };
}

function normalizeForAnalytics(raw: RawRun): RunRecord {
  return {
    id: raw.id,
    projectId: raw.projectId,
    overallScore: raw.overallScore,
    createdAt: raw.createdAt,
    analysis: {
      rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
      delivery_metrics: {
        wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
        duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
        filler_words: raw.analysis.delivery_metrics?.filler_words ?? [],
        repeated_phrases: [],
        within_time_limit: true,
      },
    },
  };
}
```

**Data fetching:** Use the Progress page's approach — fetch with `{ allProjects: 'true', summary: 'true' }`. Store raw runs. Use `useSmartTooltip` with ref pattern (same as existing pages). Use `useDelayedLoading` for skeleton.

**State:**
```typescript
const [range, setRange] = useState<TimeRange>('30D'); // 30D default (broader view for combined page)
const [filterProjectId, setFilterProjectId] = useState('all');
const [allRuns, setAllRuns] = useState<RawRun[]>([]);
const [loading, setLoading] = useState(true);
const [fetchError, setFetchError] = useState(false);
```

**Computed values (all useMemo):**
```typescript
// Filter by project
const projectFilteredRuns = useMemo(
  () => filterProjectId === 'all' ? allRuns : allRuns.filter(r => r.projectId === filterProjectId),
  [allRuns, filterProjectId]
);

// For progress (no time range filter — progress is cumulative)
const progressRuns = useMemo(() => projectFilteredRuns.map(normalizeForProgress), [projectFilteredRuns]);
const progress: ProgressSummary = useMemo(() => computeProgress(progressRuns), [progressRuns]);

// For analytics (apply time range filter)
const analyticsRuns = useMemo(() => projectFilteredRuns.map(normalizeForAnalytics), [projectFilteredRuns]);
const timeFilteredRuns = useMemo(() => filterByRange(analyticsRuns, range), [analyticsRuns, range]);
const trendData = useMemo(() => computeTrend(timeFilteredRuns, range), [timeFilteredRuns, range]);
const rubricTrend = useMemo(() => computeRubricTrend(timeFilteredRuns, range), [timeFilteredRuns, range]);
const wpmTrend = useMemo(() => computeWpmTrend(timeFilteredRuns), [timeFilteredRuns]);
const fillerData = useMemo(() => computeFillerData(timeFilteredRuns), [timeFilteredRuns]);
const deltas = useMemo(() => computeStatDeltas(timeFilteredRuns), [timeFilteredRuns]);

// Summary strip values (from time-filtered analytics runs)
const avgWpm = useMemo(() => {
  const wpmRuns = timeFilteredRuns.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm) && r.analysis.delivery_metrics.wpm > 0);
  return wpmRuns.length > 0 ? Math.round(wpmRuns.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / wpmRuns.length) : 0;
}, [timeFilteredRuns]);

const avgDuration = useMemo(() => {
  const durRuns = timeFilteredRuns.filter(r => r.analysis.delivery_metrics?.duration_seconds != null);
  if (durRuns.length === 0) return '0:00';
  const avg = Math.round(durRuns.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / durRuns.length);
  return `${Math.floor(avg / 60)}:${(avg % 60).toString().padStart(2, '0')}`;
}, [timeFilteredRuns]);

const totalFillers = useMemo(() => {
  return timeFilteredRuns.reduce((total, r) =>
    total + (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0),
  0);
}, [timeFilteredRuns]);

const latestScore = progress.overallTrend.length > 0
  ? progress.overallTrend[progress.overallTrend.length - 1].score
  : 0;
```

**Achievements:** Same pattern as progress page:
```typescript
const achievements = useAchievements();
useEffect(() => {
  if (progressRuns.length > 0) achievements.processRuns(progressRuns);
}, [progressRuns, achievements.processRuns]);
```

**Project filter options:** Same pattern as progress page — build from `projects` array.

**Render order (matching spec):**
1. Header row: `TrendingUp` icon + "Insights" title + subtitle + ProjectSelect dropdown + TimeRangeSelector
2. Empty state check: if `progress.totalSessions === 0`, show empty state with retry button (same as progress page)
3. `ProgressHero` with `streak={progress.currentStreak}` and `sessionCount={progress.totalSessions}`
4. Summary strip: 3 `StatCard`s in a `grid grid-cols-3 gap-4`:
   - "Avg WPM" with value `String(avgWpm)`, icon `<Activity size={16} />`, delta from `deltas.wpmDelta`, direction `deltas.wpmDir`, isGood `deltas.wpmIsGood`
   - "Avg Duration" with value `avgDuration`, icon `<Clock size={16} />`, delta from `deltas.durationDelta`, direction `deltas.durationDir`, isGood `deltas.durationIsGood`
   - "Filler Words" with value `String(totalFillers)`, icon `<MessageSquare size={16} />`, delta from `deltas.fillerDelta`, direction `deltas.fillerDir`, isGood `deltas.fillerIsGood`
5. Score Trend: `GlassCard` > `SectionHeader("Score Trend")` + time range label + `ScoreTrendChart`
6. Category Trends: `GlassCard` > `SectionHeader("Rubric Category Trend")` + `RubricTrendChart`
7. Skill Ladder: `SectionHeader("Skill Progression")` + `SkillLadder` with `progress.categories`
8. Delivery Metrics: `grid grid-cols-1 md:grid-cols-2 gap-4` with:
   - `GlassCard` > WPM section header + `WpmTrendChart`
   - `GlassCard` > Filler Words section header + `grid grid-cols-2 gap-6` > `FillerTrendChart` + `FillerAggregateTable`
9. Fix Tracker: `GlassCard` > `FixTracker` with `progress.fixes`
10. Achievements: `GlassCard` > `AchievementSummary` with `achievements.state` and `achievements.progress`

**Loading state:** Same skeleton pattern as current progress page (check `showSkeleton`).

- [ ] **Step 2: Verify the page builds**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -30`
Expected: Build succeeds. The `/insights` route should be available.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/insights/page.tsx
git commit -m "feat: create merged Insights page combining Analytics and Progress"
```

---

### Task 5: Update sidebar navigation

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

### Task 6: Replace progress page with redirect, delete analytics page, clean up dead components

This task combines the routing changes with the dead code cleanup so the build never breaks between commits.

**Files:**
- Replace: `app/(app)/progress/page.tsx`
- Delete: `app/(app)/analytics/page.tsx` (and directory if empty)
- Modify: `views/components/progress/index.ts`
- Delete: `views/components/progress/ProgressKanban.tsx`
- Delete: `views/components/progress/StreakBadge.tsx`
- Delete: `views/components/progress/MomentumPanel.tsx`
- Delete: `views/components/progress/ScoreTimeline.tsx`
- Delete: `views/components/progress/CategoryProgressCard.tsx`

- [ ] **Step 1: Replace progress page with redirect**

Replace the entire content of `app/(app)/progress/page.tsx` with a redirect:

```typescript
import { redirect } from 'next/navigation';

export default function ProgressRedirect() {
  redirect('/insights');
}
```

(Note: `export default` is required by Next.js App Router for page components, overriding the project's "named exports only" convention.)

- [ ] **Step 2: Delete analytics page and directory**

```bash
rm app/\(app\)/analytics/page.tsx
rmdir app/\(app\)/analytics/
```

- [ ] **Step 3: Update progress barrel export and delete unused components**

Replace `views/components/progress/index.ts` with:

```typescript
export { ProgressHero } from './ProgressHero';
export { SkillLadder } from './SkillLadder';
export { FixTracker } from './FixTracker';
```

Delete the unused files:

```bash
rm views/components/progress/ProgressKanban.tsx
rm views/components/progress/StreakBadge.tsx
rm views/components/progress/MomentumPanel.tsx
rm views/components/progress/ScoreTimeline.tsx
rm views/components/progress/CategoryProgressCard.tsx
```

- [ ] **Step 4: Verify full build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -30`
Expected: Build succeeds. `/insights` works, `/progress` redirects, `/analytics` is gone, no broken imports.

- [ ] **Step 5: Commit**

```bash
git add -A app/\(app\)/progress/ app/\(app\)/analytics/ views/components/progress/
git commit -m "refactor: redirect /progress to /insights, delete /analytics, remove unused progress components"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Start dev server and verify**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn dev`

Check in browser:
1. `/insights` loads the merged page with Hero (including streak/sessions boxes), summary strip, charts, skill ladder, delivery metrics, fix tracker, achievements
2. `/progress` redirects to `/insights`
3. `/analytics` returns 404
4. Sidebar shows "Insights" instead of "Analytics" and "Progress" — one less nav item
5. Project filter dropdown works (switches between All Projects and individual projects)
6. Time range selector works (7D / 30D / 90D / All) — charts update, progress Hero stays stable
7. History page is unchanged
8. Summary strip shows WPM, Duration, and Filler Word count with deltas

- [ ] **Step 2: Verify production build**

Run: `cd /Users/julb/Desktop/GitHub/pitchr && yarn build:claude 2>&1 | tail -10`
Expected: Build succeeds with no errors.
