import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from '@/lib/llm/providers/anthropic';

const ORIGINAL_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ORIGINAL_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL;

describe('anthropic provider', () => {
  afterEach(() => {
    if (ORIGINAL_ANTHROPIC_API_KEY === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC_API_KEY;
    }

    if (ORIGINAL_ANTHROPIC_MODEL === undefined) {
      delete process.env.ANTHROPIC_MODEL;
    } else {
      process.env.ANTHROPIC_MODEL = ORIGINAL_ANTHROPIC_MODEL;
    }

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const provider = new AnthropicProvider();

    await expect(
      provider.complete({
        systemPrompt: 'You are a JSON bot',
        userPrompt: '{"ok":true}',
      }),
    ).rejects.toThrow('Missing ANTHROPIC_API_KEY');
  });

  it('retries once on 429 before succeeding', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    delete process.env.ANTHROPIC_MODEL;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: 'rate limited' } }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: [{ type: 'text', text: '{"result":"ok"}' }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new AnthropicProvider();
    const result = await provider.complete({
      systemPrompt: 'Return JSON only.',
      userPrompt: '{"task":"test"}',
    });

    expect(result).toBe('{"result":"ok"}');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(requestUrl).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body.model).toBe('claude-sonnet-4-6');
  });

  it('returns timeout error after retry attempts are exhausted', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const provider = new AnthropicProvider();

    await expect(
      provider.complete({
        systemPrompt: 'Return JSON only.',
        userPrompt: '{"task":"timeout"}',
        timeoutMs: 5,
      }),
    ).rejects.toThrow('Anthropic request timed out');
  });
});
