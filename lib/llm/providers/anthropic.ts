import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_MAX_ATTEMPTS = 2;

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
}

export class AnthropicProvider implements LlmProvider {
  async complete(request: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'Missing ANTHROPIC_API_KEY. Keep LLM_PROVIDER=openrouter until Anthropic is configured.',
      );
    }

    const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
    const maxAttempts = Math.max(1, request.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      try {
        const response = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            temperature: request.temperature ?? 0.3,
            max_tokens: request.maxTokens ?? 4096,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
          }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as AnthropicResponse;
        if (!response.ok) {
          const message =
            payload.error?.message ??
            `Anthropic request failed with status ${response.status}`;
          if (attempt < maxAttempts && (response.status === 429 || response.status >= 500)) {
            continue;
          }
          throw new Error(message);
        }

        const text = payload.content
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text ?? '')
          .join('')
          .trim();

        if (!text) {
          throw new Error('Anthropic returned an empty completion');
        }
        return text;
      } catch (error) {
        if (attempt < maxAttempts) continue;
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Anthropic request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Anthropic request failed');
  }
}
