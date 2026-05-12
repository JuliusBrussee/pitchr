import {
  Target,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

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
      .filter((r) => r.analysis.rubric_breakdown)
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

/* ——— Coach Summary ——— */

export interface CoachSummary {
  headline: string;
  detail: string;
  recommendation: string;
  estimatedMinutes: number;
}

export function computeCoachSummary(rubric: RubricCategory[], averageScore: number, totalRuns: number): CoachSummary {
  const sorted = [...rubric].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  if (totalRuns === 0) {
    return {
      headline: 'Ready to start your pitch journey?',
      detail: 'Run your first session to get personalized coaching insights.',
      recommendation: 'Record or paste your pitch to begin.',
      estimatedMinutes: 5,
    };
  }

  const weakPct = Math.round((weakest.score / weakest.maxScore) * 100);
  const strongPct = Math.round((strongest.score / strongest.maxScore) * 100);
  const potentialGain = Math.round((1 - weakest.score / weakest.maxScore) * 20);

  let headline: string;
  if (averageScore >= 80) {
    headline = `You're in investor-ready territory. Fine-tune ${weakest.label.toLowerCase()} to perfect your pitch.`;
  } else if (averageScore >= 60) {
    headline = `${weakest.label} is your bottleneck. Fixing this could raise your score by ${potentialGain}+ points.`;
  } else if (averageScore >= 40) {
    headline = `Focus on ${weakest.label.toLowerCase()} — it's holding back an otherwise ${strongPct >= 70 ? 'strong' : 'improving'} pitch.`;
  } else {
    headline = `Your ${strongest.label.toLowerCase()} shows promise. Build on that foundation.`;
  }

  const detail = strongPct > weakPct * 1.5
    ? `Your ${strongest.label.toLowerCase()} is ${Math.round(strongPct / Math.max(weakPct, 1))}x stronger than ${weakest.label.toLowerCase()}.`
    : `Balanced profile — small improvements across categories will compound fast.`;

  return {
    headline,
    detail,
    recommendation: `${Math.max(5, Math.round(potentialGain / 3))}-minute focused ${weakest.id} drill recommended.`,
    estimatedMinutes: Math.max(5, Math.round(potentialGain / 3)),
  };
}

/* ——— Trend Data ——— */

export interface TrendPoint {
  score: number;
  date: string;
  runId: string;
}

export interface ScoreTrend {
  points: TrendPoint[];
  delta: number;
  isImproving: boolean;
  bestImprovement: { from: number; to: number; label: string } | null;
}

export function computeScoreTrend(runs: { id: string; overallScore: number; createdAt: string }[]): ScoreTrend {
  const sorted = [...runs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const points: TrendPoint[] = sorted.slice(-10).map((r) => ({
    score: r.overallScore,
    date: r.createdAt,
    runId: r.id,
  }));

  const delta = points.length >= 2
    ? points[points.length - 1].score - points[points.length - 2].score
    : 0;

  let bestImprovement: ScoreTrend['bestImprovement'] = null;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].score - points[i - 1].score;
    if (diff > 0 && (!bestImprovement || diff > (bestImprovement.to - bestImprovement.from))) {
      bestImprovement = {
        from: points[i - 1].score,
        to: points[i].score,
        label: `+${diff} points`,
      };
    }
  }

  return {
    points,
    delta,
    isImproving: delta > 0,
    bestImprovement,
  };
}

/* ——— Streak ——— */

export function computeStreak(runs: { createdAt: string }[]): number {
  if (runs.length === 0) return 0;
  const sorted = [...runs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (let dayBack = 0; dayBack < 365; dayBack++) {
    const dayStart = new Date(checkDate);
    dayStart.setDate(dayStart.getDate() - dayBack);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const hasRun = sorted.some((r) => {
      const d = new Date(r.createdAt);
      return d >= dayStart && d < dayEnd;
    });

    if (hasRun) {
      streak++;
    } else if (dayBack === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}
