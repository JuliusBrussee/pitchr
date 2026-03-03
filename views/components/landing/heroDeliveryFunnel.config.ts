export const DELIVERY_WAVE_BARS = [
  { x: 20, y: 25, h: 50, d: 0.1 },
  { x: 40, y: 10, h: 80, d: 0.3 },
  { x: 60, y: 30, h: 40, d: 0.5 },
  { x: 80, y: 15, h: 70, d: 0.2 },
  { x: 100, y: 35, h: 30, d: 0.6 },
  { x: 120, y: 5, h: 90, d: 0.1 },
  { x: 140, y: 20, h: 60, d: 0.4 },
  { x: 160, y: 40, h: 20, d: 0.7 },
  { x: 180, y: 10, h: 80, d: 0.3 },
  { x: 200, y: 25, h: 50, d: 0.5 },
  { x: 220, y: 15, h: 70, d: 0.2 },
  { x: 240, y: 5, h: 90, d: 0.8 },
  { x: 260, y: 30, h: 40, d: 0.1 },
  { x: 280, y: 20, h: 60, d: 0.4 },
  { x: 300, y: 10, h: 80, d: 0.6 },
  { x: 320, y: 35, h: 30, d: 0.3 },
  { x: 340, y: 15, h: 70, d: 0.5 },
  { x: 360, y: 25, h: 50, d: 0.2 },
] as const;

export const FUNNEL_PHASES = {
  anticipation: { start: 0, end: 0.15 },
  funnel: { start: 0.15, end: 0.55 },
  morph: { start: 0.55, end: 0.85 },
  resolve: { start: 0.85, end: 1 },
} as const;

export type FunnelPhaseName = keyof typeof FUNNEL_PHASES;
export type FunnelPhaseRange = (typeof FUNNEL_PHASES)[FunnelPhaseName];

export type TileDensityTier = 'max' | 'high' | 'balanced' | 'mobile';

export type TileDensityInput = {
  tileCount: number;
  viewportWidth: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

export type TileDensityResult = {
  targetCount: number;
  tier: TileDensityTier;
};

function toSafeNumber(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function resolveTileDensityTier(input: TileDensityInput): TileDensityResult {
  const tileCount = Math.max(0, Math.floor(input.tileCount));
  const viewportWidth = toSafeNumber(input.viewportWidth, 1024);
  const deviceMemory = toSafeNumber(input.deviceMemory, 8);
  const cores = toSafeNumber(input.hardwareConcurrency, 8);
  const isMobile = viewportWidth <= 900;

  if (!isMobile) {
    if (deviceMemory >= 8 && cores >= 8) {
      return { targetCount: Math.min(tileCount, 560), tier: 'max' };
    }

    if (deviceMemory >= 6 && cores >= 6) {
      return { targetCount: Math.min(tileCount, 420), tier: 'high' };
    }

    return { targetCount: Math.min(tileCount, 300), tier: 'balanced' };
  }

  if (deviceMemory >= 6 && cores >= 6) {
    return { targetCount: Math.min(tileCount, 220), tier: 'mobile' };
  }

  return { targetCount: Math.min(tileCount, 140), tier: 'mobile' };
}

export type PowerMappingConfig = {
  base: number;
  span: number;
  ampBase: number;
  ampSpan: number;
  glowBase: number;
  glowSpan: number;
  speedBase: number;
  speedSpan: number;
  saturationBase: number;
  saturationSpan: number;
};

export const DEFAULT_POWER_MAPPING: PowerMappingConfig = {
  base: 0,
  span: 1,
  ampBase: 0.54,
  ampSpan: 0.28,
  glowBase: 0.2,
  glowSpan: 0.8,
  speedBase: 1.15,
  speedSpan: -0.25,
  saturationBase: 1,
  saturationSpan: 0.18,
};

export type DeliveryPowerState = {
  power: number;
  amp: number;
  glow: number;
  speed: number;
  saturation: number;
};

export function mapDeliveryPower(progress: number, config = DEFAULT_POWER_MAPPING): DeliveryPowerState {
  const clamped = Math.max(0, Math.min(1, progress));
  const power = config.base + (config.span * clamped);

  return {
    power,
    amp: config.ampBase + (config.ampSpan * power),
    glow: config.glowBase + (config.glowSpan * power),
    speed: config.speedBase + (config.speedSpan * power),
    saturation: config.saturationBase + (config.saturationSpan * power),
  };
}
