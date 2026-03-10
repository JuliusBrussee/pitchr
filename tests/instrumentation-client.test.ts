import { describe, expect, it } from 'vitest';

describe('instrumentation client integration', () => {
  it('exports onRouterTransitionStart for Next.js router tracing hooks', async () => {
    const mod = await import('../instrumentation-client');
    expect(typeof mod.onRouterTransitionStart).toBe('function');
  });
});
