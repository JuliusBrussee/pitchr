export const RUBRIC_CONTEXT_MAX_CHARS = 4000;
export const RUBRIC_CONTEXT_METADATA_KEY = 'analysis_system_prompt_meta';

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

export interface RubricContextPromptMetadata {
  updated_at: string;
  updated_by: string;
}

export interface RubricContextRunMetadata {
  applied: boolean;
  source: 'project_prompt_overrides' | 'default_rubric';
  chars: number;
  hash?: string;
  project_updated_at?: string;
  project_updated_by?: string;
  fallback_used: boolean;
  fallback_reason?: string;
}

export interface ResolvedRunRubricContext {
  systemPromptOverride?: string;
  metadata: RubricContextRunMetadata;
}

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hashRubricContext(value: string): string {
  // Deterministic lightweight hash for run metadata reference display.
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return `djb2-${(hash >>> 0).toString(16)}`;
}

export function readRubricContextPromptMetadata(
  promptOverrides: Record<string, unknown> | null | undefined,
): RubricContextPromptMetadata | null {
  const metadataValue = promptOverrides?.[RUBRIC_CONTEXT_METADATA_KEY];
  const metadata = asRecord(metadataValue);
  if (!metadata) {
    return null;
  }

  const updatedAt = typeof metadata.updated_at === 'string' ? metadata.updated_at : null;
  const updatedBy = typeof metadata.updated_by === 'string' ? metadata.updated_by : null;
  if (!updatedAt || !updatedBy) {
    return null;
  }

  return {
    updated_at: updatedAt,
    updated_by: updatedBy,
  };
}

export function withRubricContextPromptMetadata(
  promptOverrides: Record<string, unknown>,
  updatedBy: string,
  nowIso = new Date().toISOString(),
): Record<string, unknown> {
  return {
    ...promptOverrides,
    [RUBRIC_CONTEXT_METADATA_KEY]: {
      updated_at: nowIso,
      updated_by: updatedBy,
    },
  };
}

export function resolveRunRubricContext(
  promptOverridesValue: unknown,
  opts?: { projectUpdatedAt?: string | null },
): ResolvedRunRubricContext {
  const promptOverrides = asRecord(promptOverridesValue);
  const promptMetadata = readRubricContextPromptMetadata(promptOverrides);
  const projectUpdatedAt = promptMetadata?.updated_at ?? opts?.projectUpdatedAt ?? undefined;
  const projectUpdatedBy = promptMetadata?.updated_by;
  const rawContext = promptOverrides?.analysis_system_prompt;

  if (rawContext === undefined) {
    return {
      metadata: {
        applied: false,
        source: 'default_rubric',
        chars: 0,
        project_updated_at: projectUpdatedAt,
        project_updated_by: projectUpdatedBy,
        fallback_used: false,
      },
    };
  }

  const validation = validateRubricContextForSave(rawContext);
  if (!validation.valid) {
    return {
      metadata: {
        applied: false,
        source: 'default_rubric',
        chars: 0,
        project_updated_at: projectUpdatedAt,
        project_updated_by: projectUpdatedBy,
        fallback_used: true,
        fallback_reason: validation.error,
      },
    };
  }

  return {
    systemPromptOverride: validation.value,
    metadata: {
      applied: true,
      source: 'project_prompt_overrides',
      chars: validation.value.length,
      hash: hashRubricContext(validation.value),
      project_updated_at: projectUpdatedAt,
      project_updated_by: projectUpdatedBy,
      fallback_used: false,
    },
  };
}

export function buildLayeredSystemPrompt(
  defaultSystemPrompt: string,
  projectRubricContext: string,
): string {
  return [
    defaultSystemPrompt.trim(),
    '',
    'Project-Specific Rubric Context (layered on top of the default rubric):',
    projectRubricContext.trim(),
    '',
    'Layering rules:',
    '- Keep the default rubric categories and scoring baseline.',
    '- Use project context to refine emphasis, examples, and critique priority.',
    '- When context conflicts with baseline style, preserve scoring consistency and note tradeoffs in rationale.',
  ].join('\n');
}
