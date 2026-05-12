import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import type { RealtimeChecklistItemState } from '@/types/checklist';

const checklist: RealtimeChecklistItemState[] = [
  {
    id: 'intro_hook',
    label: 'Introduction & hook',
    status: 'partial',
    confidence: 0.85,
    evidence: 'My name is Alice and we solve...',
    required: true,
    lastUpdatedAt: new Date().toISOString(),
  },
];

describe('MetricsPanel', () => {
  it('renders checklist confidence and evidence snippet', () => {
    render(
      <MetricsPanel
        metrics={{ wpm: 120, fillerWords: 1, wordCount: 50, durationSecs: 25, fillerRate: 2 }}
        checklist={checklist}
        isSessionActive
      />,
    );

    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText(/My name is Alice and we solve/)).toBeTruthy();
  });

  it('renders without mode selector controls', () => {
    render(
      <MetricsPanel
        metrics={{ wpm: 120, fillerWords: 0, wordCount: 50, durationSecs: 25, fillerRate: 0 }}
        checklist={checklist}
        isSessionActive={false}
      />,
    );

    expect(screen.queryByRole('button', { name: 'VC Pitch' })).toBeNull();
    expect(screen.queryByText('Pitch Mode')).toBeNull();
  });

  it('renders failed status label for failed checklist rows', () => {
    const failedChecklist: RealtimeChecklistItemState[] = [
      {
        ...checklist[0],
        status: 'failed',
        evidence: 'Not covered within the first 30 seconds.',
      },
    ];

    render(
      <MetricsPanel
        metrics={{ wpm: 120, fillerWords: 0, wordCount: 50, durationSecs: 25, fillerRate: 0 }}
        checklist={failedChecklist}
        isSessionActive
      />,
    );

    expect(screen.getByText('failed')).toBeTruthy();
  });

  it('renders live rubric preview and session beat progress', () => {
    render(
      <MetricsPanel
        metrics={{ wpm: 140, fillerWords: 1, wordCount: 85, durationSecs: 45, fillerRate: 1.2 }}
        checklist={checklist}
        liveRubric={[
          { category: 'structure', score20: 17 },
          { category: 'clarity', score20: 16 },
          { category: 'evidence', score20: 12 },
          { category: 'market', score20: 15 },
          { category: 'delivery', score20: 18 },
        ]}
        beatProgress={{
          beats: [
            {
              id: 'intro_hook',
              label: 'Introduction & hook',
              status: 'completed',
              required: true,
            },
            {
              id: 'problem_statement',
              label: 'Problem statement',
              status: 'partial',
              required: true,
            },
          ],
          completed: 1,
          total: 2,
          nextBeatId: 'problem_statement',
        }}
        isSessionActive
      />,
    );

    expect(screen.getByText('Live Rubric Preview')).toBeTruthy();
    expect(screen.getByText('Beats 1/2')).toBeTruthy();
    expect(screen.getByText('17/20')).toBeTruthy();
    expect(screen.getByText('Session Beats: Next: Problem statement')).toBeTruthy();
  });
});
