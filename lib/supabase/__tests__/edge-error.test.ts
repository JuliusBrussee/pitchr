import { describe, expect, it } from 'vitest';
import { getEdgeErrorMessage } from '@/lib/supabase/edge-error';

describe('getEdgeErrorMessage', () => {
  it('prefers explicit error payload messages', () => {
    const message = getEdgeErrorMessage(
      { error: 'Failed to create project: duplicate key' },
      'Failed to create project.',
    );

    expect(message).toBe('Failed to create project: duplicate key');
  });

  it('falls back to relay message payloads', () => {
    const message = getEdgeErrorMessage(
      { code: 401, message: 'Invalid JWT' },
      'Failed to load projects.',
    );

    expect(message).toBe('Invalid JWT');
  });

  it('returns fallback when payload has no usable message', () => {
    const message = getEdgeErrorMessage(
      { code: 500, details: { context: 'edge relay' } },
      'Failed to load projects.',
    );

    expect(message).toBe('Failed to load projects.');
  });
});
