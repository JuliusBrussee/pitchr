import { OrbState, OrbColors, OrbAnimationConfig } from './types';

export const SIZE_MAP: Record<string, number> = {
  sm: 64,
  md: 128,
  lg: 256,
  xl: 512,
};

export const COLOR_MAP: Record<OrbState, OrbColors> = {
  idle:     { primary: '#6B21A8', secondary: '#2563EB' },
  active:   { primary: '#06B6D4', secondary: '#3B82F6' },
  positive: { primary: '#22C55E', secondary: '#10B981' },
  negative: { primary: '#EF4444', secondary: '#F97316' },
  neutral:  { primary: '#EAB308', secondary: '#F59E0B' },
};

export const ANIMATION_MAP: Record<OrbState, OrbAnimationConfig> = {
  idle:     { speed: 0.3,  displacement: 0.15 },
  active:   { speed: 0.5,  displacement: 0.25 },
  positive: { speed: 0.7,  displacement: 0.35 },
  negative: { speed: 0.6,  displacement: 0.20 },
  neutral:  { speed: 0.4,  displacement: 0.20 },
};

export const DEFAULTS = {
  intensity: 0.5,
  size: 'md' as const,
  opacity: 0.85,
  lerpSpeed: 0.03,
  breatheAmplitude: 0.02,
  breathePeriod: 3.0,
  sphereDetail: 64,
};
