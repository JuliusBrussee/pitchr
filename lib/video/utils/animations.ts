import { interpolate, spring } from 'remotion';
import type { SpringConfig } from 'remotion';

/**
 * Text entrance: opacity 0→1 + translateY 14→0 over 12 frames.
 */
export function textIn(frame: number, delay: number = 0) {
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(f, [0, 12], [14, 0], {
    extrapolateRight: 'clamp',
  });
  return { opacity, transform: `translateY(${translateY}px)` };
}

/**
 * Text exit: opacity 1→0 + translateY 0→-8 over last 10 frames of a sequence.
 */
export function textOut(frame: number, seqEnd: number) {
  const remaining = seqEnd - frame;
  if (remaining > 10) return { opacity: 1, transform: 'translateY(0px)' };
  const progress = interpolate(remaining, [0, 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: 1 - progress,
    transform: `translateY(${-8 * progress}px)`,
  };
}

/**
 * Merge textIn and textOut for a complete text lifecycle.
 */
export function textLife(frame: number, seqDuration: number, delay: number = 0) {
  const inStyle = textIn(frame, delay);
  const outStyle = textOut(frame, seqDuration);
  return {
    opacity: Math.min(inStyle.opacity, outStyle.opacity),
    transform: frame < seqDuration - 10 ? inStyle.transform : outStyle.transform,
  };
}

/**
 * Spring entrance for panels — slide up + fade in.
 */
export function panelIn(
  frame: number,
  fps: number,
  delay: number = 0,
  config: Partial<SpringConfig> = {},
) {
  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200, ...config },
  });
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
  };
}

/**
 * Spring with snappy bounce for UI elements.
 */
export function snappySpring(frame: number, fps: number, delay: number = 0) {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18 },
  });
}
