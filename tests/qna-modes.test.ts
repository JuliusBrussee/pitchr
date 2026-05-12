import { describe, expect, it } from 'vitest';
import { PITCH_MODE_CONFIG } from '@/config/modes';
import type { PitchMode } from '@/types/pitch';

const ALL_MODES: PitchMode[] = ['elevator', 'vc_pitch', 'hackathon', 'final_year'];

describe('Q&A mode support', () => {
  it.each(ALL_MODES)('mode "%s" has structure beats for Q&A context', (mode) => {
    const config = PITCH_MODE_CONFIG[mode];
    expect(config.structureBeats.length).toBeGreaterThanOrEqual(3);
    // All modes should have some form of conclusion beat
    const hasConclusion = config.structureBeats.some(
      (beat) => /ask|next steps|impact/i.test(beat),
    );
    expect(hasConclusion).toBe(true);
  });

  it.each(ALL_MODES)('mode "%s" duration config is valid for Q&A timing', (mode) => {
    const config = PITCH_MODE_CONFIG[mode];
    // Q&A should start after the pitch, so target duration must be > 0
    expect(config.targetDurationSeconds).toBeGreaterThan(0);
    // Ensure default duration is within valid slider range
    expect(config.defaultDurationSeconds).toBeGreaterThanOrEqual(config.minDurationSeconds);
  });
});
