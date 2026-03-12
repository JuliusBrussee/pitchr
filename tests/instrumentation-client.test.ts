import { describe, expect, it, vi } from 'vitest';

describe('instrumentation client integration', () => {
  it('exports a stable transition hook wrapper that forwards route changes to Sentry', async () => {
    vi.resetModules();
    const captureRouterTransitionStart = vi.fn();

    vi.doMock('@sentry/nextjs', () => ({
      init: () => undefined,
      captureRouterTransitionStart,
    }));

    const mod = await import('../instrumentation-client');
    expect(typeof mod.onRouterTransitionStart).toBe('function');
    expect(mod.onRouterTransitionStart.length).toBe(1);

    mod.onRouterTransitionStart('/session');
    expect(captureRouterTransitionStart).toHaveBeenCalledWith('/session');
  });

  it('provides a no-throw fallback when Sentry transition capture is unavailable', async () => {
    vi.resetModules();

    vi.doMock('@sentry/nextjs', () => ({
      init: () => undefined,
      captureRouterTransitionStart: undefined,
    }));

    const mod = await import('../instrumentation-client');
    expect(typeof mod.onRouterTransitionStart).toBe('function');
    expect(mod.onRouterTransitionStart.length).toBe(1);
    expect(() => mod.onRouterTransitionStart('/dashboard')).not.toThrow();
  });
});
