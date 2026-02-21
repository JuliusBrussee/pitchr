import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
        metrics={{ wpm: 120, fillerWords: 1, conciseness: 6, clarity: 7 }}
        checklist={checklist}
        insights={[]}
        isSessionActive
        selectedMode="elevator"
        onModeChange={vi.fn()}
      />,
    );

    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('"My name is Alice and we solve..."')).toBeTruthy();
  });

  it('calls onModeChange when mode button is clicked', () => {
    const onModeChange = vi.fn();
    render(
      <MetricsPanel
        metrics={{ wpm: 120, fillerWords: 0, conciseness: 7, clarity: 7 }}
        checklist={checklist}
        insights={[]}
        isSessionActive={false}
        selectedMode="elevator"
        onModeChange={onModeChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'VC Pitch' }));
    expect(onModeChange).toHaveBeenCalledWith('vc_pitch');
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
        metrics={{ wpm: 120, fillerWords: 0, conciseness: 7, clarity: 7 }}
        checklist={failedChecklist}
        insights={[]}
        isSessionActive
        selectedMode="elevator"
        onModeChange={vi.fn()}
      />,
    );

    expect(screen.getByText('failed')).toBeTruthy();
  });
});
