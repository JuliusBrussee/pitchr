import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryPage from '@/app/(app)/history/page';

const mockFetchEdge = vi.fn();
const mockUseProject = vi.fn();
const mockRegisterPage = vi.fn();
const mockShowTooltip = vi.fn();

vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
  edgeFunctionUrl: vi.fn(),
  getEdgeHeaders: vi.fn(),
}));

vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}));

vi.mock('@/hooks/useTutorial', () => ({
  useTutorial: () => ({ registerPage: mockRegisterPage }),
}));

vi.mock('@/hooks/useSmartTooltip', () => ({
  useSmartTooltip: () => ({ showTooltip: mockShowTooltip }),
}));

vi.mock('@/views/components/RunDetailModal', () => ({
  RunDetailModal: () => null,
}));

vi.mock('@/views/components/RecordingPlayer', () => ({
  RecordingPlayer: () => null,
}));

function edgePayload(runs: unknown[]) {
  return {
    json: async () => ({ runs }),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('HistoryPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps valid rows even when payload contains malformed runs', async () => {
    mockUseProject.mockReturnValue({ activeProjectId: 'project-alpha' });
    mockFetchEdge.mockResolvedValue(
      edgePayload([
        {
          id: 'bad-run',
          mode: 'vc_pitch',
          inputType: 'audio',
          overallScore: 72,
          createdAt: '2026-03-01T10:00:00.000Z',
        },
        {
          id: 'good-run',
          mode: 'vc_pitch',
          inputType: 'audio',
          overallScore: 83,
          createdAt: '2026-03-02T10:00:00.000Z',
          analysis: {
            one_line_verdict: 'Clear and confident.',
            rubric_breakdown: [{ category: 'clarity', score: 17, max_score: 20 }],
            delivery_metrics: {
              duration_seconds: 59,
              wpm: 148,
              filler_words: [],
              repeated_phrases: [],
              within_time_limit: true,
            },
          },
        },
      ]),
    );

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Pitch #1')).toBeTruthy();
      expect(screen.getByText('Clear and confident.')).toBeTruthy();
    });

    expect(screen.queryByText('Failed to load pitch history.')).toBeNull();
  });

  it('ignores stale responses after project switch', async () => {
    const requestA = deferred<ReturnType<typeof edgePayload>>();
    const requestB = deferred<ReturnType<typeof edgePayload>>();
    let activeProjectId = 'project-a';

    mockUseProject.mockImplementation(() => ({ activeProjectId }));
    mockFetchEdge.mockImplementation((_fn: string, init?: { params?: { projectId?: string } }) => {
      if (init?.params?.projectId === 'project-a') {
        return requestA.promise;
      }
      return requestB.promise;
    });

    const view = render(<HistoryPage />);

    activeProjectId = 'project-b';
    view.rerender(<HistoryPage />);

    requestB.resolve(edgePayload([
      {
        id: 'run-b',
        mode: 'vc_pitch',
        inputType: 'audio',
        overallScore: 88,
        createdAt: '2026-03-04T10:00:00.000Z',
        analysis: {
          one_line_verdict: 'Project B verdict',
          rubric_breakdown: [{ category: 'clarity', score: 18, max_score: 20 }],
          delivery_metrics: {
            duration_seconds: 54,
            wpm: 151,
            filler_words: [],
            repeated_phrases: [],
            within_time_limit: true,
          },
        },
      },
    ]));

    await waitFor(() => {
      expect(screen.getByText('Project B verdict')).toBeTruthy();
    });

    requestA.resolve(edgePayload([
      {
        id: 'run-a',
        mode: 'vc_pitch',
        inputType: 'audio',
        overallScore: 64,
        createdAt: '2026-03-03T10:00:00.000Z',
        analysis: {
          one_line_verdict: 'Project A verdict',
          rubric_breakdown: [{ category: 'clarity', score: 12, max_score: 20 }],
          delivery_metrics: {
            duration_seconds: 66,
            wpm: 129,
            filler_words: [],
            repeated_phrases: [],
            within_time_limit: true,
          },
        },
      },
    ]));

    await waitFor(() => {
      expect(screen.getByText('Project B verdict')).toBeTruthy();
      expect(screen.queryByText('Project A verdict')).toBeNull();
    });
  });
});
