import { describe, expect, it } from 'vitest';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import {
  buildSectionFeedback,
  resolveSectionFeedbackForDisplay,
} from '@/services/sectionFeedbackService';
import { buildSectionSlices } from '@/services/sectioningService';

describe('resolveSectionFeedbackForDisplay', () => {
  it('returns existing section feedback when provided', () => {
    const feedback = SAMPLE_RESULT.outputs.feedback;
    const existing = buildSectionFeedback(
      buildSectionSlices({
        transcript:
          'We are building Pitchr. The problem is generic feedback. Our solution gives ranked fixes. We are raising $1M.',
        mode: 'elevator',
      }),
      feedback,
    );

    const resolved = resolveSectionFeedbackForDisplay({
      sections: existing,
      transcript: 'ignored transcript',
      mode: 'elevator',
      feedback,
    });

    expect(resolved).toBe(existing);
    expect(resolved.length).toBeGreaterThan(0);
  });

  it('builds deterministic fallback sections when section feedback is missing', () => {
    const feedback = SAMPLE_RESULT.outputs.feedback;
    const transcript =
      'My name is Alice and we are building Pitchr. Founders lose deals because feedback is vague and slow. ' +
      'Our product scores pitches and outputs top fixes in minutes. We are raising a seed round to scale this.';

    const resolved = resolveSectionFeedbackForDisplay({
      sections: undefined,
      transcript,
      mode: 'elevator',
      feedback,
    });

    expect(resolved.length).toBe(4);
    expect(new Set(resolved.map((section) => section.beat))).toEqual(
      new Set(['intro', 'problem', 'solution', 'ask']),
    );
  });
});
