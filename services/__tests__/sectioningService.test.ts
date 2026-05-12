import { describe, expect, it } from 'vitest';
import { buildSectionSlices } from '@/services/sectioningService';

describe('buildSectionSlices', () => {
  it('returns all expected beats for vc_pitch mode', () => {
    const slices = buildSectionSlices({
      transcript:
        'We build software. The problem is data silos. Our solution automates this. The market is growing. Our pricing works. Revenue is strong. Our team is great. We are raising a round.',
      mode: 'vc_pitch',
    });
    const beats = slices.map((s) => s.beat);
    expect(beats).toContain('intro');
    expect(beats).toContain('problem');
    expect(beats).toContain('solution');
    expect(beats).toContain('market');
    expect(beats).toContain('ask');
  });

  it('returns all expected beats for elevator mode', () => {
    const slices = buildSectionSlices({
      transcript:
        'We build great tools. The problem is costly workflows. Our platform solves this. We are raising now.',
      mode: 'elevator',
    });
    const beats = slices.map((s) => s.beat);
    expect(beats).toContain('intro');
    expect(beats).toContain('problem');
    expect(beats).toContain('solution');
    expect(beats).toContain('ask');
    expect(beats).toHaveLength(4);
  });

  it('handles empty transcript by returning fallback slices for all beats', () => {
    const slices = buildSectionSlices({
      transcript: '',
      mode: 'elevator',
    });
    expect(slices).toHaveLength(4); // intro, problem, solution, ask
    slices.forEach((slice) => {
      expect(slice.confidence).toBe(0.15); // low-confidence fallback
    });
  });

  it('infers beats using keyword patterns', () => {
    const slices = buildSectionSlices({
      transcript:
        'Our company builds AI tools. The problem is costly manual review. Our solution automates this. The TAM for this market is huge. Our subscription pricing works. Revenue grew 30% this quarter. Our founder has 10 years experience. We are raising a seed round.',
      mode: 'vc_pitch',
    });
    // The keyword-matched slices should have higher confidence
    const problem = slices.find((s) => s.beat === 'problem');
    expect(problem).toBeDefined();
    expect(problem!.text).toContain('costly');
  });

  it('uses segment timestamps when provided', () => {
    const slices = buildSectionSlices({
      transcript: 'The problem is pain. Our solution helps.',
      mode: 'elevator',
      segments: [
        { text: 'The problem is pain.', start: 0, end: 3, words: [] },
        { text: 'Our solution helps.', start: 3, end: 6, words: [] },
      ],
    });
    const problem = slices.find((s) => s.beat === 'problem');
    expect(problem).toBeDefined();
  });

  it('assigns position-based beats when no keywords match', () => {
    const slices = buildSectionSlices({
      transcript:
        'First sentence. Second sentence. Third sentence. Fourth sentence.',
      mode: 'elevator',
    });
    expect(slices.length).toBe(4);
    // Position-based assignments should have confidence 0.45
    const positionBased = slices.filter((s) =>
      s.confidence > 0.4 && s.confidence < 0.5,
    );
    expect(positionBased.length).toBeGreaterThan(0);
  });

  it('ensures slices are sorted by start_sec', () => {
    const slices = buildSectionSlices({
      transcript:
        'We build tools. The problem is data. Our solution works. We are raising now.',
      mode: 'elevator',
    });
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i].start_sec).toBeGreaterThanOrEqual(slices[i - 1].start_sec);
    }
  });
});
