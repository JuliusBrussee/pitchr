import { describe, expect, it } from 'vitest';
import { getTargetWordCount } from '@/config/modes';
import { buildRewritePrompt } from '@/lib/prompts/rewrite';
import type { PitchMode } from '@/types/pitch';

describe('getTargetWordCount', () => {
  it('returns mode-specific word count from duration and WPM', () => {
    expect(getTargetWordCount('elevator')).toBe(83); // ceil(30 * 165 / 60)
    expect(getTargetWordCount('vc_pitch')).toBe(280); // ceil(120 * 140 / 60)
    expect(getTargetWordCount('hackathon')).toBe(450); // ceil(180 * 150 / 60)
    expect(getTargetWordCount('final_year')).toBe(520); // ceil(240 * 130 / 60)
  });

  it('clamps to min/max bounds', () => {
    // Modes are within 50–550; if a future mode had tiny/large config we'd see clamp
    const elevator = getTargetWordCount('elevator');
    const finalYear = getTargetWordCount('final_year');
    expect(elevator).toBeGreaterThanOrEqual(50);
    expect(finalYear).toBeLessThanOrEqual(550);
  });
});

describe('buildRewritePrompt', () => {
  it('includes mode-specific word limit in the prompt', () => {
    const elevator = buildRewritePrompt({
      mode: 'elevator',
      transcript: 'We build X.',
      topFixes: [],
    });
    expect(elevator).toContain('Keep the rewrite under 83 words.');

    const vc = buildRewritePrompt({
      mode: 'vc_pitch',
      transcript: 'We build X.',
      topFixes: [],
    });
    expect(vc).toContain('Keep the rewrite under 280 words.');
  });

  it('includes mode label, duration, WPM, and structure beats', () => {
    const prompt = buildRewritePrompt({
      mode: 'vc_pitch',
      transcript: 'Our startup does Y.',
      topFixes: [],
    });
    expect(prompt).toContain('VC Pitch');
    expect(prompt).toContain('120 seconds');
    expect(prompt).toContain('140 WPM');
    expect(prompt).toContain('Problem -> Solution -> Why Now -> Traction -> Market -> Ask');
    expect(prompt).toContain('Our startup does Y.');
  });

  it('includes research principles and spoken-language instruction', () => {
    const prompt = buildRewritePrompt({
      mode: 'elevator',
      transcript: 'Hi.',
      topFixes: [],
    });
    expect(prompt).toContain('Apply every listed fix');
    expect(prompt).toContain("Preserve the speaker's voice");
    expect(prompt).toContain('No markdown, no JSON, no explanation');
  });

  it('lists top fixes when provided', () => {
    const prompt = buildRewritePrompt({
      mode: 'elevator',
      transcript: 'Pitch here.',
      topFixes: [
        {
          rank: 1,
          category: 'evidence',
          issue: 'No metrics',
          fix: 'Add ARR',
          impact: 'high',
        },
      ],
    });
    expect(prompt).toContain('No metrics');
    expect(prompt).toContain('Add ARR');
    expect(prompt).toContain('[evidence]');
  });

  it('uses "None provided" when topFixes is empty', () => {
    const prompt = buildRewritePrompt({
      mode: 'elevator',
      transcript: 'Pitch.',
      topFixes: [],
    });
    expect(prompt).toContain('None provided');
  });
});
