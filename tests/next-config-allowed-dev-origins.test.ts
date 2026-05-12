import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (config: unknown) => config,
}));

describe('next config', () => {
  it('allows local development origins used by local tooling', async () => {
    vi.resetModules();
    const mod = await import('../next.config');
    const config = mod.default as { allowedDevOrigins?: string[] };

    expect(config.allowedDevOrigins).toEqual(
      expect.arrayContaining([
        'localhost',
        '127.0.0.1',
        'localhost:3001',
        '127.0.0.1:3001',
      ]),
    );
  });
});
