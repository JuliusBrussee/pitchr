import type { Fix, ScoreCategory } from '@/types/analysis';

export interface ReviewBullet {
  rank: number;
  category: ScoreCategory;
  where: string;
  issue: string;
  improve: string;
}

const CATEGORY_LOCATION_MAP: Record<ScoreCategory, string> = {
  structure: 'Pitch structure / flow',
  clarity: 'Wording and messaging',
  evidence: 'Traction and proof points',
  market: 'Market / differentiation section',
  delivery: 'Pace and delivery language',
  deck_narrative: 'Deck narrative flow',
  deck_clarity: 'Slide clarity and hierarchy',
  deck_evidence: 'Deck proof and data slide',
  deck_design: 'Deck visual communication',
  deck_ask: 'Deck ask and milestones',
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function deriveWhereFromText(fix: Fix): string | null {
  const source = `${fix.issue} ${fix.fix}`.toLowerCase();
  if (source.includes('opening') || source.includes('hook')) return 'Opening hook';
  if (source.includes('problem')) return 'Problem statement';
  if (source.includes('solution')) return 'Solution section';
  if (source.includes('traction') || source.includes('revenue') || source.includes('users')) {
    return 'Traction section';
  }
  if (source.includes('market') || source.includes('tam') || source.includes('competitor')) {
    return 'Market / differentiation section';
  }
  if (source.includes('ask') || source.includes('close') || source.includes('closing')) {
    return 'Ask / close';
  }
  if (source.includes('pace') || source.includes('filler') || source.includes('delivery')) {
    return 'Delivery language';
  }
  return null;
}

function getWhereLabel(fix: Fix): string {
  return deriveWhereFromText(fix) ?? CATEGORY_LOCATION_MAP[fix.category];
}

export function formatReviewBullets(fixes: Fix[], maxItems = 5): ReviewBullet[] {
  return fixes.slice(0, maxItems).map((fix, index) => ({
    rank: index + 1,
    category: fix.category,
    where: getWhereLabel(fix),
    issue: normalizeText(fix.issue),
    improve: normalizeText(fix.fix),
  }));
}

export function formatReviewBulletLine(bullet: ReviewBullet): string {
  return `Where: ${bullet.where} | Issue: ${bullet.issue} | Improve: ${bullet.improve}`;
}

export function getTranscriptPreview(
  transcript: string,
  maxChars = 700,
): { preview: string; isTruncated: boolean } {
  const normalized = transcript.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) {
    return { preview: normalized, isTruncated: false };
  }
  return {
    preview: `${normalized.slice(0, maxChars).trimEnd()}...`,
    isTruncated: true,
  };
}
