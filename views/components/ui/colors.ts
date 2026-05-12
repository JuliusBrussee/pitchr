export type ScoreBand = 'needs-work' | 'getting-there' | 'solid' | 'investor-ready';
export type PitchMode = 'elevator' | 'vc_pitch' | 'hackathon' | 'final_year';

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'investor-ready';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'getting-there';
  return 'needs-work';
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getScoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const hue = (clamped / 100) * 120;
  return hslToHex(hue, 72, 45);
}

export function getScoreBgColor(score: number): string {
  const color = getScoreColor(score);
  return `${color}1a`;
}

export function getScoreBandLabel(score: number): string {
  const band = getScoreBand(score);
  const labels: Record<ScoreBand, string> = {
    'needs-work': 'Needs Work',
    'getting-there': 'Getting There',
    'solid': 'Solid',
    'investor-ready': 'Investor-Ready',
  };
  return labels[band];
}

export const MARKET_ORANGE = '#f97316';

export function getModeColor(mode: PitchMode): string {
  if (mode === 'elevator') return MARKET_ORANGE;
  if (mode === 'hackathon') return '#8b5cf6';
  if (mode === 'final_year') return '#10b981';
  return ACCENT;
}

export function getModeBgColor(mode: PitchMode): string {
  const color = getModeColor(mode);
  return `${color}1a`;
}

export function getModeLabel(mode: PitchMode): string {
  if (mode === 'elevator') return 'Elevator';
  if (mode === 'hackathon') return 'Hackathon';
  if (mode === 'final_year') return 'Final Year';
  return 'VC Pitch';
}

/* ——— Shared palette ——— */

export const ACCENT = '#ff5941';
export const ACCENT_SECONDARY = '#ffaa33';
export const ACCENT_DARK = '#e63b26';
export const SUCCESS = '#22c55e';
export const DANGER = '#ef4444';
export const WARNING = '#f59e0b';

/** Append hex alpha to a color, e.g. withAlpha('#ff5941', '1a') */
export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

export const RUBRIC_COLORS: Record<string, string> = {
  structure: ACCENT,
  clarity: ACCENT_SECONDARY,
  evidence: SUCCESS,
  market: MARKET_ORANGE,
  delivery: DANGER,
};

export function getRubricColor(category: string): string {
  return RUBRIC_COLORS[category] ?? '#6b7280';
}
