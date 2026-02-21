# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move rubric breakdown, top insights, and practice recommendations from analytics to the dashboard with a polished SaaS layout. Strip analytics to score trend only.

**Architecture:** Extract shared analytics logic (compute functions) and shared UI components (InsightCard, RecommendationCard) from the monolithic analytics page into reusable modules. Dashboard fetches all runs from `/api/pitch/run` and computes derived data client-side. Analytics page imports the same shared compute functions but only renders the score trend chart.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, existing UI components (GlassCard, StatCard, CategoryBar, ScoreBadge, TagPill, SectionHeader)

---

### Task 1: Extract shared analytics compute functions

**Files:**
- Create: `lib/analytics.ts`
- Modify: `app/(app)/analytics/page.tsx`

**Step 1: Create `lib/analytics.ts`**

Extract these from `app/(app)/analytics/page.tsx` (lines 39-148) into a new file. Move verbatim — do not refactor:

```typescript
// lib/analytics.ts

import {
  Target,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { getRubricColor } from '@/views/components/ui';

/* ——— Types ——— */

export interface RubricRunRecord {
  analysis: {
    rubric_breakdown: { category: string; score: number; max_score: number }[];
  };
}

export interface RubricCategory {
  id: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface Insight {
  type: 'strength' | 'improve';
  title: string;
  body: string;
}

export interface Recommendation {
  title: string;
  description: string;
  tag: string;
}

/* ——— Constants ——— */

export const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity & Concision',
  evidence: 'Evidence & Traction',
  market: 'Market & Differentiation',
  delivery: 'Delivery',
};

export const RECOMMENDATION_GRADIENTS: Record<string, string> = {
  evidence: 'linear-gradient(135deg, #22c55e, #16a34a)',
  market: 'linear-gradient(135deg, #f97316, #ea580c)',
  delivery: 'linear-gradient(135deg, #ef4444, #dc2626)',
  structure: 'linear-gradient(135deg, #ff5941, #e63b26)',
  clarity: 'linear-gradient(135deg, #ffaa33, #f59e0b)',
};

export const RECOMMENDATION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  evidence: Target,
  market: Lightbulb,
  delivery: Sparkles,
};

/* ——— Compute Functions ——— */

export function computeRubricAverages(runs: RubricRunRecord[]): RubricCategory[] {
  const categories = ['structure', 'clarity', 'evidence', 'market', 'delivery'];
  if (runs.length === 0) {
    return categories.map((id) => ({ id, label: CATEGORY_LABELS[id], score: 0, maxScore: 20 }));
  }
  return categories.map((id) => {
    const scores = runs
      .map((r) => r.analysis.rubric_breakdown.find((rb) => rb.category === id))
      .filter(Boolean);
    const avg = scores.length > 0
      ? scores.reduce((sum, s) => sum + s!.score, 0) / scores.length
      : 0;
    return { id, label: CATEGORY_LABELS[id], score: Math.round(avg * 10) / 10, maxScore: 20 };
  });
}

export function computeInsights(rubric: RubricCategory[]): Insight[] {
  const sorted = [...rubric].sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);
  const insights: Insight[] = [];
  if (sorted.length > 0) {
    const best = sorted[0];
    insights.push({
      type: 'strength',
      title: `Strong ${best.label.toLowerCase()} performance`,
      body: `Averaging ${best.score}/${best.maxScore} across sessions. Keep maintaining this strength.`,
    });
  }
  if (sorted.length > 1) {
    const second = sorted[1];
    insights.push({
      type: 'strength',
      title: `Consistent ${second.label.toLowerCase()}`,
      body: `Scoring ${second.score}/${second.maxScore} on average. This is a solid foundation to build on.`,
    });
  }
  const worst = sorted[sorted.length - 1];
  if (worst) {
    insights.push({
      type: 'improve',
      title: `${worst.label} needs attention`,
      body: `Averaging ${worst.score}/${worst.maxScore}. Focus on improving this area for the biggest score gains.`,
    });
  }
  if (sorted.length > 1) {
    const secondWorst = sorted[sorted.length - 2];
    insights.push({
      type: 'improve',
      title: `Room to grow in ${secondWorst.label.toLowerCase()}`,
      body: `Currently at ${secondWorst.score}/${secondWorst.maxScore}. Small improvements here will compound.`,
    });
  }
  return insights;
}

export function computeRecommendations(rubric: RubricCategory[]): Recommendation[] {
  const sorted = [...rubric].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore);
  return sorted.slice(0, 3).map((cat) => ({
    title: `Improve your ${cat.label.toLowerCase()}`,
    description: `Currently averaging ${cat.score}/${cat.maxScore}. Practice sessions focused on ${cat.id} to reach your target score.`,
    tag: cat.id,
  }));
}
```

**Step 2: Update analytics page to import from `lib/analytics.ts`**

In `app/(app)/analytics/page.tsx`:
- Remove the `CATEGORY_LABELS` constant (lines 39-45)
- Remove `computeRubricAverages` function (lines 71-85)
- Remove `computeInsights` function (lines 87-123)
- Remove `computeRecommendations` function (lines 125-132)
- Remove `RECOMMENDATION_GRADIENTS` constant (lines 136-142)
- Remove `RECOMMENDATION_ICONS` constant (lines 144-148)
- Add import: `import { computeRubricAverages, computeInsights, computeRecommendations, RECOMMENDATION_GRADIENTS, RECOMMENDATION_ICONS } from '@/lib/analytics';`
- Remove now-unused imports of `Target`, `Lightbulb`, `Sparkles` from lucide-react (keep only icons still used in the page)

**Step 3: Verify analytics page still works**

Run: `yarn build`
Expected: No type errors. Analytics page renders identically.

**Step 4: Commit**

```bash
git add lib/analytics.ts app/\(app\)/analytics/page.tsx
git commit -m "refactor: extract shared analytics compute functions to lib/analytics.ts"
```

---

### Task 2: Extract InsightCard and RecommendationCard to shared UI components

**Files:**
- Create: `views/components/ui/InsightCard.tsx`
- Create: `views/components/ui/RecommendationCard.tsx`
- Modify: `views/components/ui/index.ts`
- Modify: `app/(app)/analytics/page.tsx`

**Step 1: Create `views/components/ui/InsightCard.tsx`**

Extract the `InsightCard` function from `app/(app)/analytics/page.tsx` (lines 397-446):

```typescript
'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';

interface InsightCardProps {
  type: 'strength' | 'improve';
  title: string;
  body: string;
  delay: number;
}

export function InsightCard({ type, title, body, delay }: InsightCardProps) {
  const isStrength = type === 'strength';
  const borderColor = isStrength ? '#22c55e' : '#f59e0b';
  const iconColor = isStrength ? '#22c55e' : '#f59e0b';
  const Icon = isStrength ? CheckCircle : AlertTriangle;

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-200 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
        animationDelay: `${480 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex-shrink-0 mt-0.5" style={{ color: iconColor }}>
          <Icon size={15} />
        </span>
        <div>
          <p
            className="text-xs font-semibold mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create `views/components/ui/RecommendationCard.tsx`**

Extract the `RecommendationCard` function from `app/(app)/analytics/page.tsx` (lines 448-501):

```typescript
'use client';

import { Target } from 'lucide-react';
import { TagPill } from './TagPill';
import { getRubricColor } from './colors';
import { RECOMMENDATION_GRADIENTS, RECOMMENDATION_ICONS } from '@/lib/analytics';

interface RecommendationCardProps {
  title: string;
  description: string;
  tag: string;
  delay: number;
}

export function RecommendationCard({ title, description, tag, delay }: RecommendationCardProps) {
  const Icon = RECOMMENDATION_ICONS[tag] ?? Target;
  const gradient = RECOMMENDATION_GRADIENTS[tag] ?? 'linear-gradient(135deg, #6b7280, #4b5563)';
  const tagColor = getRubricColor(tag);

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-in-up hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: `${540 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}
        >
          <Icon size={16} className="text-white" />
        </div>
        <h3
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      <div className="self-start">
        <TagPill
          label={tag.charAt(0).toUpperCase() + tag.slice(1)}
          color={tagColor}
        />
      </div>
    </div>
  );
}
```

**Step 3: Add exports to `views/components/ui/index.ts`**

Append these two lines:
```typescript
export { InsightCard } from './InsightCard';
export { RecommendationCard } from './RecommendationCard';
```

**Step 4: Update analytics page to import from shared UI**

In `app/(app)/analytics/page.tsx`:
- Remove the inline `InsightCard` function (lines 397-446)
- Remove the inline `RecommendationCard` function (lines 448-501)
- Add to the existing `@/views/components/ui` import: `InsightCard`, `RecommendationCard`
- Remove now-unused imports: `CheckCircle`, `AlertTriangle`, `Target`, `Lightbulb`, `Sparkles` from lucide-react
- Remove `RECOMMENDATION_GRADIENTS` and `RECOMMENDATION_ICONS` from the `@/lib/analytics` import (only needed inside RecommendationCard now)

**Step 5: Verify analytics page still works**

Run: `yarn build`
Expected: No type errors. Analytics page renders identically.

**Step 6: Commit**

```bash
git add views/components/ui/InsightCard.tsx views/components/ui/RecommendationCard.tsx views/components/ui/index.ts app/\(app\)/analytics/page.tsx
git commit -m "refactor: extract InsightCard and RecommendationCard to shared UI components"
```

---

### Task 3: Rewrite dashboard page with new layout

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Step 1: Rewrite the dashboard page**

Replace the entire contents of `app/(app)/dashboard/page.tsx` with the new stacked-sections layout. The page:

1. Fetches all runs from `/api/pitch/run` on mount
2. Computes stats (totalRuns, averageScore, bestScore) from the runs array
3. Computes rubricCategories, insights, recommendations using the shared functions from `lib/analytics.ts`
4. Takes the 3 most recent runs for the "Recent Runs" section

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Calendar,
  Timer,
  ArrowRight,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  ScoreBadge,
  TagPill,
  SectionHeader,
  CategoryBar,
  InsightCard,
  RecommendationCard,
  getModeColor,
  getModeBgColor,
  getModeLabel,
  getRubricColor,
} from '@/views/components/ui';
import type { PitchMode } from '@/views/components/ui/colors';
import {
  computeRubricAverages,
  computeInsights,
  computeRecommendations,
} from '@/lib/analytics';

/* ——— Types ——— */

interface RunRecord {
  id: string;
  mode: string;
  overall_score: number;
  created_at: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { duration_seconds: number };
  };
}

/* ——— Helpers ——— */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ——— Page Component ——— */

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [allRuns, setAllRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    setGreeting(getGreeting());
    setFormattedDate(getFormattedDate());

    fetch('/api/pitch/run')
      .then((r) => r.json())
      .then((data) => setAllRuns(Array.isArray(data) ? data : []))
      .catch(() => setAllRuns([]));
  }, []);

  const totalRuns = allRuns.length;
  const averageScore = totalRuns > 0
    ? Math.round(allRuns.reduce((s, r) => s + r.overall_score, 0) / totalRuns)
    : 0;
  const bestScore = totalRuns > 0
    ? Math.max(...allRuns.map((r) => r.overall_score))
    : 0;

  const rubricCategories = useMemo(() => computeRubricAverages(allRuns), [allRuns]);
  const insights = useMemo(() => computeInsights(rubricCategories), [rubricCategories]);
  const recommendations = useMemo(() => computeRecommendations(rubricCategories), [rubricCategories]);
  const recentRuns = allRuns.slice(0, 3);

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* ——— Header: Greeting + CTA ——— */}
        <div
          className="flex items-center justify-between animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {greeting}, Founder
            </h1>
            <p
              className="text-sm flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Calendar size={14} />
              {formattedDate}
            </p>
          </div>
          <Link href="/session" className="no-underline">
            <div className="session-start-wrap" style={{ borderRadius: 12, padding: 2 }}>
              <div className="session-start-glow" />
              <button
                className="session-start-btn border-0 px-6 cursor-pointer
                           flex items-center gap-2
                           font-semibold text-sm"
                style={{ borderRadius: 10, padding: '10px 20px' }}
              >
                <Zap size={16} />
                Run a Pitch
              </button>
            </div>
          </Link>
        </div>

        {/* ——— Stat Cards Row ——— */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Runs"
            value={String(totalRuns)}
            icon={<Target size={16} />}
            animationDelay="0.08s"
          />
          <StatCard
            label="Average Score"
            value={`${averageScore}/100`}
            icon={<TrendingUp size={16} />}
            animationDelay="0.14s"
          />
          <StatCard
            label="Best Score"
            value={`${bestScore}/100`}
            icon={<Trophy size={16} />}
            animationDelay="0.20s"
          />
        </div>

        {/* ——— Rubric Breakdown ——— */}
        <GlassCard animationDelay="0.26s">
          <SectionHeader className="mb-4">Rubric Breakdown</SectionHeader>
          <div className="flex flex-col gap-3.5">
            {rubricCategories.map((cat, i) => (
              <CategoryBar
                key={cat.id}
                label={cat.label}
                score={cat.score}
                maxScore={cat.maxScore}
                color={getRubricColor(cat.id)}
                delay={i}
              />
            ))}
          </div>
        </GlassCard>

        {/* ——— Top Insights + Practice Recommendations ——— */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard animationDelay="0.32s">
            <SectionHeader className="mb-4">Top Insights</SectionHeader>
            <div className="flex flex-col gap-3">
              {insights.map((insight, i) => (
                <InsightCard key={i} {...insight} delay={i} />
              ))}
            </div>
          </GlassCard>

          <GlassCard animationDelay="0.38s">
            <SectionHeader className="mb-4">Practice Recommendations</SectionHeader>
            <div className="flex flex-col gap-3">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} {...rec} delay={i} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ——— Recent Runs ——— */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.44s', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionHeader>Recent Runs</SectionHeader>
            <Link
              href="/history"
              className="text-xs font-medium no-underline flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              View All
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recentRuns.map((run, i) => (
              <Link
                key={run.id}
                href={`/results/${run.id}`}
                className="no-underline block"
              >
                <div
                  className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer animate-fade-in-up"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    animationDelay: `${0.48 + i * 0.06}s`,
                    animationFillMode: 'both',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <TagPill
                          label={getModeLabel(run.mode as PitchMode)}
                          color={getModeColor(run.mode as PitchMode)}
                          bgColor={getModeBgColor(run.mode as PitchMode)}
                        />
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Calendar size={11} />
                          {formatRunDate(run.created_at)}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Timer size={11} />
                          {formatDuration(run.analysis.delivery_metrics.duration_seconds)}
                        </span>
                      </div>
                      <p
                        className="text-sm truncate leading-snug"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {run.analysis.one_line_verdict}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <ScoreBadge score={run.overall_score} />
                      <ArrowRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Verify the build**

Run: `yarn build`
Expected: No type errors. Dashboard renders the new stacked layout.

**Step 3: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with rubric breakdown, insights, and recommendations"
```

---

### Task 4: Strip analytics page down to score trend only

**Files:**
- Modify: `app/(app)/analytics/page.tsx`

**Step 1: Remove rubric breakdown, top insights, and practice recommendations sections**

In `app/(app)/analytics/page.tsx`, remove:
- The `{/* Two-Column: Rubric Breakdown + Top Insights */}` section (the `grid-cols-2` div containing rubric breakdown and top insights GlassCards)
- The `{/* Practice Recommendations */}` GlassCard section
- Any now-unused imports: `InsightCard`, `RecommendationCard`, `CategoryBar`, `getRubricColor` from UI; `computeRubricAverages`, `computeInsights`, `computeRecommendations` from `@/lib/analytics`
- The `rubricCategories`, `insights`, `recommendations` useMemo calls
- Keep: header, TimeRangeSelector, 4 stat cards, score trend chart, ScoreTrendChart sub-component, filterByRange, computeTrend, and all the stat computations (avgScore, avgDurationStr, etc.)

**Step 2: Verify the build**

Run: `yarn build`
Expected: No type errors. Analytics page shows only header, stats, and trend chart.

**Step 3: Commit**

```bash
git add app/\(app\)/analytics/page.tsx
git commit -m "refactor: strip analytics page to score trend chart only"
```

---

### Task 5: Visual polish pass with frontend-design skill

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (minor tweaks only)

**Step 1: Invoke frontend-design skill**

Use `superpowers:frontend-design` (or the `frontend-design` skill) to review the dashboard and apply polished SaaS visual refinements. Focus areas:
- Consistent spacing rhythm (gap-6 between sections)
- Stat card visual weight (ensure they don't overpower rubric section)
- CTA button visual hierarchy (compact but prominent)
- Empty states (what shows when there are 0 runs — use the existing `EmptyState` component)

**Step 2: Add empty state handling**

If `allRuns.length === 0`, show a centered empty state below the stat cards instead of rubric/insights/recommendations/runs sections. Use the existing `EmptyState` component from `@/views/components/ui`.

**Step 3: Verify visually**

Run: `yarn dev`
Open `http://localhost:3000/dashboard` in browser.
Check: layout looks right in both light and dark mode.

**Step 4: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "polish: dashboard visual refinements and empty state"
```

---

### Task 6: Final verification

**Step 1: Build check**

Run: `yarn build`
Expected: Clean build, no errors.

**Step 2: Run existing tests**

Run: `yarn test`
Expected: All existing tests pass (none test dashboard or analytics page rendering directly).

**Step 3: Manual verification checklist**

- [ ] Dashboard shows greeting, date, CTA, 3 stat cards, rubric breakdown, insights, recommendations, recent runs
- [ ] Analytics shows header, time range, 4 stat cards, score trend chart only
- [ ] Both pages work in light and dark mode
- [ ] Sidebar navigation still works between all pages
- [ ] "View All" link on dashboard goes to /history
- [ ] Recent run cards link to /results/[id]
- [ ] "Run a Pitch" CTA links to /session
