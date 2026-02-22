import type { FeedbackOutput, ScoreCategory, SectionBeat, SectionFeedback } from '@/types/analysis-v2';
import type { SectionSlice } from '@/services/sectioningService';

const BEAT_CATEGORY_PRIORITY: Record<SectionBeat, ScoreCategory[]> = {
  intro: ['clarity', 'structure'],
  problem: ['structure', 'clarity'],
  solution: ['clarity', 'evidence'],
  market: ['market', 'evidence'],
  model: ['evidence', 'market'],
  traction: ['evidence', 'market'],
  team: ['structure', 'delivery'],
  ask: ['structure', 'market'],
};

function clip(text: string, max = 180): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}...`;
}

function firstSentence(text: string): string {
  const sentence = text.split(/(?<=[.!?])\s+/u).find((item) => item.trim().length > 0);
  return sentence?.trim() ?? '';
}

function fixesForBeat(
  beat: SectionBeat,
  topFixes: FeedbackOutput['top_fixes'],
): FeedbackOutput['top_fixes'] {
  const prioritized = BEAT_CATEGORY_PRIORITY[beat];
  const selected = topFixes.filter((fix) => prioritized.includes(fix.category));
  if (selected.length >= 2) return selected.slice(0, 2);
  return [...selected, ...topFixes].slice(0, 2);
}

export function buildSectionFeedback(
  slices: SectionSlice[],
  feedback: FeedbackOutput,
): SectionFeedback[] {
  return slices.map((slice) => {
    const matchedFixes = fixesForBeat(slice.beat, feedback.top_fixes);
    const good = firstSentence(slice.text) || `You touched the ${slice.beat} beat with usable narrative structure.`;
    const issue = matchedFixes[0]?.issue ?? `The ${slice.beat} beat needs sharper specificity.`;
    const bad = clip(issue, 160);
    const fixes = matchedFixes.map((fix) => fix.fix);
    const issues = matchedFixes.map((fix) => fix.issue);
    const rubricScore = feedback.rubric_breakdown.find((item) =>
      BEAT_CATEGORY_PRIORITY[slice.beat]?.includes(item.category),
    );
    const sectionScore = rubricScore
      ? Math.round((rubricScore.score / rubricScore.max_score) * 5)
      : 2;

    return {
      beat: slice.beat,
      start_sec: slice.start_sec,
      end_sec: slice.end_sec,
      quotes: slice.text ? [slice.text] : [],
      score: sectionScore,
      score_reason: rubricScore?.rationale ?? `No specific scoring for ${slice.beat}.`,
      good: clip(good, 180),
      bad,
      evidence: clip(slice.text || `No clear evidence detected for ${slice.beat}.`, 220),
      top_issues: issues.length > 0 ? issues : [issue],
      top_fixes: fixes.length > 0 ? fixes : [`Clarify ${slice.beat} with one concrete proof point.`],
      confidence: slice.confidence,
    };
  });
}
