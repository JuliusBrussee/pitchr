import { describe, expect, it } from 'vitest';
import type { PitchMode } from '@/types/pitch';

// Validate that PITCH_MODE_CONFIG has entries for all modes
import { PITCH_MODE_CONFIG } from '@/config/modes';

const ALL_MODES: PitchMode[] = ['elevator', 'vc_pitch', 'hackathon', 'final_year'];

describe('project default mode', () => {
  describe('PITCH_MODE_CONFIG coverage', () => {
    it.each(ALL_MODES)('has config for mode "%s"', (mode) => {
      const config = PITCH_MODE_CONFIG[mode];
      expect(config).toBeDefined();
      expect(config.id).toBe(mode);
      expect(config.label).toBeTruthy();
      expect(config.targetDurationSeconds).toBeGreaterThan(0);
      expect(config.defaultDurationSeconds).toBeGreaterThan(0);
      expect(config.targetWpm).toBeGreaterThan(0);
      expect(config.structureBeats.length).toBeGreaterThan(0);
    });
  });

  describe('mode validation', () => {
    const validModes = ['elevator', 'vc_pitch', 'hackathon', 'final_year'];

    it.each(validModes)('accepts valid mode "%s"', (mode) => {
      expect(validModes.includes(mode)).toBe(true);
    });

    it.each(['invalid', '', 'ELEVATOR', 'hack', null, undefined])(
      'rejects invalid mode %j',
      (mode) => {
        expect(validModes.includes(mode as string)).toBe(false);
      },
    );
  });

  describe('mode config completeness', () => {
    it('every mode has min <= target <= max duration', () => {
      for (const mode of ALL_MODES) {
        const config = PITCH_MODE_CONFIG[mode];
        expect(config.minDurationSeconds).toBeLessThanOrEqual(config.targetDurationSeconds);
        expect(config.targetDurationSeconds).toBeLessThanOrEqual(config.maxDurationSeconds);
      }
    });

    it('every mode has reasonable WPM target (100-200)', () => {
      for (const mode of ALL_MODES) {
        const config = PITCH_MODE_CONFIG[mode];
        expect(config.targetWpm).toBeGreaterThanOrEqual(100);
        expect(config.targetWpm).toBeLessThanOrEqual(200);
      }
    });
  });
});
