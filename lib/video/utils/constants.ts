/* ——— Brand colors ——— */
export const BRAND_CORAL = '#ff5941';
export const BRAND_ORANGE = '#ffaa33';
export const BRAND_DARK = '#0a0a0c';
export const DARK_NAVY = '#0D0D12';
export const WARM_WHITE = '#F4F3EF';
export const OFF_WHITE = WARM_WHITE;
export const SURFACE = '#ffffff';
export const BORDER = '#e5e5e3';
export const TEXT_PRIMARY = '#1a1a1a';
export const TEXT_MUTED = '#6b7280';
export const CORAL_BG = '#ff5941';

/* ——— Rubric category colors ——— */
export const RUBRIC_COLORS: Record<string, string> = {
  structure: '#ff5941',
  clarity: '#ffaa33',
  evidence: '#22c55e',
  market: '#f97316',
  delivery: '#ef4444',
};

/* ——— Video specs ——— */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 1350; // 45 seconds

/* ——— Sequence timing table (frames) ——— */
export const SEQ = {
  LOGO_REVEAL: 75,
  PROBLEM_STATEMENT: 120,
  DASHBOARD_FLYOVER: 240,
  SESSION_DEMO: 210,
  RESULTS_REVEAL: 210,
  QA_ARENA: 165,
  SCORE_LEAP: 150,
  END_CARD: 180,
} as const;
