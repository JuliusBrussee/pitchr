import { describe, expect, it } from 'vitest';
import { buildRewriteDiff, buildSectionRewriteDiff } from '@/services/rewriteDiffService';

describe('buildRewriteDiff', () => {
  it('produces hunks for identical text with all context tokens', () => {
    const diff = buildRewriteDiff(
      'We build great products.',
      'We build great products.',
    );
    expect(diff.hunks).toHaveLength(1);
    expect(diff.stats.added).toBe(0);
    expect(diff.stats.removed).toBe(0);
    expect(diff.stats.changed).toBe(0);
    expect(diff.alignment_score).toBe(1);
    const allContext = diff.hunks[0].tokens.every((t) => t.kind === 'context');
    expect(allContext).toBe(true);
  });

  it('detects added and removed tokens', () => {
    const diff = buildRewriteDiff(
      'We are building a platform.',
      'We built the enterprise platform.',
    );
    expect(diff.hunks).toHaveLength(1);
    expect(diff.stats.added).toBeGreaterThan(0);
    expect(diff.stats.removed).toBeGreaterThan(0);
    expect(diff.stats.changed).toBe(1);
  });

  it('assigns grammar tags to changed tokens', () => {
    const diff = buildRewriteDiff(
      'We are building.',
      'We built it.',
    );
    const changedTokens = diff.hunks.flatMap((h) =>
      h.tokens.filter((t) => t.kind !== 'context'),
    );
    expect(changedTokens.length).toBeGreaterThan(0);
    changedTokens.forEach((token) => {
      expect(token.grammar_tag).toBeDefined();
      expect(['punctuation', 'article', 'agreement', 'tense', 'word_choice']).toContain(
        token.grammar_tag,
      );
    });
  });

  it('handles multiple sentences producing multiple hunks', () => {
    const diff = buildRewriteDiff(
      'We build tools. Teams love them.',
      'We create solutions. Enterprises adopt them.',
    );
    expect(diff.hunks).toHaveLength(2);
  });

  it('handles empty original text', () => {
    const diff = buildRewriteDiff('', 'New content here.');
    expect(diff.hunks).toHaveLength(1);
    expect(diff.stats.added).toBeGreaterThan(0);
    expect(diff.stats.removed).toBe(0);
  });

  it('handles empty rewrite text', () => {
    const diff = buildRewriteDiff('Original content here.', '');
    expect(diff.hunks).toHaveLength(1);
    expect(diff.stats.removed).toBeGreaterThan(0);
    expect(diff.stats.added).toBe(0);
  });

  it('generates hunk summary with edit counts', () => {
    const diff = buildRewriteDiff(
      'We are building a platform.',
      'We built the enterprise platform.',
    );
    const summaries = diff.hunks.map((h) => h.summary).filter(Boolean);
    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries[0]).toMatch(/Edits: \+\d+ \/ -\d+/);
  });

  it('alignment_score is between 0 and 1', () => {
    const diff = buildRewriteDiff(
      'Completely different text here.',
      'Something else entirely new.',
    );
    expect(diff.alignment_score).toBeGreaterThanOrEqual(0);
    expect(diff.alignment_score).toBeLessThanOrEqual(1);
  });

  it('assigns tense grammar_tag to past tense words', () => {
    const diff = buildRewriteDiff(
      'We build things.',
      'We built things.',
    );
    const tenseTokens = diff.hunks.flatMap((h) =>
      h.tokens.filter((t) => t.grammar_tag === 'tense'),
    );
    expect(tenseTokens.length).toBeGreaterThan(0);
  });

  it('assigns article grammar_tag to a/an/the', () => {
    const diff = buildRewriteDiff(
      'We need a solution.',
      'We need the solution.',
    );
    const articleTokens = diff.hunks.flatMap((h) =>
      h.tokens.filter((t) => t.grammar_tag === 'article'),
    );
    expect(articleTokens.length).toBeGreaterThan(0);
  });
});

describe('buildSectionRewriteDiff', () => {
  it('returns undefined when rewrite is empty', () => {
    const result = buildSectionRewriteDiff(['Some text.'], '');
    expect(result).toBeUndefined();
  });

  it('returns undefined when quotes array is empty', () => {
    const result = buildSectionRewriteDiff([], 'Some rewrite.');
    expect(result).toBeUndefined();
  });

  it('joins quotes and compares to rewrite', () => {
    const result = buildSectionRewriteDiff(
      ['We build tools.', 'Teams use them.'],
      'We create solutions that teams adopt.',
    );
    expect(result).toBeDefined();
    expect(result!.hunks.length).toBeGreaterThan(0);
  });
});
