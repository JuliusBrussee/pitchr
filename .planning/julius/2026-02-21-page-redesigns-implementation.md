# Page Redesigns Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **REQUIRED DESIGN SKILL:** Each page task (Tasks 3-6) MUST invoke the `frontend-design` skill before writing any JSX. The frontend-design skill generates production-grade, visually distinctive UI. Do NOT skip it.

**Goal:** Bring Dashboard, History, Analytics, and Deck Manager pages into spec with the live session view's design quality and the PRD's data models.

**Architecture:** Extract shared UI primitives into `views/components/ui/`, then rewrite each page using those primitives + `frontend-design` skill for production-grade output. All mock data updated to match PRD schemas (Run, AnalysisResult, /100 scoring, 5 rubric categories).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Lucide React icons, CSS variables for theming, Vitest for tests.

**Key Reference Files:**
- PRD: `/Users/julb/Desktop/GitHub/pitchr/PRD.md`
- Design doc: `/Users/julb/Desktop/GitHub/pitchr/docs/plans/2026-02-21-page-redesigns-design.md`
- Theme variables: `/Users/julb/Desktop/GitHub/pitchr/app/globals.css` (lines 1-29)
- Session view (quality reference): `/Users/julb/Desktop/GitHub/pitchr/views/components/SessionCanvas.tsx`
- MetricsPanel (quality reference): `/Users/julb/Desktop/GitHub/pitchr/views/components/MetricsPanel.tsx`
- App layout: `/Users/julb/Desktop/GitHub/pitchr/app/(app)/layout.tsx`

**Design System Rules (MUST follow for every component):**
- Glass-morphism: `backgroundColor: 'var(--bg-surface)'`, `backdropFilter: 'blur(var(--blur-strength))'`, `borderColor: 'var(--border-color)'`
- Text hierarchy: `--text-primary` (headings/values), `--text-secondary` (body), `--text-muted` (labels/meta)
- Section headers: `text-xs font-semibold uppercase tracking-wider` in `--text-muted`
- Animations: `animate-fade-in-up` class with staggered `animationDelay` and `animationFillMode: 'both'`
- Rounded corners: `rounded-2xl` for cards, `rounded-xl` for inner elements, `rounded-lg` for small chips
- Accent colors: purple (#8b5cf6), blue (#3b82f6), green (#22c55e), orange (#f97316), red (#ef4444)
- All colors via CSS variables for dark/light mode support
- Hover states: use `--bg-surface-hover` background, scale transitions
- Spacing: `p-5` for card padding, `gap-4` between cards, `gap-2` between tight items

---

## Task 1: Shared Color Utilities

**Files:**
- Create: `views/components/ui/colors.ts`
- Test: `views/components/ui/__tests__/colors.test.ts`

**Step 1: Write the failing tests**

Create the test file with tests for score band color/label resolution:

```typescript
// views/components/ui/__tests__/colors.test.ts
import { describe, it, expect } from 'vitest';
import { getScoreBand, getScoreColor, getScoreBandLabel, getModeColor, getModeLabel } from '../colors';

describe('getScoreBand', () => {
  it('returns "needs-work" for scores 0-39', () => {
    expect(getScoreBand(0)).toBe('needs-work');
    expect(getScoreBand(25)).toBe('needs-work');
    expect(getScoreBand(39)).toBe('needs-work');
  });

  it('returns "getting-there" for scores 40-59', () => {
    expect(getScoreBand(40)).toBe('getting-there');
    expect(getScoreBand(59)).toBe('getting-there');
  });

  it('returns "solid" for scores 60-79', () => {
    expect(getScoreBand(60)).toBe('solid');
    expect(getScoreBand(79)).toBe('solid');
  });

  it('returns "investor-ready" for scores 80-100', () => {
    expect(getScoreBand(80)).toBe('investor-ready');
    expect(getScoreBand(100)).toBe('investor-ready');
  });
});

describe('getScoreColor', () => {
  it('returns red for needs-work', () => {
    expect(getScoreColor(25)).toBe('#ef4444');
  });
  it('returns yellow for getting-there', () => {
    expect(getScoreColor(50)).toBe('#eab308');
  });
  it('returns blue for solid', () => {
    expect(getScoreColor(70)).toBe('#3b82f6');
  });
  it('returns green for investor-ready', () => {
    expect(getScoreColor(85)).toBe('#22c55e');
  });
});

describe('getScoreBandLabel', () => {
  it('returns correct labels', () => {
    expect(getScoreBandLabel(25)).toBe('Needs Work');
    expect(getScoreBandLabel(50)).toBe('Getting There');
    expect(getScoreBandLabel(70)).toBe('Solid');
    expect(getScoreBandLabel(85)).toBe('Investor-Ready');
  });
});

describe('getModeColor', () => {
  it('returns orange for elevator', () => {
    expect(getModeColor('elevator')).toBe('#f97316');
  });
  it('returns purple for vc_pitch', () => {
    expect(getModeColor('vc_pitch')).toBe('#8b5cf6');
  });
});

describe('getModeLabel', () => {
  it('returns display labels', () => {
    expect(getModeLabel('elevator')).toBe('Elevator');
    expect(getModeLabel('vc_pitch')).toBe('VC Pitch');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run views/components/ui/__tests__/colors.test.ts`
Expected: FAIL — module not found

**Step 3: Implement colors.ts**

```typescript
// views/components/ui/colors.ts

export type ScoreBand = 'needs-work' | 'getting-there' | 'solid' | 'investor-ready';
export type PitchMode = 'elevator' | 'vc_pitch';

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'investor-ready';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'getting-there';
  return 'needs-work';
}

export function getScoreColor(score: number): string {
  const band = getScoreBand(score);
  const colors: Record<ScoreBand, string> = {
    'needs-work': '#ef4444',
    'getting-there': '#eab308',
    'solid': '#3b82f6',
    'investor-ready': '#22c55e',
  };
  return colors[band];
}

export function getScoreBgColor(score: number): string {
  const color = getScoreColor(score);
  return `${color}1a`; // ~10% opacity hex
}

export function getScoreBandLabel(score: number): string {
  const band = getScoreBand(score);
  const labels: Record<ScoreBand, string> = {
    'needs-work': 'Needs Work',
    'getting-there': 'Getting There',
    'solid': 'Solid',
    'investor-ready': 'Investor-Ready',
  };
  return labels[band];
}

export function getModeColor(mode: PitchMode): string {
  return mode === 'elevator' ? '#f97316' : '#8b5cf6';
}

export function getModeBgColor(mode: PitchMode): string {
  const color = getModeColor(mode);
  return `${color}1a`;
}

export function getModeLabel(mode: PitchMode): string {
  return mode === 'elevator' ? 'Elevator' : 'VC Pitch';
}

/** Rubric category colors */
export const RUBRIC_COLORS: Record<string, string> = {
  structure: '#8b5cf6',
  clarity: '#3b82f6',
  evidence: '#22c55e',
  market: '#f97316',
  delivery: '#ef4444',
};

export function getRubricColor(category: string): string {
  return RUBRIC_COLORS[category] ?? '#6b7280';
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run views/components/ui/__tests__/colors.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add views/components/ui/colors.ts views/components/ui/__tests__/colors.test.ts
git commit -m "feat: add shared score/mode color utilities (PRD-aligned)"
```

---

## Task 2: Shared UI Components

**Files:**
- Create: `views/components/ui/GlassCard.tsx`
- Create: `views/components/ui/StatCard.tsx`
- Create: `views/components/ui/ScoreBadge.tsx`
- Create: `views/components/ui/TagPill.tsx`
- Create: `views/components/ui/SectionHeader.tsx`
- Create: `views/components/ui/SearchInput.tsx`
- Create: `views/components/ui/TimeRangeSelector.tsx`
- Create: `views/components/ui/CategoryBar.tsx`
- Create: `views/components/ui/EmptyState.tsx`
- Create: `views/components/ui/index.ts` (barrel export)

**IMPORTANT:** Before writing ANY component JSX, invoke the `frontend-design` skill. Feed it the design system rules from the top of this plan and ask it to generate each component with production-grade quality matching the SessionCanvas and MetricsPanel quality level.

**Step 1: Create GlassCard**

The foundational container. Must accept `className`, `children`, `padding` variant, and optional `animationDelay`.

```typescript
// views/components/ui/GlassCard.tsx
'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  animationDelay?: string;
  animate?: boolean;
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function GlassCard({
  children,
  className = '',
  padding = 'md',
  animationDelay,
  animate = true,
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border ${paddingMap[padding]} ${animate ? 'animate-fade-in-up' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        ...(animationDelay ? { animationDelay, animationFillMode: 'both' as const } : {}),
      }}
    >
      {children}
    </div>
  );
}
```

**Step 2: Create remaining shared components**

For each component, follow the glass-morphism design system. Reference the existing page patterns:
- `StatCard`: Based on `app/(app)/analytics/page.tsx:343-406` (StatCard function)
- `ScoreBadge`: Based on `app/(app)/history/page.tsx:161-165` (scoreColor function), updated to PRD /100 bands
- `TagPill`: Based on `app/(app)/history/page.tsx:38-52` (TAG_PALETTE)
- `SectionHeader`: Pattern from all pages: `text-xs font-semibold uppercase tracking-wider` with optional icon
- `SearchInput`: Based on `app/(app)/history/page.tsx:265-281`
- `TimeRangeSelector`: Based on `app/(app)/analytics/page.tsx:166-186`
- `CategoryBar`: Based on `app/(app)/analytics/page.tsx:513-555`
- `EmptyState`: Based on `app/(app)/history/page.tsx:316-323`

Each component should:
1. Use CSS variables exclusively (no hardcoded colors in light/dark contexts)
2. Accept sensible props (value, label, icon, etc.)
3. Include proper TypeScript interfaces
4. Follow `'use client'` directive
5. Use `animate-fade-in-up` pattern with staggered delays

**StatCard interface:**
```typescript
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: string;
  deltaDirection?: 'up' | 'down';
  deltaIsGood?: boolean;
  animationDelay?: string;
}
```

**ScoreBadge interface:**
```typescript
interface ScoreBadgeProps {
  score: number;       // 0-100
  showLabel?: boolean; // Show "Investor-Ready" etc.
  size?: 'sm' | 'md';
}
```

**TagPill interface:**
```typescript
interface TagPillProps {
  label: string;
  color: string;      // Accent color
  bgColor?: string;   // Override background
}
```

**Step 3: Create barrel export**

```typescript
// views/components/ui/index.ts
export { GlassCard } from './GlassCard';
export { StatCard } from './StatCard';
export { ScoreBadge } from './ScoreBadge';
export { TagPill } from './TagPill';
export { SectionHeader } from './SectionHeader';
export { SearchInput } from './SearchInput';
export { TimeRangeSelector } from './TimeRangeSelector';
export { CategoryBar } from './CategoryBar';
export { EmptyState } from './EmptyState';
export * from './colors';
```

**Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds with no type errors

**Step 5: Commit**

```bash
git add views/components/ui/
git commit -m "feat: add shared UI component library (GlassCard, StatCard, ScoreBadge, etc.)"
```

---

## Task 3: Dashboard Page Redesign

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (full rewrite)

**CRITICAL:** Before writing any JSX, invoke the `frontend-design` skill. Tell it:
- "Redesign a dashboard page for Pitchr, an AI pitch coaching app"
- Provide the design system rules from top of this plan
- Provide the PRD section 5 (Screen 1: Dashboard)
- Reference the SessionCanvas.tsx and MetricsPanel.tsx as quality benchmarks
- Must use shared components from `views/components/ui/`

**Step 1: Update mock data to PRD schema**

Replace existing mock data with PRD-aligned types:

```typescript
type PitchMode = 'elevator' | 'vc_pitch';

interface MockRun {
  id: string;
  mode: PitchMode;
  overallScore: number;        // 0-100
  one_line_verdict: string;
  createdAt: string;
  duration_seconds: number;
  deck?: string;
}

const RECENT_RUNS: MockRun[] = [
  {
    id: '1',
    mode: 'vc_pitch',
    overallScore: 84,
    one_line_verdict: 'Strong structure but needs concrete traction numbers',
    createdAt: '2026-02-20T14:30:00Z',
    duration_seconds: 522,
    deck: 'Series A Deck v3',
  },
  {
    id: '2',
    mode: 'vc_pitch',
    overallScore: 71,
    one_line_verdict: 'Good energy but closing section runs too long',
    createdAt: '2026-02-18T10:15:00Z',
    duration_seconds: 735,
    deck: 'Series A Deck v3',
  },
  {
    id: '3',
    mode: 'elevator',
    overallScore: 89,
    one_line_verdict: 'Punchy and clear — tighten the market claim',
    createdAt: '2026-02-16T16:45:00Z',
    duration_seconds: 38,
    deck: 'Elevator 60-sec',
  },
];

const STATS = {
  totalRuns: 24,
  averageScore: 78,
  bestScore: 92,
  trend: [62, 65, 68, 71, 67, 72, 74, 78, 84, 78],
};
```

**Step 2: Redesign layout**

The page layout should be:
1. Welcome header with greeting + date
2. Prominent "Run a Pitch" CTA button (purple-blue gradient, breathing animation)
3. 3 StatCards in a row: Total Runs, Average Score (/100), Best Score (/100)
4. Two-column: Recent Runs (3/5 width) using GlassCard + Score Trend sparkline + Pitch Tip (2/5 width)

Each recent run row shows:
- Mode TagPill ("Elevator" orange / "VC Pitch" purple)
- Date + duration
- ScoreBadge with /100 score
- One-line verdict (truncated)
- Arrow → link to `/results/[runId]`

Use shared components: `GlassCard`, `StatCard`, `ScoreBadge`, `TagPill`, `SectionHeader`.

**Step 3: Verify visually**

Run: `npm run dev`
Navigate to `http://localhost:3000/dashboard`
Verify: Dark mode and light mode both look polished, animations stagger correctly, all data displays properly.

**Step 4: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with PRD data model and shared UI components"
```

---

## Task 4: History Page Redesign

**Files:**
- Modify: `app/(app)/history/page.tsx` (full rewrite)

**CRITICAL:** Invoke `frontend-design` skill before writing JSX. Tell it:
- "Redesign a session history page for Pitchr"
- Provide design system rules
- Provide PRD section 5 (Screen 5: History)
- Must use shared components

**Step 1: Update mock data to PRD schema**

```typescript
interface MockRun {
  id: string;
  number: number;
  mode: PitchMode;
  inputType: 'audio' | 'text';
  overallScore: number;        // 0-100
  one_line_verdict: string;
  createdAt: string;
  duration_seconds: number;
  deck?: string;
  dateGroup: 'today' | 'yesterday' | 'thisWeek' | 'earlier';
}
```

Remove the tag system (not in PRD). Add mode filter (All / Elevator / VC Pitch).

**Step 2: Redesign layout**

1. Header card: Title + run count + list/grid toggle + SearchInput + mode filter dropdown
2. Session list (list view): Each row shows play icon, Pitch #{number}, name, mode TagPill, date, duration, ScoreBadge /100, one-line verdict (truncated), delete button (hover), arrow
3. Grid view: Card variant with same data
4. Empty state using EmptyState component
5. Load more button + pagination summary

Key differences from current:
- No tag system
- Mode filter replaces date range filter
- /100 scores with PRD color bands
- One-line verdict display
- Delete button per row

**Step 3: Verify visually**

Run dev server, test both list and grid views, search, mode filter, dark/light mode.

**Step 4: Commit**

```bash
git add app/(app)/history/page.tsx
git commit -m "feat: redesign history page with PRD data model and mode filtering"
```

---

## Task 5: Analytics Page Redesign

**Files:**
- Modify: `app/(app)/analytics/page.tsx` (full rewrite)

**CRITICAL:** Invoke `frontend-design` skill before writing JSX.

**Step 1: Update to PRD rubric categories**

Replace 6 arbitrary categories with PRD's 5 rubric categories:

```typescript
const RUBRIC_CATEGORIES = [
  { id: 'structure', label: 'Structure', score: 16.4, maxScore: 20 },
  { id: 'clarity', label: 'Clarity & Concision', score: 15.8, maxScore: 20 },
  { id: 'evidence', label: 'Evidence & Traction', score: 12.2, maxScore: 20 },
  { id: 'market', label: 'Market & Differentiation', score: 14.6, maxScore: 20 },
  { id: 'delivery', label: 'Delivery', score: 18.0, maxScore: 20 },
];
```

Update insights to reference PRD categories. Update recommendations to match PRD fix patterns.

**Step 2: Redesign layout**

1. Header with BarChart3 icon + "Analytics" title + TimeRangeSelector
2. 4 StatCards: Overall Score (/100), Sessions This Period, Avg Duration, Improvement Rate
3. Score Trend bar chart (/100 scale, bars colored by PRD score bands)
4. Two-column: Rubric Breakdown (5 CategoryBars, each /20) + Top Insights (strength/improve cards tied to rubric categories)
5. Practice Recommendations row (3 cards with rubric category tags using TagPill)

Use `getRubricColor()` from colors.ts for category-specific coloring.

**Step 3: Verify visually**

Check chart renders correctly, category bars animate, dark/light mode works.

**Step 4: Commit**

```bash
git add app/(app)/analytics/page.tsx
git commit -m "feat: redesign analytics with PRD rubric categories and shared components"
```

---

## Task 6: Deck Manager Page Redesign

**Files:**
- Modify: `app/(app)/deck/page.tsx` (full rewrite)

**CRITICAL:** Invoke `frontend-design` skill before writing JSX.

**Step 1: Redesign with shared components**

1. Header: FolderOpen icon + "Deck Manager" title + deck count badge + SearchInput + "Upload New" gradient button
2. Upload dropzone: GlassCard with dashed border, Upload icon, drag-drop hover state
3. "Create with AI" card: GlassCard with Sparkles icon, gradient accent, hover glow
4. Deck grid: Cards with gradient thumbnails, accent icons, slide count badge, metadata (last used, practices, avg score)

Use `GlassCard`, `SearchInput`, `SectionHeader` from shared library.

**Step 2: Verify visually**

Check upload dropzone, card hover states, shimmer effects, dark/light mode.

**Step 3: Commit**

```bash
git add app/(app)/deck/page.tsx
git commit -m "feat: redesign deck manager with shared UI components"
```

---

## Task 7: Final Integration Verification

**Files:** None new — verification only.

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing SiriBubble tests + new color utility tests)

**Step 2: Build verification**

Run: `npx next build`
Expected: No type errors, no build warnings

**Step 3: Visual verification**

Navigate through all pages in dev mode:
- `/dashboard` — Stats, recent runs, CTA button, pitch tip
- `/history` — List view, grid view, search, mode filter, delete
- `/analytics` — Time range, stats, chart, rubric breakdown, insights, recommendations
- `/deck` — Upload, create with AI, deck grid
- Toggle dark/light mode on each page
- Verify animations stagger correctly on each page

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration fixes for page redesigns"
```

---

## Dependency Graph

```
Task 1 (colors.ts) ─┐
                     ├─► Task 3 (Dashboard)  ─┐
Task 2 (UI library) ─┤                         │
                     ├─► Task 4 (History)    ─┤
                     ├─► Task 5 (Analytics)  ─├─► Task 7 (Verification)
                     └─► Task 6 (Deck)       ─┘
```

Tasks 1 and 2 are sequential (2 depends on 1's colors.ts).
Tasks 3, 4, 5, 6 can run in parallel after Task 2 completes.
Task 7 runs after all page tasks complete.

---

## Execution Notes

- **Each page task MUST invoke `frontend-design` skill** before writing JSX. This is what ensures production-grade visual quality. Do not skip it.
- Pages render inside the `app/(app)/layout.tsx` which provides `SidebarProvider` wrapper and `flex h-screen p-4 gap-4` layout. Pages are siblings of the `AppSidebar`. Each page is the `children` slot — it must be a flex child that fills available space.
- The session page (`/session`) renders two flex children side by side (SessionCanvas + MetricsPanel). Other pages typically render a single `<main>` element.
- All pages use `'use client'` directive.
- Mock data stays in the page files (no separate data files for MVP).
- The sidebar currently shows "mock" badges on pages. These badges can remain until real data is wired up.
