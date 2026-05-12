import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InsightsPage from '@/app/(app)/insights/page';

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

function countVisibleBars(testId: string): number {
  return screen
    .getAllByTestId(testId)
    .filter((bar) => (bar as HTMLElement).style.opacity !== '0').length;
}

function makeRun({
  id,
  projectId,
  createdAt,
  overallScore,
  rubricBreakdown,
}: {
  id: string;
  projectId: string;
  createdAt: string;
  overallScore: number;
  rubricBreakdown: Array<{ category: string; score: number; max_score: number }>;
}) {
  return {
    id,
    mode: 'vc_pitch',
    projectId,
    createdAt,
    overallScore,
    analysis: {
      one_line_verdict: 'Solid',
      rubric_breakdown: rubricBreakdown,
      delivery_metrics: {
        wpm: 145,
        duration_seconds: 60,
        filler_rate: 0.02,
        filler_words: [{ word: 'um', count: 1 }],
        repeated_phrases: [],
        within_time_limit: true,
      },
      top_fixes: [],
    },
  };
}

describe('InsightsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders insights trends and queries all-project summary data', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const dayA = new Date(now - 2 * oneDay).toISOString();
    const dayB = new Date(now - oneDay).toISOString();

    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          makeRun({
            id: 'run-a',
            projectId: 'project-alpha',
            createdAt: dayA,
            overallScore: 72,
            rubricBreakdown: [
              { category: 'structure', score: 14, max_score: 20 },
              { category: 'clarity', score: 15, max_score: 20 },
            ],
          }),
          makeRun({
            id: 'run-b',
            projectId: 'project-beta',
            createdAt: dayB,
            overallScore: 81,
            rubricBreakdown: [
              { category: 'structure', score: 17, max_score: 20 },
              { category: 'delivery', score: 16, max_score: 20 },
            ],
          }),
        ],
      }),
    });

    mockUseProject.mockReturnValue({
      projects: [
        { id: 'project-alpha', name: 'Alpha Project', isArchived: false },
        { id: 'project-beta', name: 'Beta Project', isArchived: false },
      ],
      activeProjectId: 'project-alpha',
    });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.queryByText('No sessions in this time range')).toBeNull();
      expect(screen.queryByText('No sessions to show rubric trends')).toBeNull();
    });

    expect(mockFetchEdge).toHaveBeenCalledWith('pitch-run', {
      params: { allProjects: 'true', summary: 'true' },
    });
    expect(screen.getByText('Insights')).toBeTruthy();
    expect(screen.getByText('Score Trend')).toBeTruthy();
    expect(screen.getByText('Rubric Category Trend')).toBeTruthy();
    // Default range is 30D.
    expect(screen.getAllByTestId('score-trend-bar')).toHaveLength(30);
    expect(screen.getAllByTestId('rubric-trend-bar')).toHaveLength(150);
    expect(countVisibleBars('score-trend-bar')).toBe(2);
  });

  it('updates analytics buckets when the top time-range selector changes', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const recent = new Date(now - 2 * oneDay).toISOString();
    const older = new Date(now - 45 * oneDay).toISOString();

    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          makeRun({
            id: 'recent-run',
            projectId: 'project-alpha',
            createdAt: recent,
            overallScore: 80,
            rubricBreakdown: [{ category: 'structure', score: 16, max_score: 20 }],
          }),
          makeRun({
            id: 'older-run',
            projectId: 'project-alpha',
            createdAt: older,
            overallScore: 66,
            rubricBreakdown: [{ category: 'structure', score: 12, max_score: 20 }],
          }),
        ],
      }),
    });

    mockUseProject.mockReturnValue({
      projects: [{ id: 'project-alpha', name: 'Alpha Project', isArchived: false }],
      activeProjectId: 'project-alpha',
    });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Score Trend')).toBeTruthy();
    });

    expect(screen.getAllByTestId('score-trend-bar')).toHaveLength(30);
    expect(screen.getAllByTestId('rubric-trend-bar')).toHaveLength(150);
    expect(countVisibleBars('score-trend-bar')).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => {
      expect(countVisibleBars('score-trend-bar')).toBe(2);
    });

    const allRangeScoreBars = screen.getAllByTestId('score-trend-bar');
    const allRangeRubricBars = screen.getAllByTestId('rubric-trend-bar');
    expect(allRangeScoreBars.length).toBeGreaterThanOrEqual(2);
    expect(allRangeRubricBars.length).toBe(allRangeScoreBars.length * 5);
  });

  it('filters runs when selecting a specific project from the project filter', async () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const dayA = new Date(now - 2 * oneDay).toISOString();
    const dayB = new Date(now - oneDay).toISOString();

    mockFetchEdge.mockResolvedValue({
      json: async () => ({
        runs: [
          makeRun({
            id: 'run-alpha',
            projectId: 'project-alpha',
            createdAt: dayA,
            overallScore: 82,
            rubricBreakdown: [{ category: 'structure', score: 16, max_score: 20 }],
          }),
          makeRun({
            id: 'run-beta',
            projectId: 'project-beta',
            createdAt: dayB,
            overallScore: 55,
            rubricBreakdown: [{ category: 'structure', score: 11, max_score: 20 }],
          }),
        ],
      }),
    });

    mockUseProject.mockReturnValue({
      projects: [
        { id: 'project-alpha', name: 'Alpha Project', isArchived: false },
        { id: 'project-beta', name: 'Beta Project', isArchived: false },
      ],
      activeProjectId: 'project-alpha',
    });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Filter by project' })).toBeTruthy();
    });

    expect(countVisibleBars('score-trend-bar')).toBe(2);

    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by project' }));
    fireEvent.click(screen.getByRole('option', { name: 'Alpha Project' }));

    await waitFor(() => {
      expect(countVisibleBars('score-trend-bar')).toBe(1);
    });
  });
});
