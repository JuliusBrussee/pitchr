export type ScoreBand = 'needs-work' | 'getting-there' | 'solid' | 'investor-ready';
export type PitchMode = 'elevator' | 'vc_pitch';

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

export function getModeColor(mode: PitchMode): string {
  return mode === 'elevator' ? '#f97316' : '#ff5941';
}

export function getModeBgColor(mode: PitchMode): string {
  const color = getModeColor(mode);
  return `${color}1a`;
}

export function getModeLabel(mode: PitchMode): string {
  return mode === 'elevator' ? 'Elevator' : 'VC Pitch';
}

export const RUBRIC_COLORS: Record<string, string> = {
  structure: '#ff5941',
  clarity: '#ffaa33',
  evidence: '#22c55e',
  market: '#f97316',
  delivery: '#ef4444',
};

export function getRubricColor(category: string): string {
  return RUBRIC_COLORS[category] ?? '#6b7280';
}
