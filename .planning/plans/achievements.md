# Achievements System & Settings Page Design

## Overview

Build a rich achievements system (~25 achievements across 6 categories) with toast notifications on unlock, replace the progress page milestones section with an achievement summary, and rebuild the settings page with real functionality (achievements showcase, theme, session defaults, data management).

## Achievement System

### Categories & Achievements (~25 total)

**Session Milestones** (5): First Steps (1), Warming Up (5), Dedicated Pitcher (10), Pitch Veteran (25), Pitch Master (50)

**Score Milestones** (4): Breaking Through (40+), Solid Ground (60+), Investor-Ready (80+), Perfect Pitch (95+)

**Streak Achievements** (4): On a Roll (3 improving), Hot Streak (5 improving), Unstoppable (10 improving), Comeback Kid (+20 from lowest)

**Category Mastery** (5): Story Architect (Structure 18+), Crystal Clear (Clarity 18+), Data Driven (Evidence 18+), Market Maven (Market 18+), Stage Presence (Delivery 18+)

**Improvement** (4): Quick Learner (+10 in first 3), Big Leap (+15 single session), Well-Rounded (all categories 12+), Fix Machine (10 fixes resolved)

**Hidden/Special** (3): Night Owl (after midnight), Early Bird (before 6 AM), Marathon (3 sessions in one day)

### Data Model

```typescript
interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;           // lucide-react icon name
  category: 'sessions' | 'scores' | 'streaks' | 'mastery' | 'improvement' | 'special';
  isHidden: boolean;
}

interface AchievementState {
  [achievementId: string]: {
    unlockedAt: string;   // ISO date
  };
}
```

Persisted to localStorage key `pitchr_achievements`.

### Computation

All achievements computed from run history (same pattern as `lib/progress.ts` `computeProgress()`). The `checkAchievements()` function takes runs array and returns which achievements are earned. Compare against persisted state to detect new unlocks.

## Settings Page

### Sections (top to bottom)

1. **Achievements Showcase** — progress bar, grid of cards (3-4 cols) with category filter pills, hidden achievements show as "???"
2. **Appearance** — Theme toggle (System/Light/Dark), uses existing ThemeProvider
3. **Session Defaults** — Timer duration (+/- buttons), Default pitch mode selector. Persisted to localStorage `pitchr_settings`.
4. **Data Management** — Export Data (download runs as JSON), Clear All Data (confirmation modal, deletes runs + resets achievements)

### Navigation

Add Settings to sidebar with Settings/gear icon below main nav items.

## Progress Page Updates

Replace `StreakBadge` milestones section with `AchievementSummary`:
- Up to 4 most recently unlocked achievements
- Up to 3 next-closest-to-unlocking with progress indicators
- "View All" link to `/settings#achievements`

## Toast Notification System

- `AchievementToast` component with slide-in animation from top-right, 4s auto-dismiss
- Rendered at app layout level
- `useAchievements` hook: compute, persist, detect new unlocks, fire toasts
- Triggered on results page after analysis completes

## New Files

```
lib/achievements.ts                    # Definitions + computation
hooks/useAchievements.ts               # Hook: compute, persist, detect unlocks
hooks/useSettings.ts                   # Hook: localStorage settings
views/components/achievements/
  AchievementCard.tsx                  # Single card
  AchievementGrid.tsx                  # Grid with filters
  AchievementToast.tsx                 # Toast notification
  AchievementSummary.tsx               # Progress page widget
```

## Modified Files

- `app/(app)/settings/page.tsx` — Complete rewrite
- `app/(app)/progress/page.tsx` — Replace milestones section
- `app/(app)/layout.tsx` — Add toast container
- `views/components/AppSidebar.tsx` — Add settings nav link
- `lib/progress.ts` — May refactor milestone logic to use new achievement system
