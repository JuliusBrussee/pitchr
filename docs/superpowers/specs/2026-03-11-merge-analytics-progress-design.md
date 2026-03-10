# Design: Merge Analytics + Progress → Insights

## Summary

Consolidate the Analytics and Progress pages into a single "Insights" page. History remains unchanged. This reduces the sidebar from 3 data pages to 2 (History + Insights) and eliminates user confusion about where to find performance data.

## Motivation

- Too many nav items for data pages (Analytics, Progress, History)
- Users unsure whether to check Analytics or Progress for performance info
- Significant data overlap between the two pages

## Decision

**Merge Analytics + Progress = "Insights"** (Option B from brainstorming). History stays as-is since it serves a distinct purpose (browsing/playing past recordings).

## Page Structure

The Insights page flows top-to-bottom in this order:

### 1. Top Bar
- Page title "Insights"
- Project filter dropdown (from Progress)
- Time range selector: 7D / 30D / 90D / All (from Analytics)

### 2. Progress Hero (from Progress)
- Score ring with current average score
- Current level tier name + level X of 6
- Competitive context text ("Better than X% of users")
- **New**: Streak count and session count rendered as small stat boxes to the right of the score ring (inside the hero card, similar to the wireframe layout). This requires adding two new UI elements to the `ProgressHero` component — a `streak` and `sessionCount` prop, rendered in small `background: #1e1e2e` boxes stacked vertically beside the text content.

### 3. Summary Strip
3 stat cards in a row (score/level already covered by Hero):
- Average WPM (with delta — computed by splitting runs into newer/older halves, same approach as Analytics)
- Average Duration
- Total Filler Word Count (with delta — same newer/older half comparison). Note: this is total count, not per-minute rate, matching the existing Analytics computation.

### 4. Score Trend (from Analytics)
- Line chart showing overall score over time
- Time buckets adapt to selected range (days/weeks/months)
- Time range filtering is entirely client-side using the existing `filterByRange` logic from Analytics

### 5. Category Trends (from Analytics)
- Stacked bar chart showing 5 rubric categories over time
- Color legend: Structure, Clarity, Evidence, Market, Delivery

### 6. Skill Ladder (from Progress)
- 5 horizontal progress bars, one per rubric category
- Each shows: category name, fill bar, delta indicator (improving/stagnant/regressing)

### 7. Delivery Metrics (from Analytics)
Side-by-side layout:
- **Speaking Pace**: Bar chart with ideal range zone (130-160 WPM)
- **Filler Words**: Trend chart + top filler words with aggregated counts

### 8. Fix Tracker (from Progress)
- Deduplicated list of recurring issues
- Each shows: issue description, occurrence count, Open/Resolved status
- Resolved = not seen in last 2 sessions

### 9. Achievements (from Progress)
- Badge grid showing earned and locked achievements
- Earned badges have gradient background, locked are dashed/dimmed
- Uses `useAchievements` hook with `processRuns` call (carried over from Progress page)

## What Gets Dropped

- **Momentum Panel** (Progress) — streak moves to Hero; biggest win/weakest skill covered by Skill Ladder
- **Score Timeline** (Progress) — redundant with Score Trend chart from Analytics
- **Category Progress Cards** (Progress) — expandable deep-dive per category replaced by Skill Ladder + Category Trends chart
- **Analytics page stat cards** (Analytics) — replaced by Hero + Summary Strip
- **`ProgressKanban`** and **`StreakBadge`** components — unused dead code in `views/components/progress/`, delete them
- **`useTutorial('progress')` integration** — drop tutorial tour attributes; can be re-added later with updated IDs for the new page if needed

## Navigation & Routing

- **New route**: `/insights`
- **Remove**: `/analytics` route and page
- **Redirect**: `/progress` → `/insights` (preserve bookmarks)
- **Sidebar**: Remove "Analytics" item, rename "Progress" → "Insights"
- **History**: Unchanged at `/history`

## Data Fetching

- Single fetch to `pitch-run` edge function with `allProjects: true` and `summary: true`
- Client-side filtering by selected project (dropdown)
- **Time range filtering is client-side** — the `filterByRange` logic from Analytics is carried over, no server-side date params
- Run both `computeProgress()` and trend computation (bucket building, delta calculation) on the same normalized dataset
- Single loading state with `useDelayedLoading()` skeleton
- Error handling via `useSmartTooltip()` ref pattern

## Components

### Reused from Progress (`views/components/progress/`)
- `ProgressHero` — modified to accept `streak` and `sessionCount` props
- `SkillLadder`
- `FixTracker`

### Reused from other locations
- `AchievementSummary` — from `views/components/achievements/` (not `progress/`)
- `useAchievements` hook — carried over with `processRuns` integration
- `ProjectSelect` — from `views/components/ui/`
- `TimeRangeSelector` — from `views/components/ui/`
- `StatCard` — from `views/components/ui/`

### Extracted from Analytics page (currently inline in `app/(app)/analytics/page.tsx`)
These chart sub-components are defined inline in the Analytics page and must be **extracted into standalone files** under `views/components/insights/` before reuse:
- `ScoreTrendChart` — line chart for overall score over time
- `RubricTrendChart` — stacked bar chart for rubric categories
- `WpmTrendChart` — bar chart with ideal range zone
- `FillerTrendChart` — filler word trend over time
- `FillerAggregateTable` — table of most-used filler words with counts

### Dropped
- `MomentumPanel`
- `ScoreTimeline` (Progress version)
- `CategoryProgressCard`
- `ProgressKanban` (unused)
- `StreakBadge` (unused)

## Files Affected

### Delete
- `app/(app)/analytics/page.tsx`

### Create
- `app/(app)/insights/page.tsx` — the new merged page
- `app/(app)/progress/page.tsx` — redirect to `/insights`
- `views/components/insights/ScoreTrendChart.tsx` — extracted from Analytics
- `views/components/insights/RubricTrendChart.tsx` — extracted from Analytics
- `views/components/insights/WpmTrendChart.tsx` — extracted from Analytics
- `views/components/insights/FillerTrendChart.tsx` — extracted from Analytics
- `views/components/insights/FillerAggregateTable.tsx` — extracted from Analytics
- `views/components/insights/index.ts` — barrel export

### Modify
- Sidebar navigation component — remove Analytics, rename Progress → Insights, update route
- `views/components/progress/ProgressHero.tsx` — add `streak` and `sessionCount` props with UI
- `views/components/progress/index.ts` — remove exports for dropped components

### Delete (dead code cleanup)
- `views/components/progress/ProgressKanban.tsx` (if exists, unused)
- `views/components/progress/StreakBadge.tsx` (if exists, unused)

## Wireframe

See `.superpowers/brainstorm/` directory for the visual mockup created during brainstorming.
