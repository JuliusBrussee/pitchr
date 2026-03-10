import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UploadPage from '@/app/(app)/upload/page';

const mockPush = vi.fn();
const mockFetchEdge = vi.fn();
const mockUseProject = vi.fn();
const mockRunPitchAnalysis = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/views/components/ui', () => ({
  GlassCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/views/components/UploadDropZone', () => ({
  UploadDropZone: () => <div data-testid="upload-drop-zone" />,
}));

vi.mock('@/views/components/ProjectSelect', () => ({
  ProjectSelect: ({
    value,
    options,
    onChange,
    id,
    ariaLabel,
  }: {
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (nextValue: string) => void;
    id?: string;
    ariaLabel?: string;
  }) => (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/views/components/ModeSegmentedControl', () => ({
  ModeSegmentedControl: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (nextValue: 'elevator' | 'vc_pitch') => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange('vc_pitch')} aria-pressed={value === 'vc_pitch'}>
        VC
      </button>
      <button type="button" onClick={() => onChange('elevator')} aria-pressed={value === 'elevator'}>
        Elevator
      </button>
    </div>
  ),
}));

vi.mock('@/views/components/AnalyzingOverlay', () => ({
  AnalyzingOverlay: () => null,
}));

vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}));

vi.mock('@/hooks/usePitchRun', () => ({
  usePitchRun: () => ({ runPitchAnalysis: mockRunPitchAnalysis }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/services/recordingService', () => ({
  uploadRecording: vi.fn(),
}));

vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
}));

describe('UploadPage deck load error handling', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a deck load error with retry and retries fetching decks', async () => {
    mockUseProject.mockReturnValue({
      projects: [{ id: 'project-1', name: 'Alpha Project' }],
      activeProjectId: 'project-1',
      isLoading: false,
      setActiveProject: vi.fn().mockResolvedValue(undefined),
    });

    mockFetchEdge
      .mockRejectedValueOnce(new Error('deck-list failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<UploadPage />);

    await waitFor(() => {
      expect(screen.getByText('Could not load decks. Please retry.')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(mockFetchEdge).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByText('Could not load decks. Please retry.')).toBeNull();
    });
  });
});
