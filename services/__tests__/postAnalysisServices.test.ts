import { describe, expect, it } from 'vitest';
import { buildRewriteDiff } from '@/services/rewriteDiffService';
import { calculateDeliveryMetrics } from '@/services/scoringService';
import { buildSectionSlices } from '@/services/sectioningService';
import { calculateVocabularyMetrics } from '@/services/vocabularyService';

describe('post-analysis deterministic enrichments', () => {
  it('detects stutter and hesitation delivery events with timestamps', () => {
    const metrics = calculateDeliveryMetrics({
      transcript: 'We we build software for founders and um it scales.',
      mode: 'elevator',
      segments: [
        {
          text: 'We we build software',
          start: 0,
          end: 1.2,
          words: [
            { text: 'We', start: 0, end: 0.2 },
            { text: 'we', start: 0.21, end: 0.35 },
            { text: 'build', start: 0.36, end: 0.6 },
            { text: 'software', start: 0.61, end: 1.2 },
          ],
        },
        {
          text: 'for founders and um it scales',
          start: 2.5,
          end: 4.2,
          words: [
            { text: 'for', start: 2.5, end: 2.65 },
            { text: 'founders', start: 2.66, end: 3.1 },
            { text: 'and', start: 3.11, end: 3.25 },
            { text: 'um', start: 3.26, end: 3.45 },
            { text: 'it', start: 3.46, end: 3.58 },
            { text: 'scales', start: 3.59, end: 4.2 },
          ],
        },
      ],
    });

    const eventTypes = (metrics.events ?? []).map((event) => event.type);
    expect(eventTypes).toContain('stutter');
    expect(eventTypes).toContain('hesitation');
    expect(eventTypes).toContain('filler');
  });

  it('calculates vocabulary metrics with hedge terms', () => {
    const metrics = calculateVocabularyMetrics(
      'I think we might maybe grow quickly but we really just need more proof.',
    );
    expect(metrics.total_words).toBeGreaterThan(0);
    expect(metrics.hedge_terms.length).toBeGreaterThan(0);
    expect(metrics.lexical_diversity).toBeGreaterThan(0);
  });

  it('produces rewrite diff hunks with grammar tags', () => {
    const diff = buildRewriteDiff(
      'We are building a platform for sales teams.',
      'We built the platform for enterprise sales teams.',
    );
    expect(diff.hunks.length).toBeGreaterThan(0);
    const changedTokens = diff.hunks.flatMap((hunk) =>
      hunk.tokens.filter((token) => token.kind !== 'context'),
    );
    expect(changedTokens.length).toBeGreaterThan(0);
    expect(changedTokens.some((token) => token.grammar_tag)).toBe(true);
  });

  it('sections vc pitch transcript into canonical beats', () => {
    const slices = buildSectionSlices({
      mode: 'vc_pitch',
      transcript:
        'We build workflow software. The problem is fragmented data. Our solution automates reporting. The market is large. Our pricing is subscription. We have growth in pilots. Our team shipped this before. We are raising now.',
    });
    const beats = slices.map((slice) => slice.beat);
    expect(beats).toContain('problem');
    expect(beats).toContain('solution');
    expect(beats).toContain('ask');
  });
});
