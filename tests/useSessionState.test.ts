import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionState } from '@/hooks/useSessionState';

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');
}

describe('useSessionState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts words and filler phrases from transcript text', () => {
    const { result } = renderHook(() => useSessionState());

    act(() => {
      result.current.startSession('vc_pitch');
    });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    const transcript = 'Um you know this is kind of actually a test';

    act(() => {
      result.current.updateTranscript(transcript, transcript);
      vi.advanceTimersByTime(2_000);
    });

    expect(result.current.metrics.wordCount).toBe(10);
    expect(result.current.metrics.fillerWords).toBe(4);
    expect(result.current.metrics.fillerRate).toBeGreaterThan(0);
  });

  it('keeps metrics anchored to committed transcript when live partial regresses', () => {
    const { result } = renderHook(() => useSessionState());

    act(() => {
      result.current.startSession('elevator');
    });

    act(() => {
      vi.advanceTimersByTime(6_000);
      result.current.updateTranscript(
        'we are building software for modern teams',
        'we are building software for modern teams',
      );
    });

    act(() => {
      result.current.updateTranscript('we are', 'we are building software for modern teams');
      vi.advanceTimersByTime(2_000);
    });

    expect(result.current.metrics.wordCount).toBe(7);
  });

  it('applies friction and rounded trend values for WPM updates', () => {
    const { result } = renderHook(() => useSessionState());

    act(() => {
      result.current.startSession('vc_pitch');
    });

    const transcript = makeWords(24);

    act(() => {
      vi.advanceTimersByTime(12_000);
      result.current.updateTranscript(transcript, transcript);
      vi.advanceTimersByTime(2_000);
    });

    const firstWpm = result.current.metrics.wpm;

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    const secondWpm = result.current.metrics.wpm;
    expect(firstWpm).toBeGreaterThan(0);
    expect(firstWpm % 10).toBe(0);
    expect(secondWpm % 10).toBe(0);
    expect(Math.abs(secondWpm - firstWpm)).toBeLessThanOrEqual(8);
  });
});
