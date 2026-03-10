import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SessionPage from '@/app/(app)/session/page';

const mockFetchEdge = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock('@/views/components/SessionCanvas', () => ({
  SessionCanvas: () => <div data-testid="session-canvas" />,
}));

vi.mock('@/views/components/MetricsPanel', () => ({
  MetricsPanel: () => <div data-testid="metrics-panel" />,
}));

vi.mock('@/hooks/useMediaStream', () => ({
  useMediaStream: () => ({
    stream: null,
    isCameraOn: false,
    isMicOn: false,
    toggleCamera: vi.fn(),
    toggleMic: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSessionState', () => ({
  useSessionState: () => ({
    checklist: [],
    metrics: { durationSecs: 0 },
    orbState: 'idle',
    isSessionActive: false,
    startSession: vi.fn(),
    resumeSession: vi.fn(),
    stopSession: vi.fn(),
    resetSession: vi.fn(),
    setOrbState: vi.fn(),
    setChecklist: vi.fn(),
    resetChecklist: vi.fn(),
    updateTranscript: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDeckSlides', () => ({
  useDeckSlides: () => ({
    currentSlide: 0,
    slideCount: 0,
    nextSlide: vi.fn(),
    prevSlide: vi.fn(),
    renderSlideToCanvas: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useSTT', () => ({
  useSTT: () => ({
    realtimeChecklist: [],
    transcriptSegments: [],
    liveText: '',
    checklistSource: null,
    checklistNextHint: null,
    checklistError: null,
    error: null,
    saved: false,
    start: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    discard: vi.fn(),
  }),
}));

vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: () => ({
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
  }),
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

vi.mock('@/hooks/usePitchRun', () => ({
  usePitchRun: () => ({
    runPitchAnalysis: vi.fn(),
    error: null,
    isRateLimited: false,
    secondsRemaining: 0,
  }),
}));

vi.mock('@/views/components/ThemeProvider', () => ({
  useTheme: () => ({ setOrbState: vi.fn() }),
}));

vi.mock('@/views/components/ui', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('@/views/components/AnalyzingOverlay', () => ({
  AnalyzingOverlay: () => null,
}));

vi.mock('@/views/components/SidebarContext', () => ({
  useSidebarSession: vi.fn(),
}));

vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => ({
    activeProject: { id: 'project-1', isArchived: false },
    isLoading: false,
  }),
}));

vi.mock('@/lib/headTracking/useHeadTracking', () => ({
  useHeadTracking: () => ({
    engagementBand: 'good',
    state: 'idle',
    error: null,
    debugEnabled: false,
  }),
}));

vi.mock('@/views/components/PreSessionConfig', () => ({
  PreSessionConfig: () => <div data-testid="pre-session-config" />,
}));

vi.mock('@/lib/liveFeedback', () => ({
  computeLiveSessionFeedback: () => ({
    liveRubric: [],
    beatProgress: [],
  }),
}));

vi.mock('@/hooks/useTutorial', () => ({
  useTutorial: () => ({ registerPage: vi.fn() }),
}));

describe('SessionPage deck load error handling', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a deck load error with retry and retries fetching decks', async () => {
    mockFetchEdge
      .mockRejectedValueOnce(new Error('deck-list failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<SessionPage />);

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
