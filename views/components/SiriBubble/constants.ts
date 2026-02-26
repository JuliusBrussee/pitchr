import { OrbState, OrbColors, OrbAnimationConfig } from './types';

export const SIZE_MAP: Record<string, number> = {
  sm: 64,
  md: 128,
  lg: 256,
  xl: 512,
};

export const COLOR_MAP: Record<OrbState, OrbColors> = {
  idle:     { primary: '#FF8C42', secondary: '#FFB347' },   // orange
  active:   { primary: '#FF6B2B', secondary: '#FFA040' },   // warm orange
  positive: { primary: '#34D399', secondary: '#6EE7B7' },   // green
  negative: { primary: '#F87171', secondary: '#FCA5A5' },   // red (soft)
  neutral:  { primary: '#FBBF24', secondary: '#FCD34D' },   // amber
};

export const ANIMATION_MAP: Record<OrbState, OrbAnimationConfig> = {
  idle:     { speed: 0.2,  displacement: 0.08 },
  active:   { speed: 0.35, displacement: 0.12 },
  positive: { speed: 0.4,  displacement: 0.15 },
  negative: { speed: 0.35, displacement: 0.10 },
  neutral:  { speed: 0.25, displacement: 0.10 },
};

export const DEFAULTS = {
  intensity: 0.20,
  size: 'md' as const,
  opacity: 0.75,
  lerpSpeed: 0.03,
  breatheAmplitude: 0.015,
  breathePeriod: 4.0,
  sphereDetail: 64,
};
