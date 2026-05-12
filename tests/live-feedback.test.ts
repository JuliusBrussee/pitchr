import { describe, expect, it } from 'vitest';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import { computeLiveSessionFeedback } from '@/lib/liveFeedback';
import type { RealtimeChecklistItemState } from '@/types/checklist';

function withStatuses(
  mode: 'elevator' | 'vc_pitch' | 'hackathon' | 'final_year',
  overrides: Partial<Record<RealtimeChecklistItemState['id'], RealtimeChecklistItemState['status']>>,
): RealtimeChecklistItemState[] {
  return createInitialChecklistState(mode).map((item) => ({
    ...item,
    status: overrides[item.id] ?? item.status,
  }));
}

describe('computeLiveSessionFeedback', () => {
  it('computes high rubric scores for strong vc pitch coverage and delivery', () => {
    const checklist = withStatuses('vc_pitch', {
      intro_hook: 'completed',
      problem_statement: 'completed',
      solution_overview: 'completed',
      market_opportunity: 'completed',
      business_model: 'completed',
      traction_metrics: 'completed',
      team: 'completed',
      ask: 'completed',
    });

    const result = computeLiveSessionFeedback({
      mode: 'vc_pitch',
      checklist,
      metrics: {
        wpm: 140,
        fillerWords: 1,
        wordCount: 120,
        durationSecs: 75,
        fillerRate: 1,
      },
      targetDurationSeconds: 120,
      targetWpm: 140,
    });

    expect(result.beatProgress.completed).toBe(8);
    expect(result.beatProgress.total).toBe(8);
    expect(result.beatProgress.nextBeatId).toBeNull();
    expect(result.liveRubric.every((item) => item.score20 >= 19)).toBe(true);
  });

  it('tracks next beat when ask is still uncovered', () => {
    const checklist = withStatuses('vc_pitch', {
      intro_hook: 'completed',
      problem_statement: 'completed',
      solution_overview: 'completed',
      market_opportunity: 'completed',
      business_model: 'completed',
      traction_metrics: 'completed',
      team: 'completed',
      ask: 'uncovered',
    });

    const result = computeLiveSessionFeedback({
      mode: 'vc_pitch',
      checklist,
      metrics: {
        wpm: 138,
        fillerWords: 2,
        wordCount: 100,
        durationSecs: 90,
        fillerRate: 2,
      },
      targetDurationSeconds: 120,
      targetWpm: 140,
    });

    expect(result.beatProgress.completed).toBe(7);
    expect(result.beatProgress.nextBeatId).toBe('ask');
    const structure = result.liveRubric.find((item) => item.category === 'structure');
    expect(structure?.score20).toBeLessThan(20);
  });

  it('reduces delivery score for poor live delivery metrics', () => {
    const checklist = withStatuses('elevator', {
      intro_hook: 'completed',
      problem_statement: 'partial',
      solution_overview: 'partial',
      ask: 'uncovered',
    });

    const result = computeLiveSessionFeedback({
      mode: 'elevator',
      checklist,
      metrics: {
        wpm: 95,
        fillerWords: 12,
        wordCount: 90,
        durationSecs: 42,
        fillerRate: 8,
      },
      targetDurationSeconds: 30,
      targetWpm: 165,
    });

    const delivery = result.liveRubric.find((item) => item.category === 'delivery');
    expect(delivery?.score20).toBeLessThanOrEqual(8);
    expect(result.beatProgress.total).toBe(4);
  });

  it('computes feedback for hackathon mode with all beats completed', () => {
    const checklist = withStatuses('hackathon', {
      intro_hook: 'completed',
      problem_statement: 'completed',
      solution_overview: 'completed',
      market_opportunity: 'completed',
      business_model: 'completed',
      traction_metrics: 'completed',
      team: 'completed',
      ask: 'completed',
    });

    const result = computeLiveSessionFeedback({
      mode: 'hackathon',
      checklist,
      metrics: {
        wpm: 150,
        fillerWords: 2,
        wordCount: 300,
        durationSecs: 120,
        fillerRate: 1,
      },
      targetDurationSeconds: 180,
      targetWpm: 150,
    });

    expect(result.beatProgress.completed).toBeGreaterThan(0);
    expect(result.liveRubric.length).toBeGreaterThan(0);
  });

  it('computes feedback for final_year mode with partial coverage', () => {
    const checklist = withStatuses('final_year', {
      intro_hook: 'completed',
      problem_statement: 'completed',
      solution_overview: 'partial',
    });

    const result = computeLiveSessionFeedback({
      mode: 'final_year',
      checklist,
      metrics: {
        wpm: 130,
        fillerWords: 4,
        wordCount: 200,
        durationSecs: 90,
        fillerRate: 2,
      },
      targetDurationSeconds: 240,
      targetWpm: 130,
    });

    expect(result.beatProgress.completed).toBeGreaterThanOrEqual(2);
    expect(result.liveRubric.length).toBeGreaterThan(0);
    const structure = result.liveRubric.find((item) => item.category === 'structure');
    expect(structure?.score20).toBeLessThan(20);
  });
});
