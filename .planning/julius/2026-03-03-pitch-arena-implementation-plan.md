# Pitch Arena — Parallel Agent Implementation Plan

**Source:** `2026-03-03-pitch-competition-planning.md`
**Date:** 2026-03-03
**Pattern:** 1 Orchestrator + N parallel worker agents

---

## Orchestrator Responsibilities

The orchestrator runs tasks in **waves**. Each wave contains tasks that can run in parallel. A wave must complete before the next wave starts. Within each phase, waves are numbered.

```
Phase 1 (Foundation)
  Wave 1.1: [DB Migration] [Config] [Types]           ← parallel, no deps
  Wave 1.2: [XP Service] [Scenario Service] [Models]  ← depend on types/config
  Wave 1.3: [Game Mode API] [Stats Hook]               ← depend on services
  Wave 1.4: [Game Mode UI]                              ← depend on API + hook

Phase 2 (Challenges)
  Wave 2.1: [Challenge Service] [Bonus Scoring]        ← depend on Phase 1
  Wave 2.2: [Challenge API] [Challenge Cron]           ← depend on service
  Wave 2.3: [Challenge UI] [Challenge Leaderboard]     ← depend on API

Phase 3 (Leagues & Leaderboards)
  Wave 3.1: [League Service] [Matchmaking]             ← depend on Phase 2
  Wave 3.2: [League API] [League Cron]                 ← depend on service
  Wave 3.3: [League UI] [Arena Hub] [Dashboard Widget] ← depend on API

Phase 4 (Polish & Engagement)
  Wave 4.1: [Streak System] [Badge System]             ← depend on Phase 3
  Wave 4.2: [Billing Integration] [Notifications]      ← depend on streak/badge
  Wave 4.3: [E2E Tests]                                ← depend on everything
```

---

## Phase 1: Foundation

### Wave 1.1 — Zero-dependency setup (3 agents, parallel)

#### Agent 1A: Database Migration
**File:** `supabase/migrations/20260304000001_pitch_arena.sql`

Create all arena tables in a single migration:

```sql
-- Tables to create (see planning doc §11 for full schemas):
-- 1. scenarios (pitch scenario content)
-- 2. challenges (weekly competition instances)
-- 3. challenge_submissions (user entries)
-- 4. game_mode_sessions (practice attempts)
-- 5. leagues (weekly league instances)
-- 6. league_memberships (user-league assignments)
-- 7. user_stats (persistent progression)
-- 8. xp_events (granular XP log)
-- Plus: all indexes, RLS policies
```

Key details:
- `scenarios.brief` is JSONB with structure: `{ company_name, one_liner, industry, stage, team, metrics: { revenue, users, growth }, market: { tam, sam, som }, ask: { amount, use_of_funds }, differentiator, weakness }`
- `challenge_submissions` has `UNIQUE(challenge_id, user_id)` — one submission per challenge
- `league_memberships` has `UNIQUE(league_id, user_id)`
- `user_stats` uses `user_id` as PK (one row per user)
- RLS: scenarios/challenges publicly readable, submissions/stats user-scoped, league_memberships publicly readable (leaderboard)
- All tables need `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

**Done when:** Migration applies cleanly with `supabase db push` or `supabase migration up`

---

#### Agent 1B: Arena Config
**File:** `config/arena.ts`

Export all arena constants. No imports from services — pure data.

```typescript
// XP values
export const XP_VALUES = {
  PITCH_ANALYSIS: 20,
  CHALLENGE_SUBMIT: 50,
  CHALLENGE_SCORE_BONUS_THRESHOLD: 70,  // +1 XP per point above this
  GAME_MODE_COMPLETE: 15,
  GAME_MODE_SCORE_70: 25,
  GAME_MODE_SCORE_85: 40,
  GAME_MODE_SCORE_95: 60,
  GAME_MODE_EXPERT_BONUS: 10,
  GAME_MODE_SESSION_3X_BONUS: 20,
  FIRST_PITCH_OF_DAY: 10,
  STREAK_3_DAY: 25,
  STREAK_7_DAY: 75,
  STREAK_30_DAY: 300,
  SCORE_IMPROVEMENT_10: 30,
  NEW_MODE_EXPLORATION: 20,
} as const;

// League tiers (ordered)
export const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'diamond', 'champion'] as const;
export type LeagueTier = typeof LEAGUE_TIERS[number];

// League config
export const LEAGUE_CONFIG = {
  USERS_PER_LEAGUE: 30,
  PROMOTION_COUNT: 5,
  DEMOTION_COUNT: 5,
} as const;

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
  starter: { readTimeSec: 90, pitchTimeSec: 120, label: 'Starter' },
  pro:     { readTimeSec: 60, pitchTimeSec: 120, label: 'Pro' },
  expert:  { readTimeSec: 30, pitchTimeSec: 90,  label: 'Expert' },
} as const;
export type Difficulty = keyof typeof DIFFICULTY_SETTINGS;

// Challenge types
export const CHALLENGE_TYPES = ['elevator', 'vc_pitch', 'speed_round', 'pivot', 'objection'] as const;
export type ChallengeType = typeof CHALLENGE_TYPES[number];

// Plan-gated limits
export const ARENA_PLAN_LIMITS = {
  free:     { challengeSubmissions: 0, gameModePerWeek: 2,  leagueAccess: false, streakFreezes: 0 },
  day_pass: { challengeSubmissions: 1, gameModePerDay: 5,   leagueAccess: false, streakFreezes: 0 },
  pro:      { challengeSubmissions: -1, gameModePerDay: 10, leagueAccess: true,  streakFreezes: 2 }, // -1 = unlimited
} as const;

// Badge definitions
export const BADGES = [ ... ]; // from planning doc §8
```

**Done when:** File exports all constants, compiles with `tsc --noEmit`, no runtime deps.

---

#### Agent 1C: Arena Types
**File:** `types/arena.ts`

Define all TypeScript types/interfaces for the arena feature. Import nothing from services.

```typescript
// Types to define:
export interface Scenario { id, title, oneLiner, industry, stage, difficulty, brief: ScenarioBrief, pitchType, timeLimitSec, readTimeSec, challengeEligible, source, status, createdAt, updatedAt }
export interface ScenarioBrief { companyName, oneLiner, industry, stage, team, metrics: ScenarioMetrics, market: ScenarioMarket, ask: ScenarioAsk, differentiator, weakness }
export interface ScenarioMetrics { revenue?, users?, growthRate?, other?: Record<string, string> }
export interface ScenarioMarket { tam, sam, som }
export interface ScenarioAsk { amount, useOfFunds: string[] }

export interface Challenge { id, scenarioId, weekNumber, year, title, description?, challengeType, bonusCriteria?, startsAt, endsAt, status, participantCount, createdAt }
export interface ChallengeSubmission { id, challengeId, userId, runId?, baseScore?, bonusScore, totalScore?, rank?, xpEarned, submittedAt }

export interface GameModeSession { id, userId, scenarioId, runId?, difficulty, score?, xpEarned, completedAt }

export interface League { id, tier, weekNumber, year, startsAt, endsAt, createdAt }
export interface LeagueMembership { id, leagueId, userId, weeklyXp, rank?, promoted, demoted, createdAt }

export interface UserStats { userId, totalXp, currentLeagueTier, currentStreak, longestStreak, lastActivityDate?, streakFreezesRemaining, streakFreezeLastReset?, challengesCompleted, challengeWins, gameModeCompleted, highestScore, badges: Badge[], createdAt, updatedAt }

export interface XpEvent { id, userId, eventType: XpEventType, xpAmount, sourceId?, metadata?, createdAt }
export type XpEventType = 'challenge_submit' | 'game_mode' | 'pitch_analysis' | 'streak_bonus' | 'score_bonus' | 'improvement_bonus' | 'exploration_bonus';

export interface Badge { id: string, name: string, description: string, earnedAt: string, rarity: 'common' | 'uncommon' | 'rare' | 'epic' }

// DB row type helpers (snake_case versions for Supabase queries)
export type ScenarioRow = { ... } // snake_case DB row
// Add mappers: mapScenarioRow(row: ScenarioRow): Scenario
```

Include camelCase ↔ snake_case mappers for each entity (Supabase returns snake_case).

**Done when:** All types compile, mappers are exported, no circular deps.

---

### Wave 1.2 — Services + Models (3 agents, parallel)
**Depends on:** Wave 1.1 (types, config)

#### Agent 2A: XP Service
**File:** `services/xpService.ts`

Core XP engine. All XP mutations go through this service.

```typescript
// Functions to implement:
export async function awardXp(userId: string, eventType: XpEventType, amount: number, sourceId?: string, metadata?: Record<string, unknown>): Promise<number>
  // 1. Insert xp_events row
  // 2. Update user_stats.total_xp (atomic increment)
  // 3. Update league_memberships.weekly_xp for current week (if in a league)
  // 4. Return new total XP

export async function calculateGameModeXp(score: number, difficulty: Difficulty): Promise<number>
  // Apply rules from config/arena.ts XP_VALUES

export async function calculateChallengeXp(baseScore: number, bonusScore: number): Promise<number>
  // CHALLENGE_SUBMIT + score bonus per point above threshold

export async function checkAndAwardStreakXp(userId: string): Promise<number>
  // Check current streak against milestones (3, 7, 30), award if newly reached

export async function getWeeklyXp(userId: string, weekNumber: number, year: number): Promise<number>
```

Uses: `@/config/arena`, `@/types/arena`, `@/lib/supabase` (admin client for server-side)

**Done when:** All functions implemented, handle edge cases (double-award prevention via idempotent source_id checks).

---

#### Agent 2B: Scenario Service
**File:** `services/scenarioService.ts`

CRUD + random selection for pitch scenarios.

```typescript
export async function getApprovedScenarios(filters?: { industry?: string, difficulty?: Difficulty, stage?: string }): Promise<Scenario[]>

export async function getRandomScenario(userId: string, difficulty: Difficulty): Promise<Scenario>
  // 1. Get IDs of scenarios user has already seen (from game_mode_sessions)
  // 2. Query approved scenarios excluding seen, matching difficulty
  // 3. If all seen, reset (allow repeats) but prefer least-recently-seen
  // 4. Return random pick

export async function getScenarioById(id: string): Promise<Scenario | null>

export async function createScenario(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario>
  // For admin/batch use

export async function approveScenario(id: string): Promise<void>

export async function generateScenarioBatch(count: number, options: { industry?: string, stage?: string }): Promise<Scenario[]>
  // Call Claude to generate synthetic scenarios
  // Use prompts based on planning doc §9
  // Insert as 'draft' status
  // Return generated scenarios for review
```

Uses: `@/types/arena`, `@/lib/supabase`, Claude SDK (for batch generation)

**Done when:** CRUD works, random selection avoids repeats, batch generation produces valid scenario JSON.

---

#### Agent 2C: User Stats Model
**File:** `models/userStats.ts`

Thin data-access layer for user_stats table.

```typescript
export async function getOrCreateUserStats(userId: string): Promise<UserStats>
  // Upsert pattern — create with defaults if not exists, return existing if exists

export async function updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats>

export async function updateStreak(userId: string): Promise<{ currentStreak: number, isNewMilestone: boolean, milestone?: number }>
  // 1. Get current stats
  // 2. If last_activity_date === today → no-op
  // 3. If last_activity_date === yesterday → increment streak
  // 4. If last_activity_date < yesterday → check streak_freezes, use one or reset
  // 5. Update last_activity_date to today
  // 6. Check if new milestone reached (3, 7, 30, 60, 100, 365)

export async function awardBadge(userId: string, badge: Badge): Promise<void>
  // Append to badges JSONB array (idempotent — check if already earned)

export async function getLeaderboard(sortBy: 'total_xp' | 'highest_score' | 'challenge_wins', limit?: number): Promise<UserStats[]>
```

Uses: `@/types/arena`, `@/lib/supabase`

**Done when:** Upsert works, streak logic handles all edge cases (freeze, reset, midnight boundary).

---

### Wave 1.3 — Game Mode API + Stats Hook (2 agents, parallel)
**Depends on:** Wave 1.2 (services, models)

#### Agent 3A: Game Mode API Routes
**Files:**
- `app/api/arena/game-mode/route.ts` — `GET` (random scenario) + `POST` (submit result)
- `app/api/arena/stats/route.ts` — `GET` (user stats + XP)

```
GET /api/arena/game-mode?difficulty=pro
  → Auth check
  → Check plan limits (ARENA_PLAN_LIMITS)
  → scenarioService.getRandomScenario(userId, difficulty)
  → Return scenario

POST /api/arena/game-mode
  Body: { scenarioId, runId, difficulty }
  → Auth check
  → Validate run belongs to user and is complete
  → Get run score from runs table
  → Calculate XP via xpService.calculateGameModeXp()
  → Create game_mode_sessions row
  → Award XP via xpService.awardXp()
  → Update streak via userStats.updateStreak()
  → Check/award streak XP via xpService.checkAndAwardStreakXp()
  → Return { score, xpEarned, newTotalXp, streak }

GET /api/arena/stats
  → Auth check
  → userStatsModel.getOrCreateUserStats(userId)
  → Return stats
```

**Done when:** Both routes work end-to-end with auth, plan limits enforced, proper error responses.

---

#### Agent 3B: Arena Hooks
**Files:**
- `hooks/useArenaStats.ts` — Fetches/caches user stats
- `hooks/useGameMode.ts` — Game mode flow state machine

```typescript
// useArenaStats.ts
export function useArenaStats() {
  // Fetch GET /api/arena/stats
  // Return { stats, isLoading, error, refresh }
}

// useGameMode.ts
type GameModeState = 'idle' | 'loading' | 'reading' | 'recording' | 'submitting' | 'results';

export function useGameMode() {
  // State machine for game mode flow:
  // idle → selectDifficulty() → loading → scenario loaded → reading (countdown)
  // → countdown done → recording (uses useRecorder internally)
  // → recording done → submitting → results
  // Return { state, scenario, difficulty, score, xpEarned, selectDifficulty, startRecording, submitPitch, newScenario }
}
```

Follow existing hook patterns (see `hooks/useSessionState.ts` for state machine example).

**Done when:** Hooks compile, state transitions are correct, integrates with existing `useRecorder`.

---

### Wave 1.4 — Game Mode UI (1 agent)
**Depends on:** Wave 1.3

#### Agent 4A: Game Mode Page + Components
**Files:**
- `app/(app)/arena/page.tsx` — Arena hub (placeholder, expanded in Phase 3)
- `app/(app)/arena/game-mode/page.tsx` — Game mode page
- `views/components/arena/GameModePanel.tsx` — Difficulty select + scenario display
- `views/components/arena/ScenarioCard.tsx` — Renders a scenario brief
- `views/components/arena/CountdownTimer.tsx` — Read time / pitch time countdown
- `views/components/arena/GameModeResults.tsx` — Score + XP earned display

Design notes:
- Follow existing design system: Tailwind + CSS variables (`--bg-primary`, `--bg-surface`, etc.)
- Accent colors: coral/orange (`#ff5941`, `#ffaa33`, `#e63b26`)
- `'use client'` on interactive components
- Named exports only, `@/*` imports

**Done when:** User can select difficulty, see scenario, record pitch (integrating existing recorder), and see results with XP.

---

## Phase 2: Challenges

### Wave 2.1 — Challenge Services (2 agents, parallel)
**Depends on:** Phase 1 complete

#### Agent 5A: Challenge Service
**File:** `services/challengeService.ts`

```typescript
export async function getActiveChallenge(): Promise<(Challenge & { scenario: Scenario }) | null>
  // Query challenges where status = 'active' and now() between starts_at and ends_at

export async function getChallengeById(id: string): Promise<(Challenge & { scenario: Scenario }) | null>

export async function submitChallenge(userId: string, challengeId: string, runId: string): Promise<ChallengeSubmission>
  // 1. Verify challenge is active
  // 2. Verify user hasn't already submitted (UNIQUE constraint)
  // 3. Get run score
  // 4. Calculate bonus score via calculateChallengeBonus()
  // 5. Create challenge_submission row
  // 6. Increment challenges.participant_count
  // 7. Award XP via xpService
  // 8. Update user_stats.challenges_completed
  // 9. Return submission with scores

export async function getChallengeLeaderboard(challengeId: string, limit?: number): Promise<ChallengeSubmission[]>
  // Order by total_score DESC

export async function getUserChallengeHistory(userId: string): Promise<ChallengeSubmission[]>

export async function activateNextChallenge(): Promise<Challenge | null>
  // Called by cron: set current to 'completed', next to 'active'

export async function createChallenge(data: { scenarioId, weekNumber, year, challengeType, bonusCriteria?, startsAt, endsAt }): Promise<Challenge>
```

---

#### Agent 5B: Challenge Bonus Scoring
**File:** `services/challengeBonusService.ts`

```typescript
export function calculateChallengeBonus(
  transcript: string,
  scenario: Scenario,
  pitchDurationSec: number,
  timeLimitSec: number
): { bonusScore: number, breakdown: BonusBreakdown }

interface BonusBreakdown {
  addressedMetrics: { score: number, max: 5, details: string[] };
  withinTimeLimit: { score: number, max: 5 };
  usedSpecificNumbers: { score: number, max: 5, details: string[] };
  clearAsk: { score: number, max: 5 };
}
```

Logic:
- **Addressed metrics (+5):** Check if transcript mentions key metrics from scenario.brief.metrics
- **Within time limit (+5):** pitchDurationSec <= timeLimitSec
- **Used specific numbers (+5):** Check for numbers from the brief appearing in transcript (not vague like "a lot")
- **Clear ask (+5):** Check for funding amount / call to action in transcript

This can use simple string matching + regex — no LLM needed for bonus scoring.

**Done when:** Scoring produces 0-20 bonus with detailed breakdown.

---

### Wave 2.2 — Challenge API + Cron (2 agents, parallel)
**Depends on:** Wave 2.1

#### Agent 6A: Challenge API Routes
**Files:**
- `app/api/arena/challenges/route.ts` — `GET` (list/active challenge)
- `app/api/arena/challenges/[id]/route.ts` — `GET` (challenge details + leaderboard)
- `app/api/arena/challenges/[id]/submit/route.ts` — `POST` (submit entry)

```
GET /api/arena/challenges
  → Return active challenge (with scenario) + user's submission if exists

GET /api/arena/challenges/[id]
  → Return challenge details + leaderboard (top N) + user's rank

POST /api/arena/challenges/[id]/submit
  Body: { runId }
  → Auth + plan limit check (ARENA_PLAN_LIMITS.challengeSubmissions)
  → challengeService.submitChallenge()
  → Return submission with scores + rank
```

---

#### Agent 6B: Weekly Cron Job
**File:** `app/api/arena/cron/weekly/route.ts`

Vercel Cron handler (or Supabase pg_cron). Runs every Monday 00:00 UTC.

```typescript
// POST /api/arena/cron/weekly (protected by CRON_SECRET)
// 1. challengeService.activateNextChallenge()
//    - Set current active challenge → 'completed'
//    - Calculate final ranks for all submissions
//    - Award winner badge to #1
//    - Set next upcoming challenge → 'active'
// 2. (Phase 3 will add: leagueService.processWeekEnd())
```

Add to `vercel.json`:
```json
{ "crons": [{ "path": "/api/arena/cron/weekly", "schedule": "0 0 * * 1" }] }
```

**Done when:** Cron transitions challenges correctly, ranks are calculated, idempotent (safe to re-run).

---

### Wave 2.3 — Challenge UI (2 agents, parallel)
**Depends on:** Wave 2.2

#### Agent 7A: Challenge Page
**Files:**
- `app/(app)/arena/challenge/[id]/page.tsx` — Challenge detail + submission flow
- `views/components/arena/ChallengeCard.tsx` — Challenge preview card (for arena hub)
- `views/components/arena/ChallengeHeader.tsx` — Challenge title, timer, status
- `views/components/arena/ChallengeSubmitFlow.tsx` — Read scenario → record → submit

Hook: `hooks/useChallenge.ts`
```typescript
export function useChallenge(challengeId?: string) {
  // Fetch active challenge or specific challenge
  // Track submission state
  // Return { challenge, scenario, submission, isSubmitted, submit, leaderboard }
}
```

---

#### Agent 7B: Challenge Leaderboard Component
**Files:**
- `views/components/arena/ChallengeLeaderboard.tsx` — Per-challenge rankings
- `views/components/arena/LeaderboardRow.tsx` — Single row with rank, user, score

Display:
- Top 3 highlighted with medal icons
- Current user's row always visible (scrolled to or pinned)
- Show total_score (base + bonus), rank, and rank change indicator

**Done when:** Leaderboard renders, handles empty state, highlights current user.

---

## Phase 3: Leagues & Leaderboards

### Wave 3.1 — League Services (2 agents, parallel)
**Depends on:** Phase 2 complete

#### Agent 8A: League Service
**File:** `services/leagueService.ts`

```typescript
export async function processWeekEnd(): Promise<void>
  // 1. Get all active leagues
  // 2. For each league: calculate final rankings from weekly_xp
  // 3. Mark top PROMOTION_COUNT as promoted, bottom DEMOTION_COUNT as demoted
  // 4. Update user_stats.current_league_tier based on promotion/demotion

export async function createNewWeekLeagues(weekNumber: number, year: number): Promise<void>
  // 1. Get all users with league access (Pro+ plans)
  // 2. Group by new tier (after promotions/demotions)
  // 3. Run matchmaking to create leagues of ~30 users
  // 4. Create league rows + league_membership rows

export async function getUserLeague(userId: string): Promise<(League & { memberships: LeagueMembership[] }) | null>
  // Get user's current week league with all members (for leaderboard)

export async function getLeagueMembershipForUser(userId: string, weekNumber: number, year: number): Promise<LeagueMembership | null>
```

---

#### Agent 8B: Matchmaking Service
**File:** `services/matchmakingService.ts`

```typescript
export function matchUsersIntoLeagues(
  users: Array<{ userId: string, tier: LeagueTier, previousWeekXp: number }>,
  leagueSize: number
): Array<{ tier: LeagueTier, userIds: string[] }>
  // 1. Group users by tier
  // 2. Within each tier, sort by previous week's XP
  // 3. Divide into groups of ~leagueSize (allow ±5 variance)
  // 4. Users with similar previous XP end up in the same league
  // 5. Handle remainder (small league or merge into adjacent)
```

Pure function — no DB access. Easy to unit test.

**Done when:** Matchmaking produces balanced leagues, handles edge cases (fewer than 30 users in a tier, new users with 0 XP).

---

### Wave 3.2 — League API + Cron Update (2 agents, parallel)
**Depends on:** Wave 3.1

#### Agent 9A: League API Routes
**Files:**
- `app/api/arena/leaderboard/route.ts` — `GET` (current league + all-time)

```
GET /api/arena/leaderboard?type=league
  → Auth check
  → leagueService.getUserLeague(userId)
  → Return league with ranked memberships

GET /api/arena/leaderboard?type=alltime&sort=total_xp&limit=50
  → userStatsModel.getLeaderboard(sort, limit)
  → Return ranked list
```

---

#### Agent 9B: Update Weekly Cron
**Update:** `app/api/arena/cron/weekly/route.ts` (from Agent 6B)

Add to existing cron handler:
```typescript
// After challenge transition:
// 3. leagueService.processWeekEnd()
// 4. leagueService.createNewWeekLeagues(newWeekNumber, newYear)
```

**Done when:** Cron handles both challenge and league transitions atomically.

---

### Wave 3.3 — League UI + Arena Hub (3 agents, parallel)
**Depends on:** Wave 3.2

#### Agent 10A: League Leaderboard UI
**Files:**
- `views/components/arena/LeagueLeaderboard.tsx` — Weekly league view
- `views/components/arena/PromotionZone.tsx` — Visual separator for promotion/demotion zones
- `hooks/useLeaderboard.ts`

Shows: tier badge, countdown to reset, ranked members with weekly XP, promotion/demotion zones highlighted, current user pinned.

---

#### Agent 10B: Arena Hub Page
**Update:** `app/(app)/arena/page.tsx` (from placeholder in Phase 1)

Full arena hub with:
- Active challenge card (or "coming soon" if between challenges)
- Game mode entry point
- Current league standings (compact view)
- User's XP bar + streak tracker
- Quick stats (challenges completed, game mode sessions, best score)

---

#### Agent 10C: Dashboard Arena Widget
**Files:**
- `views/components/arena/DashboardArenaWidget.tsx` — Compact arena status for main dashboard

Add to existing dashboard page — shows:
- Current streak (flame icon + count)
- League tier badge
- Active challenge teaser
- "Play Game Mode" quick action

**Done when:** Arena hub is the central navigation point, dashboard shows arena status.

---

## Phase 4: Polish & Engagement

### Wave 4.1 — Streak + Badge Systems (2 agents, parallel)
**Depends on:** Phase 3 complete

#### Agent 11A: Streak System
**Files:**
- `views/components/arena/StreakTracker.tsx` — Visual streak display (calendar grid + flame)
- `views/components/arena/StreakFreezeButton.tsx` — Use/purchase streak freeze

Integrate streak updates into existing pitch completion flow:
- **Update** `services/runService.ts` — After run completion, call `userStats.updateStreak()` + `xpService.checkAndAwardStreakXp()`
- This ensures streaks work for regular pitches too, not just arena

---

#### Agent 11B: Badge System
**Files:**
- `views/components/arena/BadgeDisplay.tsx` — Grid of earned badges
- `views/components/arena/BadgeUnlockToast.tsx` — Toast notification when badge earned
- `services/badgeService.ts` — Badge evaluation engine

```typescript
// badgeService.ts
export async function evaluateBadges(userId: string, context: BadgeContext): Promise<Badge[]>
  // Check all badge conditions against user stats + context
  // Award any newly earned badges
  // Return list of newly earned badges (for toast display)

interface BadgeContext {
  latestScore?: number;
  latestDifficulty?: Difficulty;
  eventType: 'pitch_complete' | 'challenge_submit' | 'game_mode' | 'streak_milestone';
}
```

**Done when:** Badges are evaluated on every relevant action, toast shows on new badge unlock.

---

### Wave 4.2 — Billing + Notifications (2 agents, parallel)
**Depends on:** Wave 4.1

#### Agent 12A: Arena Billing Integration
**Files:**
- **Update** `config/billing.ts` — Add arena limits to `PlanLimits`
- **Update** `types/billing.ts` — Add arena fields to `PlanLimits` interface
- `views/components/arena/UpgradePrompt.tsx` — "Upgrade to compete" modal

Add to `PlanLimits`:
```typescript
  // Arena limits
  challengeSubmissions: number;    // 0 / 1 / unlimited
  gameModePerPeriod: number;       // 2 per week / 5 per day / 10 per day
  leagueAccess: boolean;
  streakFreezes: number;           // 0 / 0 / 2
```

Enforcement: API routes check limits before allowing actions. Return 403 with `{ upgrade: true, plan: 'pro' }` for gated features.

---

#### Agent 12B: Notifications
**File:** `services/arenaNotificationService.ts`

```typescript
export async function sendChallengeDropNotification(challenge: Challenge): Promise<void>
  // Email to all Pro users: "New challenge dropped: {title}"

export async function sendLeagueResultsNotification(userId: string, result: 'promoted' | 'demoted' | 'stayed', newTier: LeagueTier): Promise<void>
  // Email: "You've been promoted to Gold League!" or "You stayed in Silver"

export async function sendStreakRiskNotification(userId: string, currentStreak: number): Promise<void>
  // Email at 8pm user-local-ish time if no activity today and streak > 3
```

Uses existing `services/emailService.ts` patterns.

**Done when:** Emails send on challenge drops and league transitions.

---

### Wave 4.3 — E2E Tests (1 agent)
**Depends on:** Wave 4.2

#### Agent 13A: Integration Tests
**File:** `services/__tests__/arena.test.ts` (or split into multiple files)

Test cases:
1. **XP Service:** Award XP, prevent double-award, calculate game mode XP, calculate challenge XP
2. **Scenario Service:** Random selection avoids repeats, filters by difficulty
3. **Challenge Service:** Submit challenge, enforce one-per-user, calculate bonus, generate leaderboard
4. **League Service:** Process week end, promotion/demotion logic, matchmaking produces valid groups
5. **Streak System:** Increment, freeze, reset, milestone detection
6. **Badge System:** Evaluate conditions, idempotent award
7. **Plan Limits:** Free user blocked from challenges, Pro user allowed

Use Vitest. Mock Supabase client. Focus on business logic, not HTTP layer.

**Done when:** All tests pass, coverage on critical paths (XP calculation, streak logic, matchmaking, bonus scoring).

---

## File Manifest

| File | Phase | Agent | Action |
|------|-------|-------|--------|
| `supabase/migrations/20260304000001_pitch_arena.sql` | 1.1 | 1A | Create |
| `config/arena.ts` | 1.1 | 1B | Create |
| `types/arena.ts` | 1.1 | 1C | Create |
| `services/xpService.ts` | 1.2 | 2A | Create |
| `services/scenarioService.ts` | 1.2 | 2B | Create |
| `models/userStats.ts` | 1.2 | 2C | Create |
| `app/api/arena/game-mode/route.ts` | 1.3 | 3A | Create |
| `app/api/arena/stats/route.ts` | 1.3 | 3A | Create |
| `hooks/useArenaStats.ts` | 1.3 | 3B | Create |
| `hooks/useGameMode.ts` | 1.3 | 3B | Create |
| `app/(app)/arena/page.tsx` | 1.4 | 4A | Create |
| `app/(app)/arena/game-mode/page.tsx` | 1.4 | 4A | Create |
| `views/components/arena/GameModePanel.tsx` | 1.4 | 4A | Create |
| `views/components/arena/ScenarioCard.tsx` | 1.4 | 4A | Create |
| `views/components/arena/CountdownTimer.tsx` | 1.4 | 4A | Create |
| `views/components/arena/GameModeResults.tsx` | 1.4 | 4A | Create |
| `services/challengeService.ts` | 2.1 | 5A | Create |
| `services/challengeBonusService.ts` | 2.1 | 5B | Create |
| `app/api/arena/challenges/route.ts` | 2.2 | 6A | Create |
| `app/api/arena/challenges/[id]/route.ts` | 2.2 | 6A | Create |
| `app/api/arena/challenges/[id]/submit/route.ts` | 2.2 | 6A | Create |
| `app/api/arena/cron/weekly/route.ts` | 2.2 | 6B | Create |
| `app/(app)/arena/challenge/[id]/page.tsx` | 2.3 | 7A | Create |
| `views/components/arena/ChallengeCard.tsx` | 2.3 | 7A | Create |
| `views/components/arena/ChallengeHeader.tsx` | 2.3 | 7A | Create |
| `views/components/arena/ChallengeSubmitFlow.tsx` | 2.3 | 7A | Create |
| `hooks/useChallenge.ts` | 2.3 | 7A | Create |
| `views/components/arena/ChallengeLeaderboard.tsx` | 2.3 | 7B | Create |
| `views/components/arena/LeaderboardRow.tsx` | 2.3 | 7B | Create |
| `services/leagueService.ts` | 3.1 | 8A | Create |
| `services/matchmakingService.ts` | 3.1 | 8B | Create |
| `app/api/arena/leaderboard/route.ts` | 3.2 | 9A | Create |
| `app/api/arena/cron/weekly/route.ts` | 3.2 | 9B | Update |
| `views/components/arena/LeagueLeaderboard.tsx` | 3.3 | 10A | Create |
| `views/components/arena/PromotionZone.tsx` | 3.3 | 10A | Create |
| `hooks/useLeaderboard.ts` | 3.3 | 10A | Create |
| `app/(app)/arena/page.tsx` | 3.3 | 10B | Update |
| `views/components/arena/DashboardArenaWidget.tsx` | 3.3 | 10C | Create |
| `views/components/arena/StreakTracker.tsx` | 4.1 | 11A | Create |
| `views/components/arena/StreakFreezeButton.tsx` | 4.1 | 11A | Create |
| `services/runService.ts` | 4.1 | 11A | Update |
| `views/components/arena/BadgeDisplay.tsx` | 4.1 | 11B | Create |
| `views/components/arena/BadgeUnlockToast.tsx` | 4.1 | 11B | Create |
| `services/badgeService.ts` | 4.1 | 11B | Create |
| `config/billing.ts` | 4.2 | 12A | Update |
| `types/billing.ts` | 4.2 | 12A | Update |
| `views/components/arena/UpgradePrompt.tsx` | 4.2 | 12A | Create |
| `services/arenaNotificationService.ts` | 4.2 | 12B | Create |
| `services/__tests__/arena.test.ts` | 4.3 | 13A | Create |

---

## Orchestrator Execution Script

```
# Phase 1
spawn_parallel(Agent_1A, Agent_1B, Agent_1C)  # Wave 1.1
await_all()
spawn_parallel(Agent_2A, Agent_2B, Agent_2C)  # Wave 1.2
await_all()
spawn_parallel(Agent_3A, Agent_3B)            # Wave 1.3
await_all()
spawn(Agent_4A)                               # Wave 1.4
await_all()
verify_phase_1()  # yarn build, manual smoke test game mode

# Phase 2
spawn_parallel(Agent_5A, Agent_5B)            # Wave 2.1
await_all()
spawn_parallel(Agent_6A, Agent_6B)            # Wave 2.2
await_all()
spawn_parallel(Agent_7A, Agent_7B)            # Wave 2.3
await_all()
verify_phase_2()  # yarn build, test challenge submit + leaderboard

# Phase 3
spawn_parallel(Agent_8A, Agent_8B)            # Wave 3.1
await_all()
spawn_parallel(Agent_9A, Agent_9B)            # Wave 3.2
await_all()
spawn_parallel(Agent_10A, Agent_10B, Agent_10C)  # Wave 3.3
await_all()
verify_phase_3()  # yarn build, test league view + arena hub

# Phase 4
spawn_parallel(Agent_11A, Agent_11B)          # Wave 4.1
await_all()
spawn_parallel(Agent_12A, Agent_12B)          # Wave 4.2
await_all()
spawn(Agent_13A)                              # Wave 4.3
await_all()
verify_final()    # yarn build && yarn test
```

**Total agents across all waves:** 25 agent tasks
**Max parallel at any point:** 3 agents
**Total waves:** 13
