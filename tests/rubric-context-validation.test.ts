import { describe, expect, it } from 'vitest';
import {
  RUBRIC_CONTEXT_MAX_CHARS,
  getRubricContextCharacterCount,
  validateRubricContextForSave,
} from '@/supabase/functions/_shared/rubric-context';

describe('rubric context validation', () => {
  it('Whitespace-only values fail as required input', () => {
    const result = validateRubricContextForSave('   ');

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('required');
    }
  });

  it('Values above 4,000 characters fail with max-length guidance', () => {
    const result = validateRubricContextForSave('a'.repeat(RUBRIC_CONTEXT_MAX_CHARS + 1));

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('4,000');
    }
  });

  it('Valid values within limit are trimmed and returned for persistence', () => {
    const result = validateRubricContextForSave('  Focus on startup economics.  ');

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe('Focus on startup economics.');
    }
  });

  it('Character counter helper returns current and max values for UI display', () => {
    expect(getRubricContextCharacterCount('abc')).toEqual({
      current: 3,
      max: RUBRIC_CONTEXT_MAX_CHARS,
    });
  });
});
