import { describe, expect, it } from 'vitest';
import { normalizeRuns } from '@/lib/runNormalization';

describe('normalizeRuns', () => {
  it('normalizes mixed payload shapes and keeps valid rows', () => {
    const rows = normalizeRuns([
      {
        id: 'run-1',
        projectId: 'project-alpha',
        mode: 'vc_pitch',
        inputType: 'audio',
        overallScore: 82,
        createdAt: '2026-03-01T10:00:00.000Z',
        analysis: {
          one_line_verdict: 'Strong pitch.',
          rubric_breakdown: [
            { category: 'Structure', score: 16, max_score: 20 },
          ],
          delivery_metrics: {
            duration_seconds: 58,
            wpm: 145,
            filler_words: [{ word: 'um', count: 2 }],
            repeated_phrases: [],
            within_time_limit: true,
          },
        },
      },
      {
        id: 'run-2',
        project_id: 'project-alpha',
        mode: 'elevator',
        created_at: '2026-03-02T10:00:00.000Z',
        overall_score: 0.78,
        outputs: {
          feedback: {
            one_line_verdict: 'Needs clarity.',
            overall_score: 74,
            rubric_breakdown: [
              { category: 'clarity', score: 14, max_score: 20 },
            ],
            delivery_metrics: {
              duration_seconds: 49,
              wpm: 0.95,
              filler_words: [],
              repeated_phrases: [{ phrase: 'we are' }],
              within_time_limit: true,
            },
          },
        },
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.projectId).toBe('project-alpha');
    expect(rows[1]?.projectId).toBe('project-alpha');
    expect(rows[0]?.mode).toBe('vc_pitch');
    expect(rows[0]?.inputType).toBe('audio');
    expect(rows[0]?.analysis.one_line_verdict).toBe('Strong pitch.');
    expect(rows[1]?.mode).toBe('elevator');
    expect(rows[1]?.inputType).toBe('text');
    expect(rows[1]?.analysis.delivery_metrics.wpm).toBe(133); // 0.95 scaled to ~133
  });

  it('drops rows that cannot be safely correlated', () => {
    const rows = normalizeRuns([
      {
        id: 'bad-1',
        mode: 'vc_pitch',
        createdAt: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'bad-2',
        mode: 'unknown_mode',
        createdAt: '2026-03-01T10:00:00.000Z',
        analysis: {
          rubric_breakdown: [],
        },
      },
      {
        id: 'good-1',
        mode: 'vc_pitch',
        createdAt: '2026-03-03T10:00:00.000Z',
        analysis: {
          one_line_verdict: 'Valid row.',
          rubric_breakdown: [{ category: 'delivery', score: 15, max_score: 20 }],
          delivery_metrics: { duration_seconds: 60 },
        },
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.id)).toEqual(['bad-2', 'good-1']);
  });
});
