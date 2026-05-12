import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryState = vi.hoisted(() => ({
  captureRouterTransitionStart:
    undefined as undefined | ((...args: unknown[]) => unknown),
}));

vi.mock('@sentry/nextjs', () => ({
  init: () => undefined,
  get captureRouterTransitionStart() {
    return sentryState.captureRouterTransitionStart;
  },
}));

describe('instrumentation client integration', () => {
  beforeEach(() => {
    vi.resetModules();
    sentryState.captureRouterTransitionStart = undefined;
  });

  it('exports onRouterTransitionStart for Next.js router tracing hooks', async () => {
    const mod = await import('../instrumentation-client');
    expect(typeof mod.onRouterTransitionStart).toBe('function');
  });

  it('reads captureRouterTransitionStart at call time', async () => {
    const mod = await import('../instrumentation-client');
    const captureRouterTransitionStart = vi.fn(() => 'ok');

    sentryState.captureRouterTransitionStart = captureRouterTransitionStart;
    const result = mod.onRouterTransitionStart('/dashboard');

    expect(captureRouterTransitionStart).toHaveBeenCalledWith('/dashboard');
    expect(result).toBe('ok');
  });
});
