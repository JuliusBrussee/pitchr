import { describe, expect, it } from 'vitest';
import {
  buildLayeredSystemPrompt,
  RUBRIC_CONTEXT_MAX_CHARS,
  RUBRIC_CONTEXT_METADATA_KEY,
  getRubricContextCharacterCount,
  resolveRunRubricContext,
  validateRubricContextForSave,
  withRubricContextPromptMetadata,
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

  it('stamps prompt overrides with persisted rubric metadata', () => {
    const result = withRubricContextPromptMetadata(
      { analysis_system_prompt: 'Focus on evidence.' },
      'user-123',
      '2026-03-06T10:00:00.000Z',
    );

    expect(result[RUBRIC_CONTEXT_METADATA_KEY]).toEqual({
      updated_at: '2026-03-06T10:00:00.000Z',
      updated_by: 'user-123',
    });
  });

  it('resolves valid project rubric context for run-time layering', () => {
    const result = resolveRunRubricContext({
      analysis_system_prompt: '  Weight proof and milestone risk.  ',
      analysis_system_prompt_meta: {
        updated_at: '2026-03-06T10:00:00.000Z',
        updated_by: 'user-123',
      },
    });

    expect(result.systemPromptOverride).toBe('Weight proof and milestone risk.');
    expect(result.metadata.applied).toBe(true);
    expect(result.metadata.source).toBe('project_prompt_overrides');
    expect(result.metadata.project_updated_by).toBe('user-123');
    expect(result.metadata.hash).toMatch(/^djb2-/);
  });

  it('falls back to default rubric when saved project context is invalid at run time', () => {
    const result = resolveRunRubricContext({
      analysis_system_prompt: '   ',
      analysis_system_prompt_meta: {
        updated_at: '2026-03-06T10:00:00.000Z',
        updated_by: 'user-123',
      },
    });

    expect(result.systemPromptOverride).toBeUndefined();
    expect(result.metadata.applied).toBe(false);
    expect(result.metadata.fallback_used).toBe(true);
    expect(result.metadata.fallback_reason).toContain('required');
  });

  it('builds a layered system prompt containing both baseline and project context', () => {
    const layered = buildLayeredSystemPrompt(
      'Baseline rubric.',
      'Focus on regulatory readiness.',
    );

    expect(layered).toContain('Baseline rubric.');
    expect(layered).toContain('Focus on regulatory readiness.');
    expect(layered).toContain('Layering rules:');
  });
});
