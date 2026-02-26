import { OrbState, OrbColors, OrbAnimationConfig } from './types';

export const SIZE_MAP: Record<string, number> = {
  sm: 64,
  md: 128,
  lg: 256,
  xl: 512,
};

export const COLOR_MAP: Record<OrbState, OrbColors> = {
  idle:     { primary: '#FF6A1A', secondary: '#FF9F45' },   // vivid orange
  active:   { primary: '#FF5500', secondary: '#FF8C2A' },   // hot orange
  positive: { primary: '#10B981', secondary: '#34D399' },   // vivid green
  negative: { primary: '#EF4444', secondary: '#F87171' },   // vivid red
  neutral:  { primary: '#F59E0B', secondary: '#FBBF24' },   // vivid amber
};

export const ANIMATION_MAP: Record<OrbState, OrbAnimationConfig> = {
  idle:     { speed: 0.2,  displacement: 0.08 },
  active:   { speed: 0.35, displacement: 0.12 },
  positive: { speed: 0.4,  displacement: 0.15 },
  negative: { speed: 0.35, displacement: 0.10 },
  neutral:  { speed: 0.25, displacement: 0.10 },
};

export const DEFAULTS = {
  intensity: 0.42,
  size: 'md' as const,
  opacity: 0.92,
  fresnelPower: 6.0,
  filmThickness: 2.0,
  lerpSpeed: 0.03,
  breatheAmplitude: 0.015,
  breathePeriod: 4.0,
  sphereDetail: 64,
};
