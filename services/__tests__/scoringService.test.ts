import { describe, expect, it } from 'vitest';
import {
  calculateDeliveryMetrics,
  calculateCompositeScore,
  calculatePenalty,
  extractDeliveryEvents,
} from '@/services/scoringService';
import type { AntiPatternHit, RubricScore } from '@/types/analysis-v2';

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function makeRubric(scores: Record<string, number>): RubricScore[] {
  return Object.entries(scores).map(([category, score]) => ({
    category: category as RubricScore['category'],
    score,
    max_score: 20,
    rationale: `test ${category}`,
  }));
}

function makeAntiPattern(
  label: string,
  hit: boolean,
  weight = 2,
  penalty = 1,
): AntiPatternHit {
  return { id: `ap-${label}`, label, hit, weight, evidence: `${label} detected`, penalty };
}

// ---------------------------------------------------------------------------
// calculateDeliveryMetrics
// ---------------------------------------------------------------------------

describe('calculateDeliveryMetrics', () => {
  it('returns zero-safe metrics for an empty transcript', () => {
    const metrics = calculateDeliveryMetrics('', 'vc_pitch');
    expect(metrics.word_count).toBe(0);
    expect(metrics.wpm).toBe(0);
    expect(metrics.filler_count).toBe(0);
    expect(metrics.delivery20).toBeGreaterThanOrEqual(0);
    expect(metrics.delivery20).toBeLessThanOrEqual(20);
  });

  it('counts words correctly', () => {
    const transcript = 'We are building a great product for founders everywhere today.';
    const metrics = calculateDeliveryMetrics(transcript, 'elevator');
    expect(metrics.word_count).toBe(10);
  });

  it('detects filler words: um, uh, like, basically, actually', () => {
    const transcript = 'Um we are like basically actually building um a platform uh for uh teams.';
    const metrics = calculateDeliveryMetrics(transcript, 'elevator');
    expect(metrics.filler_count).toBeGreaterThanOrEqual(6);
    expect(metrics.filler_words.length).toBeGreaterThanOrEqual(4);
    const fillerNames = metrics.filler_words.map((f) => f.word);
    expect(fillerNames).toContain('um');
    expect(fillerNames).toContain('uh');
    expect(fillerNames).toContain('like');
    expect(fillerNames).toContain('basically');
  });

  it('detects multi-word filler phrases: you know, sort of, kind of', () => {
    const transcript = 'You know we sort of kind of just try to you know ship fast.';
    const metrics = calculateDeliveryMetrics(transcript, 'elevator');
    const fillerNames = metrics.filler_words.map((f) => f.word);
    expect(fillerNames).toContain('you know');
    expect(fillerNames).toContain('sort of');
    expect(fillerNames).toContain('kind of');
  });

  it('detects repeated n-gram phrases', () => {
    const transcript =
      'We build software. We build software for teams. Teams love our product. Teams love the result.';
    const metrics = calculateDeliveryMetrics(transcript, 'vc_pitch');
    expect(metrics.repeated_phrases.length).toBeGreaterThan(0);
    expect(metrics.repeated_ngram_tokens).toBeGreaterThan(0);
    expect(metrics.repeat_rate).toBeGreaterThan(0);
  });

  it('calculates WPM based on transcript length and estimated duration', () => {
    // 140-word transcript should produce duration ~60s and WPM ~140
    const words = Array.from({ length: 140 }, (_, i) => `word${i}`).join(' ');
    const metrics = calculateDeliveryMetrics(words, 'vc_pitch');
    expect(metrics.wpm).toBeCloseTo(140, -1);
    expect(metrics.duration_seconds).toBeCloseTo(60, -1);
  });

  it('uses explicit durationSeconds when provided', () => {
    const metrics = calculateDeliveryMetrics({
      transcript: 'We are building a great product for founders.',
      mode: 'elevator',
      durationSeconds: 30,
    });
    expect(metrics.duration_seconds).toBe(30);
    // 8 words in 30 seconds = 16 WPM
    expect(metrics.wpm).toBe(16);
  });

  it('uses segment timestamps to determine duration', () => {
    const metrics = calculateDeliveryMetrics({
      transcript: 'Hello world this is a test.',
      mode: 'elevator',
      segments: [
        { text: 'Hello world this is a test.', start: 0, end: 10, words: [] },
      ],
    });
    expect(metrics.duration_seconds).toBe(10);
  });

  it('reports within_time_limit correctly for elevator mode', () => {
    // elevator: min=30, max=45
    const inRange = calculateDeliveryMetrics({
      transcript: 'Some pitch content.',
      mode: 'elevator',
      durationSeconds: 38,
    });
    expect(inRange.within_time_limit).toBe(true);

    const tooShort = calculateDeliveryMetrics({
      transcript: 'Some pitch content.',
      mode: 'elevator',
      durationSeconds: 20,
    });
    expect(tooShort.within_time_limit).toBe(false);

    const tooLong = calculateDeliveryMetrics({
      transcript: 'Some pitch content.',
      mode: 'elevator',
      durationSeconds: 60,
    });
    expect(tooLong.within_time_limit).toBe(false);
  });

  it('scores pace component higher when WPM is near target', () => {
    // elevator target = 150 WPM, 150 words in 60s = 150 WPM
    const nearTarget = calculateDeliveryMetrics({
      transcript: Array.from({ length: 150 }, (_, i) => `word${i}`).join(' '),
      mode: 'elevator',
      durationSeconds: 60,
    });
    expect(nearTarget.pace_score_component).toBeGreaterThan(0.7);

    // Far from target: 50 words in 60s = 50 WPM (target 150)
    const farFromTarget = calculateDeliveryMetrics({
      transcript: Array.from({ length: 50 }, (_, i) => `word${i}`).join(' '),
      mode: 'elevator',
      durationSeconds: 60,
    });
    expect(farFromTarget.pace_score_component).toBeLessThan(0.1);
  });

  it('filler_score_component degrades with higher filler rate', () => {
    const clean = calculateDeliveryMetrics('We build great products for enterprise clients today.', 'vc_pitch');
    const dirty = calculateDeliveryMetrics(
      'Um we uh like basically actually um sort of kind of uh build um products.',
      'vc_pitch',
    );
    expect(clean.filler_score_component).toBeGreaterThan(dirty.filler_score_component);
  });

  it('delivery20 is bounded between 0 and 20', () => {
    const metrics = calculateDeliveryMetrics('Hello.', 'elevator');
    expect(metrics.delivery20).toBeGreaterThanOrEqual(0);
    expect(metrics.delivery20).toBeLessThanOrEqual(20);
  });

  it('handles string-only overload', () => {
    const metrics = calculateDeliveryMetrics('Test transcript for pitch.', 'elevator');
    expect(metrics.target_wpm).toBe(150); // elevator target
  });

  it('handles object overload defaulting to vc_pitch', () => {
    const metrics = calculateDeliveryMetrics('Test transcript for pitch.');
    expect(metrics.target_wpm).toBe(140); // vc_pitch default
  });
});

// ---------------------------------------------------------------------------
// extractDeliveryEvents
// ---------------------------------------------------------------------------

describe('extractDeliveryEvents', () => {
  it('returns empty array for empty transcript', () => {
    const events = extractDeliveryEvents({ transcript: '', mode: 'vc_pitch' });
    expect(events).toEqual([]);
  });

  it('detects single filler words with timestamps', () => {
    const events = extractDeliveryEvents({
      transcript: 'We um build things.',
      mode: 'elevator',
      segments: [
        {
          text: 'We um build things.',
          start: 0,
          end: 3,
          words: [
            { text: 'We', start: 0, end: 0.3 },
            { text: 'um', start: 0.4, end: 0.6 },
            { text: 'build', start: 0.7, end: 1.0 },
            { text: 'things', start: 1.1, end: 1.5 },
          ],
        },
      ],
    });
    const fillers = events.filter((e) => e.type === 'filler');
    expect(fillers.length).toBeGreaterThanOrEqual(1);
    expect(fillers[0].label).toBe('um');
    expect(fillers[0].start_sec).toBeCloseTo(0.4, 2);
  });

  it('detects stutter (repeated adjacent word)', () => {
    const events = extractDeliveryEvents({
      transcript: 'We we build.',
      mode: 'elevator',
      segments: [
        {
          text: 'We we build.',
          start: 0,
          end: 2,
          words: [
            { text: 'We', start: 0, end: 0.2 },
            { text: 'we', start: 0.25, end: 0.4 },
            { text: 'build', start: 0.5, end: 1.0 },
          ],
        },
      ],
    });
    const stutters = events.filter((e) => e.type === 'stutter');
    expect(stutters.length).toBe(1);
    expect(stutters[0].label).toBe('we');
  });

  it('detects hesitation (long pause between words)', () => {
    const events = extractDeliveryEvents({
      transcript: 'We build things.',
      mode: 'elevator',
      segments: [
        {
          text: 'We build things.',
          start: 0,
          end: 5,
          words: [
            { text: 'We', start: 0, end: 0.3 },
            { text: 'build', start: 2.0, end: 2.5 },
            { text: 'things', start: 2.6, end: 3.0 },
          ],
        },
      ],
    });
    const hesitations = events.filter((e) => e.type === 'hesitation');
    expect(hesitations.length).toBe(1);
    expect(hesitations[0].severity).toBe('medium'); // 2.0 - 0.3 = 1.7s gap, >= 1.2 but < 1.8
  });

  it('detects repetition (repeated bigrams)', () => {
    const events = extractDeliveryEvents({
      transcript: 'we build great things. we build awesome products.',
      mode: 'vc_pitch',
    });
    const repetitions = events.filter((e) => e.type === 'repetition');
    expect(repetitions.length).toBeGreaterThanOrEqual(1);
    expect(repetitions[0].label).toBe('we build');
  });

  it('caps events at 60', () => {
    // Generate a very long transcript with lots of fillers
    const words = Array.from({ length: 200 }, (_, i) => (i % 3 === 0 ? 'um' : `word${i}`));
    const events = extractDeliveryEvents({
      transcript: words.join(' '),
      mode: 'vc_pitch',
    });
    expect(events.length).toBeLessThanOrEqual(60);
  });

  it('uses synthetic words when no segments provided', () => {
    const events = extractDeliveryEvents({
      transcript: 'Um we um build um things um again.',
      mode: 'elevator',
    });
    const fillers = events.filter((e) => e.type === 'filler');
    expect(fillers.length).toBeGreaterThan(0);
    // Synthetic words should have start_sec values
    expect(fillers[0].start_sec).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// calculatePenalty
// ---------------------------------------------------------------------------

describe('calculatePenalty', () => {
  it('returns 0 when no anti-patterns hit', () => {
    const penalty = calculatePenalty([
      makeAntiPattern('no_proof', false),
      makeAntiPattern('no_ask', false),
    ]);
    expect(penalty).toBe(0);
  });

  it('sums penalty from hit anti-patterns', () => {
    const penalty = calculatePenalty([
      makeAntiPattern('no_proof', true, 2, 1),  // 2 * 1 = 2
      makeAntiPattern('no_ask', true, 3, 1),    // 3 * 1 = 3
    ]);
    expect(penalty).toBe(5);
  });

  it('caps penalty at 12', () => {
    const penalty = calculatePenalty([
      makeAntiPattern('a', true, 5, 2),  // 10
      makeAntiPattern('b', true, 5, 2),  // 10
    ]);
    expect(penalty).toBe(12);
  });

  it('ignores anti-patterns where hit is false', () => {
    const penalty = calculatePenalty([
      makeAntiPattern('no_proof', true, 3, 1),
      makeAntiPattern('no_ask', false, 5, 2),
    ]);
    expect(penalty).toBe(3);
  });

  it('uses penalty field from anti-pattern hit', () => {
    const hit: AntiPatternHit = {
      id: 'ap-1',
      label: 'test',
      hit: true,
      weight: 4,
      evidence: 'detected',
      penalty: 2,
    };
    const penalty = calculatePenalty([hit]);
    expect(penalty).toBe(8); // weight * max(0, penalty) = 4 * 2
  });
});

// ---------------------------------------------------------------------------
// calculateCompositeScore
// ---------------------------------------------------------------------------

describe('calculateCompositeScore', () => {
  it('calculates spoken-only score correctly', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({
        structure: 15,
        clarity: 14,
        evidence: 12,
        market: 10,
      }),
      deckRubric: [],
      delivery20: 16,
      antiPatternHits: [],
      hasDeck: false,
    });
    // spoken100 = 15 + 14 + 12 + 10 + 16 = 67
    expect(result.spoken100).toBe(67);
    expect(result.deck100).toBeNull();
    expect(result.coverage).toBe('spoken_only');
    expect(result.penalty).toBe(0);
    expect(result.finalScore).toBe(67);
  });

  it('blends spoken and deck scores with 65/35 weighting', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({
        structure: 20,
        clarity: 20,
        evidence: 20,
        market: 20,
      }),
      deckRubric: makeRubric({
        deck_narrative: 10,
        deck_clarity: 10,
        deck_evidence: 10,
        deck_design: 10,
        deck_ask: 10,
      }),
      delivery20: 20,
      antiPatternHits: [],
      hasDeck: true,
    });
    // spoken100 = 80 + 20 = 100, deck100 = 50
    expect(result.spoken100).toBe(100);
    expect(result.deck100).toBe(50);
    expect(result.coverage).toBe('spoken+deck');
    // overallBeforePenalty = 0.65 * 100 + 0.35 * 50 = 82.5 -> rounded 83
    expect(result.overallBeforePenalty).toBe(83);
    expect(result.finalScore).toBe(83);
  });

  it('applies penalty and floors at 0', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({
        structure: 2,
        clarity: 2,
        evidence: 2,
        market: 2,
      }),
      deckRubric: [],
      delivery20: 2,
      antiPatternHits: [
        makeAntiPattern('a', true, 6, 2), // capped at 12
      ],
      hasDeck: false,
    });
    // spoken100 = 8 + 2 = 10, penalty = 12, final = max(0, 10 - 12) = 0
    expect(result.spoken100).toBe(10);
    expect(result.penalty).toBe(12);
    expect(result.finalScore).toBe(0);
  });

  it('clamps spoken100 between 0 and 100', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({
        structure: 20,
        clarity: 20,
        evidence: 20,
        market: 20,
      }),
      deckRubric: [],
      delivery20: 20,
      antiPatternHits: [],
      hasDeck: false,
    });
    expect(result.spoken100).toBe(100);
  });

  it('clamps deck100 between 0 and 100', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({ structure: 20, clarity: 20, evidence: 20, market: 20 }),
      deckRubric: makeRubric({
        deck_narrative: 20,
        deck_clarity: 20,
        deck_evidence: 20,
        deck_design: 20,
        deck_ask: 20,
      }),
      delivery20: 20,
      antiPatternHits: [],
      hasDeck: true,
    });
    expect(result.deck100).toBe(100);
  });

  it('handles all-zero rubric scores', () => {
    const result = calculateCompositeScore({
      spokenRubric: makeRubric({ structure: 0, clarity: 0, evidence: 0, market: 0 }),
      deckRubric: [],
      delivery20: 0,
      antiPatternHits: [],
      hasDeck: false,
    });
    expect(result.spoken100).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});
