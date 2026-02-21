import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterProvider } from '@/lib/llm/providers/openrouter';

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('OpenRouterProvider retry behavior', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.6';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('does not retry non-retryable 4xx responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { error: { message: 'bad request' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider();
    await expect(
      provider.complete({
        systemPrompt: 'system',
        userPrompt: 'user',
        responseFormat: 'json',
      }),
    ).rejects.toThrow('bad request');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries retryable 5xx responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, { error: { message: 'server error' } }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider();
    const output = await provider.complete({
      systemPrompt: 'system',
      userPrompt: 'user',
      responseFormat: 'json',
    });

    expect(output).toBe('{"ok":true}');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries transient network errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          choices: [{ message: { content: 'done' } }],
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenRouterProvider();
    const output = await provider.complete({
      systemPrompt: 'system',
      userPrompt: 'user',
      maxAttempts: 2,
    });

    expect(output).toBe('done');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
