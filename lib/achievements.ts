import type { ProgressRunRecord } from '@/lib/progress';

/* ——— Types ——— */

export type AchievementCategory =
  | 'sessions'
  | 'scores'
  | 'streaks'
  | 'mastery'
  | 'improvement'
  | 'special';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isHidden: boolean;
}

export interface AchievementState {
  [achievementId: string]: {
    unlockedAt: string;
  };
}

/* ——— Achievement Definitions (~25) ——— */

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Session Milestones (5)
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first pitch session', icon: 'Footprints', category: 'sessions', isHidden: false },
  { id: 'warming-up', name: 'Warming Up', description: 'Complete 5 pitch sessions', icon: 'Flame', category: 'sessions', isHidden: false },
  { id: 'dedicated-pitcher', name: 'Dedicated Pitcher', description: 'Complete 10 pitch sessions', icon: 'Target', category: 'sessions', isHidden: false },
  { id: 'pitch-veteran', name: 'Pitch Veteran', description: 'Complete 25 pitch sessions', icon: 'Medal', category: 'sessions', isHidden: false },
  { id: 'pitch-master', name: 'Pitch Master', description: 'Complete 50 pitch sessions', icon: 'Crown', category: 'sessions', isHidden: false },

  // Score Milestones (4)
  { id: 'breaking-through', name: 'Breaking Through', description: 'Score 40+ on a pitch', icon: 'TrendingUp', category: 'scores', isHidden: false },
  { id: 'solid-ground', name: 'Solid Ground', description: 'Score 60+ on a pitch', icon: 'Mountain', category: 'scores', isHidden: false },
  { id: 'investor-ready', name: 'Investor-Ready', description: 'Score 80+ on a pitch', icon: 'Rocket', category: 'scores', isHidden: false },
  { id: 'perfect-pitch', name: 'Perfect Pitch', description: 'Score 95+ on a pitch', icon: 'Gem', category: 'scores', isHidden: false },

  // Streak Achievements (4)
  { id: 'on-a-roll', name: 'On a Roll', description: '3 consecutive improving scores', icon: 'Zap', category: 'streaks', isHidden: false },
  { id: 'hot-streak', name: 'Hot Streak', description: '5 consecutive improving scores', icon: 'Flame', category: 'streaks', isHidden: false },
  { id: 'unstoppable', name: 'Unstoppable', description: '10 consecutive improving scores', icon: 'Trophy', category: 'streaks', isHidden: false },
  { id: 'comeback-kid', name: 'Comeback Kid', description: 'Improve 20+ points from your lowest score', icon: 'ArrowBigUp', category: 'streaks', isHidden: false },

  // Category Mastery (5)
  { id: 'story-architect', name: 'Story Architect', description: 'Score 18+ in Structure', icon: 'BookOpen', category: 'mastery', isHidden: false },
  { id: 'crystal-clear', name: 'Crystal Clear', description: 'Score 18+ in Clarity', icon: 'Sparkles', category: 'mastery', isHidden: false },
  { id: 'data-driven', name: 'Data Driven', description: 'Score 18+ in Evidence', icon: 'BarChart3', category: 'mastery', isHidden: false },
  { id: 'market-maven', name: 'Market Maven', description: 'Score 18+ in Market', icon: 'Globe', category: 'mastery', isHidden: false },
  { id: 'stage-presence', name: 'Stage Presence', description: 'Score 18+ in Delivery', icon: 'Mic', category: 'mastery', isHidden: false },

  // Improvement (4)
  { id: 'quick-learner', name: 'Quick Learner', description: 'Improve 10+ points in your first 3 sessions', icon: 'Brain', category: 'improvement', isHidden: false },
  { id: 'big-leap', name: 'Big Leap', description: 'Improve 15+ points in a single session', icon: 'ChevronsUp', category: 'improvement', isHidden: false },
  { id: 'well-rounded', name: 'Well-Rounded', description: 'Score 12+ in all rubric categories', icon: 'CircleDot', category: 'improvement', isHidden: false },
  { id: 'fix-machine', name: 'Fix Machine', description: 'Resolve 10 identified fixes', icon: 'Wrench', category: 'improvement', isHidden: false },

  // Hidden/Special (3)
  { id: 'night-owl', name: 'Night Owl', description: 'Practice after midnight', icon: 'Moon', category: 'special', isHidden: true },
  { id: 'early-bird', name: 'Early Bird', description: 'Practice before 6 AM', icon: 'Sunrise', category: 'special', isHidden: true },
  { id: 'marathon', name: 'Marathon', description: 'Complete 3 sessions in one day', icon: 'Timer', category: 'special', isHidden: true },
];

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  sessions: 'Session Milestones',
  scores: 'Score Milestones',
  streaks: 'Streaks',
  mastery: 'Category Mastery',
  improvement: 'Improvement',
  special: 'Special',
};

/* ——— localStorage Key ——— */

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

/* ——— Computation Helpers ——— */

function getLongestImprovingStreak(runs: ProgressRunRecord[]): number {
  if (runs.length < 2) return 0;
  let longest = 0;
  let current = 0;
  for (let i = 1; i < runs.length; i++) {
    if (runs[i].overallScore > runs[i - 1].overallScore) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function getResolvedFixCount(runs: ProgressRunRecord[]): number {
  if (runs.length < 3) return 0;

  const fixMap = new Map<string, string[]>();
  for (const run of runs) {
    for (const fix of run.analysis.top_fixes ?? []) {
      const key = fix.issue.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
      const ids = fixMap.get(key) ?? [];
      ids.push(run.id);
      fixMap.set(key, ids);
    }
  }

  const lastTwoIds = new Set(runs.slice(-2).map((r) => r.id));
  let resolved = 0;
  for (const runIds of fixMap.values()) {
    const inRecent = runIds.some((id) => lastTwoIds.has(id));
    if (!inRecent && runIds.length > 0) resolved += 1;
  }
  return resolved;
}

/* ——— Main: Check which achievements are earned ——— */

export function checkAchievements(runs: ProgressRunRecord[]): Set<string> {
  const earned = new Set<string>();
  if (runs.length === 0) return earned;

  const sorted = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const scores = sorted.map((r) => r.overallScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Session Milestones
  if (sorted.length >= 1) earned.add('first-steps');
  if (sorted.length >= 5) earned.add('warming-up');
  if (sorted.length >= 10) earned.add('dedicated-pitcher');
  if (sorted.length >= 25) earned.add('pitch-veteran');
  if (sorted.length >= 50) earned.add('pitch-master');

  // Score Milestones
  if (maxScore >= 40) earned.add('breaking-through');
  if (maxScore >= 60) earned.add('solid-ground');
  if (maxScore >= 80) earned.add('investor-ready');
  if (maxScore >= 95) earned.add('perfect-pitch');

  // Streaks
  const longestStreak = getLongestImprovingStreak(sorted);
  if (longestStreak >= 3) earned.add('on-a-roll');
  if (longestStreak >= 5) earned.add('hot-streak');
  if (longestStreak >= 10) earned.add('unstoppable');

  // Comeback Kid: latest score is 20+ above lowest
  const latestScore = scores[scores.length - 1];
  if (latestScore - minScore >= 20) earned.add('comeback-kid');

  // Category Mastery — check best score per category across all runs
  const categoryBest: Record<string, number> = {};
  for (const run of sorted) {
    for (const rb of run.analysis.rubric_breakdown) {
      const prev = categoryBest[rb.category] ?? 0;
      categoryBest[rb.category] = Math.max(prev, rb.score);
    }
  }
  if ((categoryBest['structure'] ?? 0) >= 18) earned.add('story-architect');
  if ((categoryBest['clarity'] ?? 0) >= 18) earned.add('crystal-clear');
  if ((categoryBest['evidence'] ?? 0) >= 18) earned.add('data-driven');
  if ((categoryBest['market'] ?? 0) >= 18) earned.add('market-maven');
  if ((categoryBest['delivery'] ?? 0) >= 18) earned.add('stage-presence');

  // Quick Learner: +10 in first 3 sessions
  if (sorted.length >= 2) {
    const first3 = sorted.slice(0, 3);
    const improvement = first3[first3.length - 1].overallScore - first3[0].overallScore;
    if (improvement >= 10) earned.add('quick-learner');
  }

  // Big Leap: +15 in a single session
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].overallScore - sorted[i - 1].overallScore >= 15) {
      earned.add('big-leap');
      break;
    }
  }

  // Well-Rounded: all categories 12+ in a single run
  for (const run of sorted) {
    const cats = run.analysis.rubric_breakdown;
    if (cats.length >= 5 && cats.every((c) => c.score >= 12)) {
      earned.add('well-rounded');
      break;
    }
  }

  // Fix Machine: 10 resolved fixes
  if (getResolvedFixCount(sorted) >= 10) earned.add('fix-machine');

  // Hidden/Special
  for (const run of sorted) {
    const d = new Date(run.createdAt);
    const hour = d.getHours();
    if (hour >= 0 && hour < 6) {
      earned.add('night-owl');
      if (hour < 6) earned.add('early-bird');
    }
  }

  // Marathon: 3 sessions in one day
  const dayMap = new Map<string, number>();
  for (const run of sorted) {
    const d = new Date(run.createdAt);
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dayMap.set(dayStr, (dayMap.get(dayStr) ?? 0) + 1);
  }
  for (const count of dayMap.values()) {
    if (count >= 3) {
      earned.add('marathon');
      break;
    }
  }

  return earned;
}

/* ——— Progress toward next achievements ——— */

export interface AchievementProgress {
  def: AchievementDef;
  current: number;
  target: number;
  percent: number;
}

export function getAchievementProgress(
  runs: ProgressRunRecord[],
  earnedIds: Set<string>,
): AchievementProgress[] {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const progress: AchievementProgress[] = [];

  const sessionTargets: Record<string, number> = {
    'first-steps': 1, 'warming-up': 5, 'dedicated-pitcher': 10,
    'pitch-veteran': 25, 'pitch-master': 50,
  };

  for (const [id, target] of Object.entries(sessionTargets)) {
    if (!earnedIds.has(id)) {
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === id)!;
      progress.push({ def, current: sorted.length, target, percent: Math.min(100, (sorted.length / target) * 100) });
    }
  }

  const scores = sorted.map((r) => r.overallScore);
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const scoreTargets: Record<string, number> = {
    'breaking-through': 40, 'solid-ground': 60, 'investor-ready': 80, 'perfect-pitch': 95,
  };
  for (const [id, target] of Object.entries(scoreTargets)) {
    if (!earnedIds.has(id)) {
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === id)!;
      progress.push({ def, current: maxScore, target, percent: Math.min(100, (maxScore / target) * 100) });
    }
  }

  const longestStreak = getLongestImprovingStreak(sorted);
  const streakTargets: Record<string, number> = {
    'on-a-roll': 3, 'hot-streak': 5, 'unstoppable': 10,
  };
  for (const [id, target] of Object.entries(streakTargets)) {
    if (!earnedIds.has(id)) {
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === id)!;
      progress.push({ def, current: longestStreak, target, percent: Math.min(100, (longestStreak / target) * 100) });
    }
  }

  // Sort by closest to completion (highest percent first)
  return progress.sort((a, b) => b.percent - a.percent);
}
