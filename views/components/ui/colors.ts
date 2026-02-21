export type ScoreBand = 'needs-work' | 'getting-there' | 'solid' | 'investor-ready';
export type PitchMode = 'elevator' | 'vc_pitch';

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'investor-ready';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'getting-there';
  return 'needs-work';
}

export function getScoreColor(score: number): string {
  const band = getScoreBand(score);
  const colors: Record<ScoreBand, string> = {
    'needs-work': '#ef4444',
    'getting-there': '#eab308',
    'solid': '#3b82f6',
    'investor-ready': '#22c55e',
  };
  return colors[band];
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
  return mode === 'elevator' ? '#f97316' : '#8b5cf6';
}

export function getModeBgColor(mode: PitchMode): string {
  const color = getModeColor(mode);
  return `${color}1a`;
}

export function getModeLabel(mode: PitchMode): string {
  return mode === 'elevator' ? 'Elevator' : 'VC Pitch';
}

export const RUBRIC_COLORS: Record<string, string> = {
  structure: '#8b5cf6',
  clarity: '#3b82f6',
  evidence: '#22c55e',
  market: '#f97316',
  delivery: '#ef4444',
};

export function getRubricColor(category: string): string {
  return RUBRIC_COLORS[category] ?? '#6b7280';
}
