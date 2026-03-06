export const RUBRIC_CONTEXT_MAX_CHARS = 4000;

export interface RubricContextCharacterCount {
  current: number;
  max: number;
}

export type RubricContextValidationResult =
  | {
    valid: true;
    value: string;
  }
  | {
    valid: false;
    error: string;
  };

export function getRubricContextCharacterCount(value: unknown): RubricContextCharacterCount {
  const current = typeof value === 'string' ? value.length : 0;
  return {
    current,
    max: RUBRIC_CONTEXT_MAX_CHARS,
  };
}

export function validateRubricContextForSave(value: unknown): RubricContextValidationResult {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: 'analysis_system_prompt is required.',
    };
  }

  const normalized = value.trim();
  if (!normalized) {
    return {
      valid: false,
      error: 'analysis_system_prompt is required.',
    };
  }

  const count = getRubricContextCharacterCount(normalized);
  if (count.current > count.max) {
    return {
      valid: false,
      error: `analysis_system_prompt must be ${count.max.toLocaleString('en-US')} characters or fewer.`,
    };
  }

  return {
    valid: true,
    value: normalized,
  };
}
