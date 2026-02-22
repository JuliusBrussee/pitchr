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
        insights={[]}
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
        insights={[]}
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
        insights={[]}
        isSessionActive
      />,
    );

    expect(screen.getByText('failed')).toBeTruthy();
  });
});
