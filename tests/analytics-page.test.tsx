import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from '@/app/(app)/analytics/page';

const mockFetchEdge = vi.fn();
const mockUseProject = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
  edgeFunctionUrl: vi.fn(),
  getEdgeHeaders: vi.fn(),
}));
vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}));

function getStatValue(label: string): string {
  const labelNode = screen.getByText(label);
  const card = labelNode.closest('div.rounded-2xl');
  if (!card) {
    throw new Error(`Could not find stat card for label: ${label}`);
  }
  const valueNode = card.querySelector('.text-2xl');
  if (!valueNode) {
    throw new Error(`Could not find stat value for label: ${label}`);
  }
  return valueNode.textContent?.trim() ?? '';
}

function countVisibleBars(testId: string): number {
  return screen
    .getAllByTestId(testId)
    .filter((bar) => (bar as HTMLElement).style.opacity !== '0').length;
}

describe('AnalyticsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders score and rubric trends for mixed run payload shapes', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const dayA = new Date(now - 2 * oneDay).toISOString();
    const dayB = new Date(now - oneDay).toISOString();
    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          {
            id: 'run-a',
            projectId: 'project-alpha',
            created_at: dayA,
            overall_score: 72,
            outputs: {
              feedback: {
                rubric_breakdown: [
                  { category: 'structure', score: 14, max_score: 20 },
                  { category: 'clarity', score: 15, max_score: 20 },
                ],
                delivery_metrics: {
                  wpm: 138,
                  duration_seconds: 58,
                  filler_words: [{ word: 'um', count: 1 }],
                  repeated_phrases: [{ phrase: 'we are', count: 2 }],
                  within_time_limit: true,
                },
              },
            },
          },
          {
            id: 'run-b',
            projectId: 'project-alpha',
            createdAt: dayB,
            overallScore: 81,
            analysis: {
              rubric_breakdown: [
                { category: 'structure', score: 17, max_score: 20 },
                { category: 'delivery', score: 16, max_score: 20 },
              ],
              delivery_metrics: {
                wpm: 151,
                duration_seconds: 65,
                filler_words: [{ word: 'like', count: 2 }],
                repeated_phrases: ['we are'],
                within_time_limit: true,
              },
            },
          },
        ],
      }),
    });
    mockUseProject.mockReturnValue({
      activeProjectId: 'project-alpha',
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByText('No sessions in this time range')).toBeNull();
      expect(screen.queryByText('No sessions to show rubric trends')).toBeNull();
    });

    expect(mockFetchEdge).toHaveBeenCalledWith('pitch-run', {
      cache: 'no-store',
      params: { projectId: 'project-alpha', summary: 'true' },
    });
    expect(screen.getByText('Score Trend')).toBeTruthy();
    expect(screen.getByText('Rubric Category Trend')).toBeTruthy();
    expect(screen.queryByText('Sessions This Period')).toBeTruthy();
    // Default 7D buckets.
    expect(screen.getAllByTestId('score-trend-bar')).toHaveLength(7);
    expect(screen.getAllByTestId('rubric-trend-bar')).toHaveLength(35);
    // Two days with data should be visible.
    expect(countVisibleBars('score-trend-bar')).toBe(2);
  });

  it('updates analytics when the top time-range selector changes', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const recent = new Date(now - 2 * oneDay).toISOString();
    const older = new Date(now - 45 * oneDay).toISOString();

    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          {
            id: 'recent-run',
            projectId: 'project-alpha',
            createdAt: recent,
            overallScore: 80,
            analysis: {
              rubric_breakdown: [
                { category: 'structure', score: 16, max_score: 20 },
              ],
              delivery_metrics: {
                wpm: 145,
                duration_seconds: 60,
                filler_words: [],
                repeated_phrases: [],
                within_time_limit: true,
              },
            },
          },
          {
            id: 'older-run',
            projectId: 'project-alpha',
            createdAt: older,
            overallScore: 66,
            analysis: {
              rubric_breakdown: [
                { category: 'structure', score: 12, max_score: 20 },
              ],
              delivery_metrics: {
                wpm: 132,
                duration_seconds: 68,
                filler_words: [],
                repeated_phrases: [],
                within_time_limit: true,
              },
            },
          },
        ],
      }),
    });
    mockUseProject.mockReturnValue({
      activeProjectId: 'project-alpha',
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Sessions This Period')).toBeTruthy();
    });

    // Default range is 7D, so only the recent run should count.
    expect(getStatValue('Sessions This Period')).toBe('1');
    // 7 day grouped buckets.
    expect(screen.getAllByTestId('score-trend-bar')).toHaveLength(7);
    expect(screen.getAllByTestId('rubric-trend-bar')).toHaveLength(35);
    expect(countVisibleBars('score-trend-bar')).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => {
      expect(getStatValue('Sessions This Period')).toBe('2');
    });
    // "All" groups by month, so bucket count depends on month boundaries.
    const allRangeScoreBars = screen.getAllByTestId('score-trend-bar');
    const allRangeRubricBars = screen.getAllByTestId('rubric-trend-bar');
    expect(allRangeScoreBars.length).toBeGreaterThanOrEqual(2);
    expect(allRangeRubricBars.length).toBe(allRangeScoreBars.length * 5);
    expect(countVisibleBars('score-trend-bar')).toBe(2);
  });

  it('keeps only runs for the active project when payload contains mixed projects', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const dayA = new Date(now - 2 * oneDay).toISOString();
    const dayB = new Date(now - oneDay).toISOString();

    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          {
            id: 'run-alpha',
            projectId: 'project-alpha',
            createdAt: dayA,
            overallScore: 82,
            analysis: {
              rubric_breakdown: [{ category: 'structure', score: 16, max_score: 20 }],
              delivery_metrics: {
                wpm: 146,
                duration_seconds: 60,
                filler_words: [],
                repeated_phrases: [],
                within_time_limit: true,
              },
            },
          },
          {
            id: 'run-beta',
            projectId: 'project-beta',
            createdAt: dayB,
            overallScore: 55,
            analysis: {
              rubric_breakdown: [{ category: 'structure', score: 11, max_score: 20 }],
              delivery_metrics: {
                wpm: 121,
                duration_seconds: 69,
                filler_words: [],
                repeated_phrases: [],
                within_time_limit: false,
              },
            },
          },
        ],
      }),
    });

    mockUseProject.mockReturnValue({
      activeProjectId: 'project-alpha',
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Sessions This Period')).toBeTruthy();
    });

    expect(getStatValue('Sessions This Period')).toBe('1');
    expect(countVisibleBars('score-trend-bar')).toBe(1);
  });
});
