import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

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
    });

    const payload = (await response.json()) as AnthropicResponse;
    if (!response.ok) {
      throw new Error(
        payload.error?.message ??
          `Anthropic request failed with status ${response.status}`,
      );
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
  }
}
