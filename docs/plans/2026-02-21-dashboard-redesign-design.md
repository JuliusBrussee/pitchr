# Dashboard Redesign — Design Doc

**Date:** 2026-02-21
**Goal:** Move rubric breakdown, top insights, and practice recommendations from analytics to the dashboard. Give dashboard a polished SaaS look (Approach A: Stacked Sections). Strip analytics down to score trend only.

## Layout (Stacked Sections)

```
┌─────────────────────────────────────────┐
│  Greeting + Date          [Run a Pitch] │  compact header row
├─────────┬──────────┬────────────────────┤
│ Total   │ Avg Score│ Best Score         │  3 stat cards
├─────────┴──────────┴────────────────────┤
│ Rubric Breakdown (5 category bars)      │  full-width GlassCard
├──────────────────┬──────────────────────┤
│ Top Insights     │ Practice Recs        │  2-col split
├──────────────────┴──────────────────────┤
│ Recent Runs (3 items)    [View All →]   │  compact list
└─────────────────────────────────────────┘
```

## Section Details

### 1. Header
- Greeting + date on left, compact "Run a Pitch" CTA button on right (same gradient border style, pill form)
- Removes the full-width CTA block

### 2. Stat Cards
- 3-col grid: Total Runs, Average Score, Best Score
- Existing `StatCard` component
- Remove hardcoded delta values (`+3`, `+4`) — not computed from real data

### 3. Rubric Breakdown (from analytics)
- Full-width `GlassCard` with 5 `CategoryBar` components
- Uses `computeRubricAverages()` over all runs
- Data from `/api/pitch/run`

### 4. Top Insights + Practice Recommendations (from analytics)
- 2-col grid (`grid-cols-2`)
- Left: `InsightCard` components (strength/improve with colored left border)
- Right: `RecommendationCard` components (gradient icon + tag), stacked vertically
- Uses `computeInsights()` and `computeRecommendations()`

### 5. Recent Runs
- Same card style: mode pill, date, duration, score badge, hover arrow
- "View All" link to `/history`

## Removals from Dashboard
- Sparkline card (trend lives on analytics)
- Pitch Tip card (declutter)
- Full-width CTA block (replaced by header button)

## Analytics Page Changes
- Keep: header + time range selector, 4 stat cards, score trend bar chart
- Remove: rubric breakdown, top insights, practice recommendations

## Shared Code Extraction
Extract from analytics into shared locations:
- `computeRubricAverages()`, `computeInsights()`, `computeRecommendations()` → `lib/analytics.ts`
- `InsightCard`, `RecommendationCard` → `views/components/ui/`
- `CATEGORY_LABELS`, `RECOMMENDATION_GRADIENTS`, `RECOMMENDATION_ICONS` → co-located with extracted code

## Data Flow
Dashboard fetches all runs from `/api/pitch/run` and computes rubric/insights/recommendations client-side (same pattern as analytics).

## Unchanged
- All existing UI components (`GlassCard`, `StatCard`, `CategoryBar`, `ScoreBadge`, `TagPill`, `SectionHeader`)
- CSS variables, glassmorphism, theme system
- Stagger animation pattern
- API endpoints
