import { getDeckWithSlides } from '@/services/deckService';
import type { SectionFeedback } from '@/types/analysis-v2';

function normalizeWords(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? [])
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

function clip(text: string, max = 160): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}...`;
}

function overlapScore(left: string[], right: string[]): { score: number; matches: string[] } {
  if (left.length === 0 || right.length === 0) return { score: 0, matches: [] };
  const rightSet = new Set(right);
  const matches = [...new Set(left.filter((token) => rightSet.has(token)))];
  const score = matches.length / Math.max(1, left.length);
  return { score, matches };
}

export async function linkSectionFeedbackToDeck(
  sections: SectionFeedback[],
  deckId?: string,
): Promise<{ sections: SectionFeedback[]; averageConfidence: number }> {
  if (!deckId || sections.length === 0) {
    return { sections, averageConfidence: 0 };
  }

  try {
    const { slides } = await getDeckWithSlides(deckId);
    const linked = sections.map((section) => {
      const sectionTokens = normalizeWords(`${section.evidence} ${section.good} ${section.bad}`);
      const scoredSlides = slides
        .map((slide) => {
          const slideTokens = normalizeWords(slide.text ?? '');
          const overlap = overlapScore(sectionTokens, slideTokens);
          return {
            slide_num: slide.slide_num,
            confidence: overlap.score,
            matched_terms: overlap.matches,
            snippet: clip(slide.text ?? ''),
          };
        })
        .filter((entry) => entry.confidence >= 0.12)
        .sort((left, right) => right.confidence - left.confidence)
        .slice(0, 2);

      return {
        ...section,
        slide_links: scoredSlides,
      };
    });

    const confidences = linked.flatMap((section) =>
      (section.slide_links ?? []).map((entry) => entry.confidence),
    );
    const averageConfidence =
      confidences.length === 0
        ? 0
        : confidences.reduce((sum, value) => sum + value, 0) / confidences.length;

    return {
      sections: linked,
      averageConfidence,
    };
  } catch {
    return { sections, averageConfidence: 0 };
  }
}
