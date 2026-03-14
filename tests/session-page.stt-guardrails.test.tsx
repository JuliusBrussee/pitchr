import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionPage from '@/app/(app)/session/page';

const mockFetchEdge = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockStartSession = vi.fn();
const mockSttStart = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock('@/views/components/SessionCanvas', () => ({
  SessionCanvas: ({
    onStartSession,
    canStartSession,
  }: {
    onStartSession: () => void;
    canStartSession?: boolean;
  }) => (
    <button
      type="button"
      onClick={onStartSession}
      disabled={canStartSession === false}
      aria-label="Start session"
    >
      Start Session
    </button>
  ),
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
    startSession: mockStartSession,
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
    isSttAvailable: false,
    sttAvailabilityMessage:
      'Server configuration error: missing ASSEMBLYAI_API_KEY. Set ASSEMBLYAI_API_KEY in .env.local and restart yarn dev.',
    realtimeChecklist: [],
    transcriptSegments: [],
    liveText: '',
    checklistSource: null,
    checklistNextHint: null,
    checklistError: null,
    error: null,
    saved: false,
    start: mockSttStart,
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

vi.mock('@/views/components/AnalysisTrackerProvider', () => ({
  useAnalysisTracker: () => ({
    activeRunId: null,
    activeRun: null,
    activeRunStatus: null,
    isPolling: false,
    error: null,
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  }),
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

describe('SessionPage STT guardrails', () => {
  beforeEach(() => {
    mockFetchEdge.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows explicit warning and disables session start when STT key is missing', async () => {
    render(<SessionPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });

    expect(screen.getByText(/missing ASSEMBLYAI_API_KEY/i)).toBeTruthy();

    const startButton = screen.getByRole('button', { name: 'Start session' }) as HTMLButtonElement;
    expect(startButton.disabled).toBe(true);

    fireEvent.click(startButton);

    expect(mockStartSession).not.toHaveBeenCalled();
    expect(mockSttStart).not.toHaveBeenCalled();
  });
});