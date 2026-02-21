# Page Redesigns — Design Document

**Date:** 2026-02-21
**Scope:** Dashboard, History, Analytics, Deck Manager
**Approach:** Shared component library + per-page rewrites using frontend-design skill
**Reference:** PRD.md (data models, rubric, demo flow)

---

## Goal

Update all non-session pages to:
1. Match the live session view's glass-morphism design quality
2. Align with PRD data models (Run, AnalysisResult, /100 scoring, 5 rubric categories)
3. Use shared UI primitives for consistency
4. Be ready for real backend wiring

---

## Phase 1: Shared Component Library

Extract into `views/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Frosted glass container (border, backdrop blur, padding variants) |
| `StatCard` | Metric display: label, value, icon, optional delta trend |
| `ScoreBadge` | Color-coded score pill (/100 scale: 0-39 Needs Work red, 40-59 Getting There yellow, 60-79 Solid blue, 80-100 Investor-Ready green) |
| `TagPill` | Colored tag with palette lookup |
| `SectionHeader` | Uppercase tracking-wider section title + optional icon |
| `SearchInput` | Glass-styled search with icon |
| `TimeRangeSelector` | Segmented control (7D/30D/90D/All) |
| `CategoryBar` | Horizontal progress bar with label + score (for rubric breakdowns) |
| `EmptyState` | Centered icon + message for zero states |
| `colors.ts` | Score band colors, mode colors, shared color utilities |

### Design Tokens (from globals.css)

All components use CSS variables:
- `--bg-surface`, `--bg-surface-hover` for glass backgrounds
- `--border-color` for borders
- `--blur-strength` for backdrop blur
- `--text-primary`, `--text-secondary`, `--text-muted` for text hierarchy
- Accent colors: purple (#8b5cf6), blue (#3b82f6), green (#22c55e), orange (#f97316), red (#ef4444)

### Score Bands (from PRD rubric)

| Range | Label | Color |
|-------|-------|-------|
| 0-39 | Needs Work | #ef4444 (red) |
| 40-59 | Getting There | #eab308 (yellow) |
| 60-79 | Solid | #3b82f6 (blue) |
| 80-100 | Investor-Ready | #22c55e (green) |

---

## Phase 2: Dashboard (`/dashboard`)

### Layout
- Greeting header with date
- Prominent "Run a Pitch" CTA (gradient button, breathe animation)
- 3 stat cards: Total Runs, Average Score (/100), Best Score (/100)
- Two-column: Recent Runs (3/5) + Score Trend sparkline + Pitch Tip (2/5)

### Mock Data (PRD-aligned)
```typescript
interface MockRun {
  id: string
  mode: 'elevator' | 'vc_pitch'
  overallScore: number        // 0-100
  one_line_verdict: string
  createdAt: string
  duration_seconds: number
}
```

### Changes from Current
- 4 stat cards → 3 (remove Practice Streak, not in PRD)
- Score /10 → /100
- Add mode badges (Elevator/VC Pitch)
- Add one-line verdict to recent runs
- Replace quick action cards with single "Run a Pitch" CTA
- Score sparkline chart

---

## Phase 3: History (`/history`)

### Layout
- Header card: title + count + list/grid toggle + search + mode filter (All/Elevator/VC Pitch)
- Session list rows: play icon, pitch name, mode TagPill, date, duration, ScoreBadge /100, verdict, delete btn, arrow
- Grid view: card variant of same data
- Load more / pagination

### Mock Data (PRD-aligned)
```typescript
interface MockRun {
  id: string
  number: number
  mode: 'elevator' | 'vc_pitch'
  inputType: 'audio' | 'text'
  overallScore: number        // 0-100
  one_line_verdict: string
  createdAt: string
  duration_seconds: number
  deck?: string
}
```

### Changes from Current
- Remove tag system (not in PRD)
- Add mode filter (Elevator/VC Pitch/All)
- Add one-line verdict display
- Score colors → PRD bands
- Add delete button per row
- Update date grouping labels

---

## Phase 4: Analytics (`/analytics`)

### Layout
- Header: title + TimeRangeSelector
- 4 StatCards: Overall Score, Sessions, Avg Duration, Improvement Rate
- Score Trend bar chart (/100 scale)
- Two-column: Rubric Breakdown (5 CategoryBars) + Top Insights
- Practice Recommendations row

### Rubric Categories (from PRD)
1. Structure (/20)
2. Clarity & Concision (/20)
3. Evidence & Traction (/20)
4. Market & Differentiation (/20)
5. Delivery (/20)

### Changes from Current
- 6 arbitrary categories → 5 PRD rubric categories
- Scores /10 → /20 per category
- Insights tied to rubric categories
- Recommendations reference PRD improvement patterns

---

## Phase 5: Deck Manager (`/deck`)

### Layout
- Keep existing structure: Header + Upload Dropzone + "Create with AI" + Deck Grid
- Use shared GlassCard, SearchInput, SectionHeader
- Polish to match session view quality

### Changes from Current
- Replace inline glass styling with GlassCard
- Consistent animation timing
- Minor visual alignment

---

## Implementation Notes

- Each page redesign uses the `frontend-design` skill for production-grade output
- All pages use the shared component library from Phase 1
- Mock data structures match PRD types for easy backend wiring
- Animations: `animate-fade-in-up` with staggered delays (existing pattern)
- Dark/light mode: all CSS variable-based (existing system)
- Each phase is independently testable
