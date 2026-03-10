import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  init: () => undefined,
  captureRouterTransitionStart: () => undefined,
}));

describe('instrumentation client integration', () => {
  it('exports onRouterTransitionStart for Next.js router tracing hooks', async () => {
    const mod = await import('../instrumentation-client');
    expect(typeof mod.onRouterTransitionStart).toBe('function');
  });
});
