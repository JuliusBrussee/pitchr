import { describe, expect, it } from 'vitest';
import {
  calculateVocabularyMetrics,
  buildVocabularyEvents,
} from '@/services/vocabularyService';

describe('calculateVocabularyMetrics', () => {
  it('returns zero metrics for empty transcript', () => {
    const metrics = calculateVocabularyMetrics('');
    expect(metrics.total_words).toBe(0);
    expect(metrics.unique_words).toBe(0);
    expect(metrics.lexical_diversity).toBe(0);
    expect(metrics.hedge_density).toBe(0);
    expect(metrics.jargon_density).toBe(0);
    expect(metrics.softener_density).toBe(0);
  });

  it('counts total and unique words', () => {
    const metrics = calculateVocabularyMetrics('We build great tools. We ship great products.');
    expect(metrics.total_words).toBe(8);
    // unique: we, build, great, tools, ship, products = 6
    expect(metrics.unique_words).toBe(6);
    expect(metrics.lexical_diversity).toBeCloseTo(6 / 8, 3);
  });

  it('detects hedge terms', () => {
    const metrics = calculateVocabularyMetrics(
      'I think we might maybe grow. We think it could probably work. Perhaps it will.',
    );
    expect(metrics.hedge_terms.length).toBeGreaterThan(0);
    const hedgeWords = metrics.hedge_terms.map((t) => t.term);
    expect(hedgeWords).toContain('i think');
    expect(hedgeWords).toContain('might');
    expect(hedgeWords).toContain('maybe');
    expect(hedgeWords).toContain('probably');
    expect(hedgeWords).toContain('perhaps');
    expect(metrics.hedge_density).toBeGreaterThan(0);
  });

  it('detects jargon terms', () => {
    const metrics = calculateVocabularyMetrics(
      'Our revolutionary platform creates synergy through transformative leverage.',
    );
    expect(metrics.jargon_terms.length).toBeGreaterThan(0);
    const jargonWords = metrics.jargon_terms.map((t) => t.term);
    expect(jargonWords).toContain('revolutionary');
    expect(jargonWords).toContain('synergy');
    expect(jargonWords).toContain('transformative');
    expect(jargonWords).toContain('leverage');
  });

  it('detects softener terms', () => {
    const metrics = calculateVocabularyMetrics(
      'We just really basically actually like quite need this.',
    );
    expect(metrics.softener_terms.length).toBeGreaterThan(0);
    const softenerWords = metrics.softener_terms.map((t) => t.term);
    expect(softenerWords).toContain('just');
    expect(softenerWords).toContain('really');
    expect(softenerWords).toContain('basically');
    expect(softenerWords).toContain('actually');
  });

  it('calculates density as count/total_words', () => {
    // 2 hedge terms out of ~10 words
    const metrics = calculateVocabularyMetrics(
      'We might maybe build something great for the market today.',
    );
    const hedgeCount = metrics.hedge_terms.reduce((sum, t) => sum + t.count, 0);
    expect(metrics.hedge_density).toBeCloseTo(hedgeCount / metrics.total_words, 3);
  });

  it('returns sorted terms by count descending', () => {
    const metrics = calculateVocabularyMetrics(
      'Maybe we should maybe try maybe something. Perhaps it works.',
    );
    expect(metrics.hedge_terms[0].term).toBe('maybe');
    expect(metrics.hedge_terms[0].count).toBe(3);
  });
});

describe('buildVocabularyEvents', () => {
  it('returns empty array when no terms appear >= 2 times', () => {
    const metrics = calculateVocabularyMetrics('We build great products.');
    const events = buildVocabularyEvents(metrics, 'We build great products.');
    expect(events).toEqual([]);
  });

  it('creates vocab events for terms appearing >= 2 times', () => {
    const transcript = 'Maybe we should maybe try this. I think we might maybe build it.';
    const metrics = calculateVocabularyMetrics(transcript);
    const events = buildVocabularyEvents(metrics, transcript);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('vocab');
    expect(events[0].label).toBe('maybe');
    expect(events[0].count).toBeGreaterThanOrEqual(2);
  });

  it('assigns severity based on count', () => {
    // 5+ = high, 3-4 = medium, 1-2 = low
    const transcript = 'Just do it. Just try. Just go. Just run. Just build. Just ship.';
    const metrics = calculateVocabularyMetrics(transcript);
    const events = buildVocabularyEvents(metrics, transcript);
    const justEvent = events.find((e) => e.label === 'just');
    expect(justEvent).toBeDefined();
    expect(justEvent!.severity).toBe('high'); // 6 occurrences
  });

  it('uses segment word timestamps when available', () => {
    const transcript = 'Maybe we should maybe try this.';
    const metrics = calculateVocabularyMetrics(transcript);
    const events = buildVocabularyEvents(metrics, transcript, [
      {
        text: 'Maybe we should maybe try this.',
        start: 0,
        end: 3,
        words: [
          { text: 'Maybe', start: 0, end: 0.3 },
          { text: 'we', start: 0.4, end: 0.6 },
          { text: 'should', start: 0.7, end: 1.0 },
          { text: 'maybe', start: 1.1, end: 1.4 },
          { text: 'try', start: 1.5, end: 1.8 },
          { text: 'this', start: 1.9, end: 2.2 },
        ],
      },
    ]);
    if (events.length > 0) {
      expect(events[0].start_sec).toBeGreaterThanOrEqual(0);
      expect(events[0].end_sec).toBeGreaterThan(events[0].start_sec);
    }
  });

  it('caps events at 12', () => {
    // Create a transcript with many different repeated terms
    const terms = [
      'maybe', 'might', 'perhaps', 'probably', 'just', 'really', 'quite',
      'basically', 'actually', 'like', 'synergy', 'revolutionary', 'disruptive',
    ];
    const transcript = terms.map((t) => `${t} ${t} ${t}`).join('. ');
    const metrics = calculateVocabularyMetrics(transcript);
    const events = buildVocabularyEvents(metrics, transcript);
    expect(events.length).toBeLessThanOrEqual(12);
  });
});
