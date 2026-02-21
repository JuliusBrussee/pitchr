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
