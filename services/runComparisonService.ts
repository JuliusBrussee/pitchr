import { listRuns } from '@/services/runService';
import type { FeedbackOutput, HistoricalLink, HistoricalScoreDelta } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

function summarizeDelta(delta: number): string {
  if (delta >= 8) return `Strong improvement (+${delta}).`;
  if (delta >= 1) return `Improved (+${delta}).`;
  if (delta <= -8) return `Significant regression (${delta}).`;
  if (delta <= -1) return `Slight regression (${delta}).`;
  return 'Flat vs prior run.';
}

export async function buildHistoricalLinks(input: {
  mode: PitchMode;
  currentFeedback: FeedbackOutput;
  currentRunId?: string;
}): Promise<HistoricalLink[]> {
  const runs = await listRuns({ mode: input.mode, limit: 12 });
  const candidates = runs
    .filter((run) => run.status === 'complete')
    .filter((run) => run.id !== input.currentRunId)
    .slice(0, 3);

  return candidates.map((run) => {
    const previousFeedback = run.analysis.outputs.feedback;
    const overallDelta = input.currentFeedback.overall_score - previousFeedback.overall_score;

    const categoryDeltas: HistoricalScoreDelta[] = [
      {
        category: 'overall',
        previous: previousFeedback.overall_score,
        current: input.currentFeedback.overall_score,
        delta: overallDelta,
      },
    ];

    for (const rubric of input.currentFeedback.rubric_breakdown) {
      const previous = previousFeedback.rubric_breakdown.find(
        (item) => item.category === rubric.category,
      );
      if (!previous) continue;
      categoryDeltas.push({
        category: rubric.category,
        previous: previous.score,
        current: rubric.score,
        delta: rubric.score - previous.score,
      });
    }

    return {
      run_id: run.id,
      created_at: run.created_at,
      mode: run.mode,
      overall_delta: overallDelta,
      score_deltas: categoryDeltas,
      summary: summarizeDelta(overallDelta),
    };
  });
}
