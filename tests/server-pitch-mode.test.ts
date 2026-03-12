import { describe, expect, it } from 'vitest';

// The isPitchMode function is defined inline in server.ts.
// We replicate it here for unit testing since it's not exported.
type PitchMode = 'elevator' | 'vc_pitch' | 'hackathon' | 'final_year';

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch' || value === 'hackathon' || value === 'final_year';
}

describe('isPitchMode', () => {
  it.each(['elevator', 'vc_pitch', 'hackathon', 'final_year'] as const)(
    'returns true for valid mode "%s"',
    (mode) => {
      expect(isPitchMode(mode)).toBe(true);
    },
  );

  it.each([
    'invalid',
    '',
    null,
    undefined,
    42,
    true,
    'ELEVATOR',
    'vc-pitch',
    'hack',
  ])('returns false for invalid value %j', (value) => {
    expect(isPitchMode(value)).toBe(false);
  });
});
