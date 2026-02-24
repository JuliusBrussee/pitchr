import type { ScoreBand } from '@/views/components/ui/colors';

/* ——— Types ——— */

export interface ProgressRunRecord {
  id: string;
  createdAt: string;
  overallScore: number;
  mode: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { duration_seconds: number; wpm: number; filler_rate: number };
    top_fixes?: { rank: number; category: string; issue: string; fix: string; impact: string }[];
  };
}

export type SkillStatus = 'improving' | 'stagnant' | 'regressing';

export interface CategoryProgress {
  id: string;
  label: string;
  currentAvg: number;
  maxScore: number;
  band: ScoreBand;
  status: SkillStatus;
  delta: number;
  history: { date: string; score: number }[];
  recentFixes: TrackedFix[];
  sessionCount: number;
  bestScore: number;
  worstScore: number;
  firstScore: number;
  latestScore: number;
}

export interface TrackedFix {
  id: string;
  category: string;
  issue: string;
  fix: string;
  impact: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  resolved: boolean;
  runIds: string[];
}

export interface Milestone {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
  icon: 'trophy' | 'trending-up' | 'target' | 'zap' | 'star' | 'flame';
}

export interface ProgressSummary {
  categories: CategoryProgress[];
  fixes: TrackedFix[];
  milestones: Milestone[];
  overallTrend: { date: string; score: number }[];
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  overallDelta: number;
}

/* ——— Constants ——— */

export const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity & Concision',
  evidence: 'Evidence & Traction',
  market: 'Market & Differentiation',
  delivery: 'Delivery',
};

const CATEGORIES = ['structure', 'clarity', 'evidence', 'market', 'delivery'];

/* ——— Band helpers ——— */

function getBand(score: number, maxScore: number): ScoreBand {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return 'investor-ready';
  if (pct >= 60) return 'solid';
  if (pct >= 40) return 'getting-there';
  return 'needs-work';
}

/* ——— Compute status from recent scores ——— */

function computeStatus(history: { score: number }[]): SkillStatus {
  if (history.length < 2) return 'stagnant';
  const recent = history.slice(-3);
  const deltas: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    deltas.push(recent[i].score - recent[i - 1].score);
  }
  const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  if (avgDelta >= 0.5) return 'improving';
  if (avgDelta <= -0.5) return 'regressing';
  return 'stagnant';
}

/* ——— Fix deduplication ——— */

function normalizeFixKey(issue: string): string {
  return issue.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
}

function deduplicateFixes(runs: ProgressRunRecord[]): TrackedFix[] {
  const fixMap = new Map<string, TrackedFix>();
  const chronological = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const run of chronological) {
    for (const fix of run.analysis.top_fixes ?? []) {
      const key = normalizeFixKey(fix.issue);
      const existing = fixMap.get(key);
      if (existing) {
        existing.occurrences += 1;
        existing.lastSeen = run.createdAt;
        existing.runIds.push(run.id);
      } else {
        fixMap.set(key, {
          id: key,
          category: fix.category,
          issue: fix.issue,
          fix: fix.fix,
          impact: fix.impact,
          firstSeen: run.createdAt,
          lastSeen: run.createdAt,
          occurrences: 1,
          resolved: false,
          runIds: [run.id],
        });
      }
    }
  }

  // Mark fixes as resolved if they haven't appeared in the last 2 runs
  const lastTwoRunIds = new Set(
    chronological.slice(-2).map((r) => r.id),
  );

  for (const fix of fixMap.values()) {
    const appearsInRecent = fix.runIds.some((id) => lastTwoRunIds.has(id));
    fix.resolved = !appearsInRecent && fix.occurrences > 0 && chronological.length >= 3;
  }

  return Array.from(fixMap.values()).sort((a, b) => {
    // Unresolved first, then by occurrences
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return b.occurrences - a.occurrences;
  });
}

/* ——— Streak computation ——— */

function computeStreaks(runs: ProgressRunRecord[]): { current: number; longest: number } {
  if (runs.length < 2) return { current: 0, longest: 0 };

  const sorted = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let current = 0;
  let longest = 0;
  let streak = 0;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].overallScore > sorted[i - 1].overallScore) {
      streak += 1;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
  }

  // Check if current streak is ongoing (ends at most recent run)
  current = 0;
  for (let i = sorted.length - 1; i >= 1; i--) {
    if (sorted[i].overallScore > sorted[i - 1].overallScore) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

/* ——— Milestones ——— */

function computeMilestones(
  runs: ProgressRunRecord[],
  categories: CategoryProgress[],
  streaks: { current: number; longest: number },
): Milestone[] {
  const sorted = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const milestones: Milestone[] = [];

  // First Pitch
  milestones.push({
    id: 'first-pitch',
    label: 'First Pitch',
    description: 'Completed your first pitch analysis',
    achieved: runs.length >= 1,
    achievedAt: sorted[0]?.createdAt,
    icon: 'star',
  });

  // Five Sessions
  milestones.push({
    id: 'five-sessions',
    label: 'Dedicated Pitcher',
    description: 'Completed 5 pitch sessions',
    achieved: runs.length >= 5,
    achievedAt: sorted[4]?.createdAt,
    icon: 'flame',
  });

  // Ten Sessions
  milestones.push({
    id: 'ten-sessions',
    label: 'Pitch Pro',
    description: 'Completed 10 pitch sessions',
    achieved: runs.length >= 10,
    achievedAt: sorted[9]?.createdAt,
    icon: 'trophy',
  });

  // Hit 60+ overall
  const first60 = sorted.find((r) => r.overallScore >= 60);
  milestones.push({
    id: 'score-60',
    label: 'Solid Ground',
    description: 'Achieved a score of 60 or higher',
    achieved: !!first60,
    achievedAt: first60?.createdAt,
    icon: 'target',
  });

  // Hit 80+ overall
  const first80 = sorted.find((r) => r.overallScore >= 80);
  milestones.push({
    id: 'score-80',
    label: 'Investor-Ready',
    description: 'Achieved a score of 80 or higher',
    achieved: !!first80,
    achievedAt: first80?.createdAt,
    icon: 'trophy',
  });

  // 3-session improvement streak
  milestones.push({
    id: 'streak-3',
    label: 'On a Roll',
    description: '3 sessions of consecutive improvement',
    achieved: streaks.longest >= 3,
    icon: 'trending-up',
  });

  // Any category reaches max band
  const anyInvestorReady = categories.some((c) => c.band === 'investor-ready');
  milestones.push({
    id: 'category-mastery',
    label: 'Category Mastery',
    description: 'Reached Investor-Ready in any rubric category',
    achieved: anyInvestorReady,
    icon: 'zap',
  });

  // All categories solid or better
  const allSolid = categories.every(
    (c) => c.band === 'solid' || c.band === 'investor-ready',
  );
  milestones.push({
    id: 'well-rounded',
    label: 'Well-Rounded',
    description: 'All categories at Solid or better',
    achieved: allSolid && runs.length > 0,
    icon: 'star',
  });

  return milestones;
}

/* ——— Main computation ——— */

export function computeProgress(runs: ProgressRunRecord[]): ProgressSummary {
  const chronological = [...runs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Per-category progress
  const categories: CategoryProgress[] = CATEGORIES.map((catId) => {
    const history: { date: string; score: number }[] = [];

    for (const run of chronological) {
      const rubric = run.analysis.rubric_breakdown.find(
        (rb) => rb.category === catId,
      );
      if (rubric) {
        history.push({ date: run.createdAt, score: rubric.score });
      }
    }

    const scores = history.map((h) => h.score);
    const currentAvg =
      scores.length > 0
        ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
        : 0;
    const recentAvg =
      scores.length >= 3
        ? Math.round(
            (scores.slice(-3).reduce((s, v) => s + v, 0) / Math.min(scores.length, 3)) * 10,
          ) / 10
        : currentAvg;

    const firstScore = scores[0] ?? 0;
    const latestScore = scores[scores.length - 1] ?? 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Collect fixes for this category
    const catFixes: TrackedFix[] = [];
    for (const run of chronological) {
      for (const fix of run.analysis.top_fixes ?? []) {
        if (fix.category === catId) {
          catFixes.push({
            id: normalizeFixKey(fix.issue),
            category: fix.category,
            issue: fix.issue,
            fix: fix.fix,
            impact: fix.impact,
            firstSeen: run.createdAt,
            lastSeen: run.createdAt,
            occurrences: 1,
            resolved: false,
            runIds: [run.id],
          });
        }
      }
    }

    return {
      id: catId,
      label: CATEGORY_LABELS[catId] ?? catId,
      currentAvg: recentAvg,
      maxScore: 20,
      band: getBand(recentAvg, 20),
      status: computeStatus(history),
      delta: scores.length >= 2 ? latestScore - firstScore : 0,
      history,
      recentFixes: catFixes.slice(-5),
      sessionCount: history.length,
      bestScore,
      worstScore,
      firstScore,
      latestScore,
    };
  });

  // All fixes deduplicated
  const fixes = deduplicateFixes(chronological);

  // Streaks
  const streaks = computeStreaks(chronological);

  // Milestones
  const milestones = computeMilestones(chronological, categories, streaks);

  // Overall trend
  const overallTrend = chronological.map((r) => ({
    date: r.createdAt,
    score: r.overallScore,
  }));

  // Overall delta (latest vs first)
  const overallDelta =
    chronological.length >= 2
      ? chronological[chronological.length - 1].overallScore - chronological[0].overallScore
      : 0;

  return {
    categories,
    fixes,
    milestones,
    overallTrend,
    totalSessions: runs.length,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    overallDelta,
  };
}
