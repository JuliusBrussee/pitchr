# Achievements & Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a rich achievements system (~25 achievements), rebuild the settings page with real functionality, and add toast notifications for achievement unlocks.

**Architecture:** Achievement definitions and computation logic live in `lib/achievements.ts`. A `useAchievements` hook manages localStorage persistence and new-unlock detection. The settings page is rebuilt with achievements showcase, appearance, session defaults, and data management. The progress page milestones section is replaced with an achievement summary widget.

**Tech Stack:** React 19, Next.js App Router, TypeScript, Tailwind CSS, lucide-react icons, localStorage persistence

---

### Task 1: Achievement Definitions & Computation Logic

**Files:**
- Create: `lib/achievements.ts`

**Step 1: Create achievement definitions and types**

```typescript
// lib/achievements.ts
import type { ProgressRunRecord } from '@/lib/progress';

export type AchievementCategory = 'sessions' | 'scores' | 'streaks' | 'mastery' | 'improvement' | 'special';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isHidden: boolean;
}

export interface AchievementStatus {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: number;  // 0-1, for "next up" display
}

export interface AchievementState {
  [achievementId: string]: { unlockedAt: string };
}

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'scores', label: 'Scores' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'improvement', label: 'Improvement' },
  { id: 'special', label: 'Special' },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  // Session Milestones
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first pitch session', icon: 'footprints', category: 'sessions', isHidden: false },
  { id: 'warming-up', name: 'Warming Up', description: 'Complete 5 pitch sessions', icon: 'flame', category: 'sessions', isHidden: false },
  { id: 'dedicated-pitcher', name: 'Dedicated Pitcher', description: 'Complete 10 pitch sessions', icon: 'medal', category: 'sessions', isHidden: false },
  { id: 'pitch-veteran', name: 'Pitch Veteran', description: 'Complete 25 pitch sessions', icon: 'shield', category: 'sessions', isHidden: false },
  { id: 'pitch-master', name: 'Pitch Master', description: 'Complete 50 pitch sessions', icon: 'crown', category: 'sessions', isHidden: false },

  // Score Milestones
  { id: 'breaking-through', name: 'Breaking Through', description: 'Score 40 or higher', icon: 'arrow-up-circle', category: 'scores', isHidden: false },
  { id: 'solid-ground', name: 'Solid Ground', description: 'Score 60 or higher', icon: 'target', category: 'scores', isHidden: false },
  { id: 'investor-ready', name: 'Investor-Ready', description: 'Score 80 or higher', icon: 'trophy', category: 'scores', isHidden: false },
  { id: 'perfect-pitch', name: 'Perfect Pitch', description: 'Score 95 or higher', icon: 'gem', category: 'scores', isHidden: false },

  // Streak Achievements
  { id: 'on-a-roll', name: 'On a Roll', description: '3 sessions of consecutive improvement', icon: 'trending-up', category: 'streaks', isHidden: false },
  { id: 'hot-streak', name: 'Hot Streak', description: '5 sessions of consecutive improvement', icon: 'zap', category: 'streaks', isHidden: false },
  { id: 'unstoppable', name: 'Unstoppable', description: '10 sessions of consecutive improvement', icon: 'rocket', category: 'streaks', isHidden: false },
  { id: 'comeback-kid', name: 'Comeback Kid', description: 'Improve score by 20+ points from your lowest', icon: 'rotate-ccw', category: 'streaks', isHidden: false },

  // Category Mastery
  { id: 'story-architect', name: 'Story Architect', description: 'Structure score reaches 18+', icon: 'blocks', category: 'mastery', isHidden: false },
  { id: 'crystal-clear', name: 'Crystal Clear', description: 'Clarity score reaches 18+', icon: 'sparkles', category: 'mastery', isHidden: false },
  { id: 'data-driven', name: 'Data Driven', description: 'Evidence score reaches 18+', icon: 'bar-chart-3', category: 'mastery', isHidden: false },
  { id: 'market-maven', name: 'Market Maven', description: 'Market score reaches 18+', icon: 'globe', category: 'mastery', isHidden: false },
  { id: 'stage-presence', name: 'Stage Presence', description: 'Delivery score reaches 18+', icon: 'mic', category: 'mastery', isHidden: false },

  // Improvement
  { id: 'quick-learner', name: 'Quick Learner', description: 'Improve overall score by 10+ in first 3 sessions', icon: 'brain', category: 'improvement', isHidden: false },
  { id: 'big-leap', name: 'Big Leap', description: 'Single session improvement of 15+ points', icon: 'move-up', category: 'improvement', isHidden: false },
  { id: 'well-rounded', name: 'Well-Rounded', description: 'All 5 categories at Solid (12+) or better', icon: 'star', category: 'improvement', isHidden: false },
  { id: 'fix-machine', name: 'Fix Machine', description: 'Resolve 10 tracked fixes', icon: 'wrench', category: 'improvement', isHidden: false },

  // Hidden/Special
  { id: 'night-owl', name: 'Night Owl', description: 'Complete a session after midnight', icon: 'moon', category: 'special', isHidden: true },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete a session before 6 AM', icon: 'sunrise', category: 'special', isHidden: true },
  { id: 'marathon', name: 'Marathon', description: 'Complete 3 sessions in a single day', icon: 'timer', category: 'special', isHidden: true },
];
```

**Step 2: Write the `checkAchievements` computation function**

This function takes runs and resolved fix count, returns a map of achievement IDs to whether they're earned.

```typescript
interface CheckResult {
  earned: Set<string>;
  progress: Map<string, number>;  // 0-1 progress for unearned
}

export function checkAchievements(
  runs: ProgressRunRecord[],
  resolvedFixCount: number,
): CheckResult {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const earned = new Set<string>();
  const progress = new Map<string, number>();
  const n = sorted.length;

  // --- Session milestones ---
  const sessionThresholds = [
    { id: 'first-steps', threshold: 1 },
    { id: 'warming-up', threshold: 5 },
    { id: 'dedicated-pitcher', threshold: 10 },
    { id: 'pitch-veteran', threshold: 25 },
    { id: 'pitch-master', threshold: 50 },
  ];
  for (const { id, threshold } of sessionThresholds) {
    if (n >= threshold) earned.add(id);
    else progress.set(id, n / threshold);
  }

  // --- Score milestones ---
  const maxScore = n > 0 ? Math.max(...sorted.map((r) => r.overallScore)) : 0;
  const scoreThresholds = [
    { id: 'breaking-through', threshold: 40 },
    { id: 'solid-ground', threshold: 60 },
    { id: 'investor-ready', threshold: 80 },
    { id: 'perfect-pitch', threshold: 95 },
  ];
  for (const { id, threshold } of scoreThresholds) {
    if (maxScore >= threshold) earned.add(id);
    else progress.set(id, Math.min(maxScore / threshold, 0.99));
  }

  // --- Streak achievements ---
  let longestStreak = 0;
  let streak = 0;
  for (let i = 1; i < n; i++) {
    if (sorted[i].overallScore > sorted[i - 1].overallScore) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }
  const streakThresholds = [
    { id: 'on-a-roll', threshold: 3 },
    { id: 'hot-streak', threshold: 5 },
    { id: 'unstoppable', threshold: 10 },
  ];
  for (const { id, threshold } of streakThresholds) {
    if (longestStreak >= threshold) earned.add(id);
    else progress.set(id, longestStreak / threshold);
  }

  // Comeback Kid
  if (n >= 2) {
    const minScore = Math.min(...sorted.map((r) => r.overallScore));
    const comebackDelta = maxScore - minScore;
    if (comebackDelta >= 20) earned.add('comeback-kid');
    else progress.set('comeback-kid', comebackDelta / 20);
  }

  // --- Category mastery ---
  const categoryMap: Record<string, { id: string; cat: string }> = {
    structure: { id: 'story-architect', cat: 'structure' },
    clarity: { id: 'crystal-clear', cat: 'clarity' },
    evidence: { id: 'data-driven', cat: 'evidence' },
    market: { id: 'market-maven', cat: 'market' },
    delivery: { id: 'stage-presence', cat: 'delivery' },
  };
  for (const [catKey, { id }] of Object.entries(categoryMap)) {
    let best = 0;
    for (const run of sorted) {
      const rb = run.analysis.rubric_breakdown.find((r) => r.category === catKey);
      if (rb) best = Math.max(best, rb.score);
    }
    if (best >= 18) earned.add(id);
    else progress.set(id, best / 18);
  }

  // --- Improvement ---
  // Quick Learner: +10 in first 3 sessions
  if (n >= 2) {
    const firstThree = sorted.slice(0, 3);
    const qlDelta = firstThree[firstThree.length - 1].overallScore - firstThree[0].overallScore;
    if (qlDelta >= 10) earned.add('quick-learner');
    else progress.set('quick-learner', Math.max(0, qlDelta / 10));
  }

  // Big Leap: single session +15
  let biggestLeap = 0;
  for (let i = 1; i < n; i++) {
    const delta = sorted[i].overallScore - sorted[i - 1].overallScore;
    biggestLeap = Math.max(biggestLeap, delta);
  }
  if (biggestLeap >= 15) earned.add('big-leap');
  else if (n >= 2) progress.set('big-leap', biggestLeap / 15);

  // Well-Rounded: all 5 categories at 12+
  if (n > 0) {
    const latestRun = sorted[n - 1];
    const cats = ['structure', 'clarity', 'evidence', 'market', 'delivery'];
    let above12 = 0;
    for (const cat of cats) {
      const rb = latestRun.analysis.rubric_breakdown.find((r) => r.category === cat);
      if (rb && rb.score >= 12) above12++;
    }
    if (above12 === 5) earned.add('well-rounded');
    else progress.set('well-rounded', above12 / 5);
  }

  // Fix Machine: 10 resolved fixes
  if (resolvedFixCount >= 10) earned.add('fix-machine');
  else progress.set('fix-machine', resolvedFixCount / 10);

  // --- Hidden/Special ---
  for (const run of sorted) {
    const hour = new Date(run.createdAt).getHours();
    if (hour >= 0 && hour < 6) {
      earned.add('night-owl');
      if (hour < 6) earned.add('early-bird');
    }
  }

  // Marathon: 3 sessions in one day
  const dayMap = new Map<string, number>();
  for (const run of sorted) {
    const day = new Date(run.createdAt).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const maxInDay = Math.max(0, ...dayMap.values());
  if (maxInDay >= 3) earned.add('marathon');
  else if (maxInDay > 0) progress.set('marathon', maxInDay / 3);

  return { earned, progress };
}
```

**Step 3: Add localStorage helpers**

```typescript
const STORAGE_KEY = 'pitchr_achievements';

export function loadAchievementState(): AchievementState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAchievementState(state: AchievementState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resolveAchievements(
  runs: ProgressRunRecord[],
  resolvedFixCount: number,
  persistedState: AchievementState,
): { statuses: AchievementStatus[]; newUnlocks: AchievementStatus[] } {
  const { earned, progress: progressMap } = checkAchievements(runs, resolvedFixCount);
  const now = new Date().toISOString();
  const newUnlocks: AchievementStatus[] = [];
  const updatedState = { ...persistedState };

  const statuses: AchievementStatus[] = ACHIEVEMENTS.map((def) => {
    const isEarned = earned.has(def.id);
    const persisted = persistedState[def.id];

    if (isEarned && !persisted) {
      updatedState[def.id] = { unlockedAt: now };
      const status: AchievementStatus = { def, unlocked: true, unlockedAt: now };
      newUnlocks.push(status);
      return status;
    }

    if (isEarned && persisted) {
      return { def, unlocked: true, unlockedAt: persisted.unlockedAt };
    }

    return {
      def,
      unlocked: false,
      unlockedAt: null,
      progress: progressMap.get(def.id) ?? 0,
    };
  });

  if (newUnlocks.length > 0) {
    saveAchievementState(updatedState);
  }

  return { statuses, newUnlocks };
}
```

**Step 4: Commit**

```bash
git add lib/achievements.ts
git commit -m "feat: add achievement definitions and computation logic"
```

---

### Task 2: useAchievements Hook

**Files:**
- Create: `hooks/useAchievements.ts`

**Step 1: Create the hook**

```typescript
// hooks/useAchievements.ts
'use client';

import { useState, useCallback } from 'react';
import type { ProgressRunRecord } from '@/lib/progress';
import type { AchievementStatus, AchievementState } from '@/lib/achievements';
import {
  loadAchievementState,
  resolveAchievements,
} from '@/lib/achievements';

interface UseAchievementsResult {
  statuses: AchievementStatus[];
  newUnlocks: AchievementStatus[];
  unlockedCount: number;
  totalCount: number;
  clearNewUnlocks: () => void;
}

export function useAchievements(
  runs: ProgressRunRecord[],
  resolvedFixCount: number,
): UseAchievementsResult {
  const [persistedState] = useState<AchievementState>(() => loadAchievementState());
  const [newUnlocksState, setNewUnlocks] = useState<AchievementStatus[]>([]);

  const { statuses, newUnlocks } = resolveAchievements(runs, resolvedFixCount, persistedState);

  // Only set new unlocks once when they first appear
  if (newUnlocks.length > 0 && newUnlocksState.length === 0) {
    setNewUnlocks(newUnlocks);
  }

  const clearNewUnlocks = useCallback(() => setNewUnlocks([]), []);

  const unlockedCount = statuses.filter((s) => s.unlocked).length;

  return {
    statuses,
    newUnlocks: newUnlocksState,
    unlockedCount,
    totalCount: statuses.length,
    clearNewUnlocks,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useAchievements.ts
git commit -m "feat: add useAchievements hook with persistence"
```

---

### Task 3: useSettings Hook

**Files:**
- Create: `hooks/useSettings.ts`

**Step 1: Create localStorage-based settings hook**

```typescript
// hooks/useSettings.ts
'use client';

import { useState, useCallback } from 'react';
import type { PitchMode } from '@/types';

const STORAGE_KEY = 'pitchr_settings';

export interface AppSettings {
  timerSeconds: number;
  defaultMode: PitchMode;
}

const DEFAULTS: AppSettings = {
  timerSeconds: 300,
  defaultMode: 'elevator',
};

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSetting };
}
```

**Step 2: Commit**

```bash
git add hooks/useSettings.ts
git commit -m "feat: add useSettings hook with localStorage persistence"
```

---

### Task 4: Achievement Components

**Files:**
- Create: `views/components/achievements/AchievementCard.tsx`
- Create: `views/components/achievements/AchievementGrid.tsx`
- Create: `views/components/achievements/AchievementToast.tsx`
- Create: `views/components/achievements/AchievementSummary.tsx`
- Create: `views/components/achievements/index.ts`

**Step 1: Create AchievementCard**

A single achievement card that shows icon, name, description, unlock date. Handles locked/hidden states.

Key props: `status: AchievementStatus`, `compact?: boolean`

The card uses lucide-react dynamic icon lookup. Since lucide doesn't support string-to-icon mapping natively, create a lookup map of the ~25 icons used.

**Step 2: Create AchievementGrid**

Grid of AchievementCards with category filter pills at the top. Props: `statuses: AchievementStatus[]`

Filter state: `'all' | AchievementCategory`. 3-column grid on desktop, 2 on tablet, 1 on mobile. Shows progress bar at top with "X / 25 Unlocked".

**Step 3: Create AchievementToast**

Slide-in notification from top-right. Auto-dismisses after 4 seconds. Shows achievement icon, name, and "Achievement Unlocked!" label.

Uses CSS keyframes for slide-in animation. Stacks multiple toasts with offset.

**Step 4: Create AchievementSummary**

Widget for the progress page. Shows:
- Up to 4 most recently unlocked achievements (sorted by unlockedAt desc)
- Up to 3 next-closest-to-unlocking (sorted by progress desc, excluding hidden)
- "View All Achievements" link to `/settings`

**Step 5: Create barrel export**

```typescript
// views/components/achievements/index.ts
export { AchievementCard } from './AchievementCard';
export { AchievementGrid } from './AchievementGrid';
export { AchievementToast } from './AchievementToast';
export { AchievementSummary } from './AchievementSummary';
```

**Step 6: Commit**

```bash
git add views/components/achievements/
git commit -m "feat: add achievement UI components (card, grid, toast, summary)"
```

---

### Task 5: Rebuild Settings Page

**Files:**
- Modify: `app/(app)/settings/page.tsx` — Complete rewrite

**Step 1: Rewrite settings page**

Remove all mock settings (AI Feedback Preferences, Profile section, Camera/Mic dropdowns, Compact Mode). Replace with:

1. **Achievements Showcase** — Uses `AchievementGrid` component. Fetches runs from `/api/pitch/run`, computes achievements via `useAchievements`, passes statuses to grid.

2. **Appearance** — Theme toggle (System/Light/Dark) using existing ThemeProvider's `toggleTheme` + `isDark`. Keep the existing `SectionCard` and `SettingRow` sub-components.

3. **Session Defaults** — Timer duration (+/- 30s buttons), Default pitch mode (elevator/vc_pitch toggle). Uses `useSettings` hook.

4. **Data Management** — Export Data: downloads all runs as JSON file using `Blob` + `URL.createObjectURL` + click. Clear All Data: deletes runs via API + clears localStorage achievements + confirms.

Keep the reusable `SectionCard`, `SettingRow`, `ToggleSwitch` sub-components from the current file since they're used throughout. Remove unused imports and mock state.

**Step 2: Commit**

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "feat: rebuild settings page with achievements, real settings, and data management"
```

---

### Task 6: Update Progress Page Milestones Section

**Files:**
- Modify: `app/(app)/progress/page.tsx`

**Step 1: Replace milestones section**

Replace the current milestones section (lines ~278-291 in progress page) that uses `StreakBadge` with `AchievementSummary`.

Import `useAchievements` and `AchievementSummary`. Compute resolved fix count from `progress.fixes`. Pass runs and resolvedFixCount to `useAchievements`. Render `AchievementSummary` with the statuses.

Remove the `StreakBadge` import (it's no longer needed on this page).

**Step 2: Commit**

```bash
git add app/\(app\)/progress/page.tsx
git commit -m "feat: replace milestones section with achievement summary widget"
```

---

### Task 7: Add Toast to App Layout

**Files:**
- Modify: `app/(app)/layout.tsx`

**Step 1: Add AchievementToast container**

The toast needs to be rendered at the layout level so it appears above all pages. However, the toast is triggered by the `useAchievements` hook which needs run data.

Approach: Create a lightweight `AchievementToastProvider` that wraps the layout. It listens for a custom event (`achievement-unlocked`) dispatched by pages when new achievements are detected. The provider renders the toast stack.

Alternative simpler approach: The `AchievementToast` component is self-contained and rendered on the results page and progress page where achievements are computed. It uses `position: fixed` so it appears above everything regardless of where it's rendered in the DOM.

Go with the simpler approach — render `AchievementToast` directly on pages that compute achievements (progress page, results page). No layout changes needed.

**Step 2: Commit (if layout changes are made)**

---

### Task 8: Add Settings to Sidebar

**Files:**
- Modify: `views/components/AppSidebar.tsx`

**Step 1: Add Settings nav link**

Import `Settings` icon from lucide-react. Add to `TOOL_ITEMS` array:

```typescript
{ id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
```

**Step 2: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat: add settings link to sidebar navigation"
```

---

### Task 9: Verify Build & Test

**Step 1: Run build**

```bash
yarn build
```

Fix any TypeScript errors.

**Step 2: Run tests**

```bash
yarn test
```

Fix any test failures.

**Step 3: Manual smoke test**

- Visit `/settings` — verify achievements grid, appearance toggle, session defaults, data management all work
- Visit `/progress` — verify achievement summary replaces old milestones section
- Check sidebar has Settings link
- Verify localStorage persistence (refresh page, settings should persist)

**Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix: resolve build/test issues"
```
