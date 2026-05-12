import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import { useSTT } from '@/hooks/useSTT';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }

  emit(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }
}

class MockAudioContext {
  sampleRate = 48000;
  destination = {};

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createScriptProcessor() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect: vi.fn(),
    };
  }

  close() {
    return Promise.resolve();
  }
}

const mockFetch = vi.fn();

describe('useSTT resume behavior', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not re-send session_config on resume and preserves checklist state', async () => {
    const { result } = renderHook(() => useSTT());

    await act(async () => {
      await result.current.start({ mode: 'vc_pitch' });
    });

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
      expect(result.current.isRecording).toBe(true);
    });

    const socket = MockWebSocket.instances[0];
    const items = createInitialChecklistState('vc_pitch');
    items[0] = {
      ...items[0],
      status: 'partial',
      confidence: 0.7,
      evidence: 'My name is Alice and we are building...',
    };

    act(() => {
      socket.emit({
        type: 'checklist_update',
        mode: 'vc_pitch',
        source: 'llm',
        items,
        progress: { completed: 1, total: 8 },
        nextHint: 'Add traction numbers.',
        updatedAt: new Date().toISOString(),
      });
    });

    expect(result.current.realtimeChecklist[0].status).toBe('partial');

    act(() => {
      result.current.pause();
    });

    await act(async () => {
      await result.current.start({ mode: 'vc_pitch', resume: true });
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });

    const sentPayloads = socket.sent.map((payload) => JSON.parse(payload));
    const sessionConfigCount = sentPayloads.filter(
      (payload) => payload.type === 'session_config',
    ).length;

    expect(sessionConfigCount).toBe(1);
    expect(result.current.realtimeChecklist[0].status).toBe('partial');
  });

  it('blocks session start and shows guidance when STT capability probe reports missing key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        enabled: false,
        message: 'Server configuration error: missing ASSEMBLYAI_API_KEY.',
      }),
    });

    const { result } = renderHook(() => useSTT());

    await act(async () => {
      await result.current.start({ mode: 'vc_pitch' });
    });

    expect(MockWebSocket.instances.length).toBe(0);
    expect(result.current.isSttAvailable).toBe(false);
    expect(result.current.error).toContain('ASSEMBLYAI_API_KEY');
    expect(result.current.error).toContain('Set ASSEMBLYAI_API_KEY');
  });
});
