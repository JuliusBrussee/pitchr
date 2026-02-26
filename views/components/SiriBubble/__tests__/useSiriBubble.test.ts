import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSiriBubble } from '../useSiriBubble';

describe('useSiriBubble', () => {
  it('returns idle state and default intensity by default', () => {
    const { result } = renderHook(() => useSiriBubble());
    expect(result.current.props.state).toBe('idle');
    expect(result.current.props.intensity).toBe(0.42);
  });

  it('accepts custom initial state and intensity', () => {
    const { result } = renderHook(() => useSiriBubble('positive', 0.8));
    expect(result.current.props.state).toBe('positive');
    expect(result.current.props.intensity).toBe(0.8);
  });

  it('setState updates the orb state', () => {
    const { result } = renderHook(() => useSiriBubble());

    act(() => result.current.setState('negative'));
    expect(result.current.props.state).toBe('negative');

    act(() => result.current.setState('active'));
    expect(result.current.props.state).toBe('active');
  });

  it('setIntensity updates intensity', () => {
    const { result } = renderHook(() => useSiriBubble());

    act(() => result.current.setIntensity(0.9));
    expect(result.current.props.intensity).toBe(0.9);
  });

  it('setIntensity clamps to [0, 1]', () => {
    const { result } = renderHook(() => useSiriBubble());

    act(() => result.current.setIntensity(-0.5));
    expect(result.current.props.intensity).toBe(0);

    act(() => result.current.setIntensity(1.5));
    expect(result.current.props.intensity).toBe(1);
  });
});
