import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from '@/lib/llm/providers/anthropic';
import { OpenRouterProvider } from '@/lib/llm/providers/openrouter';
import { completeWithLlmRouter, getActiveLlmProviderName } from '@/lib/llm/router';

const REQUEST = {
  systemPrompt: 'System prompt',
  userPrompt: 'User prompt',
};

const ORIGINAL_LLM_PROVIDER = process.env.LLM_PROVIDER;

describe('llm router', () => {
  afterEach(() => {
    if (ORIGINAL_LLM_PROVIDER === undefined) {
      delete process.env.LLM_PROVIDER;
    } else {
      process.env.LLM_PROVIDER = ORIGINAL_LLM_PROVIDER;
    }
    vi.restoreAllMocks();
  });

  it('defaults to anthropic when LLM_PROVIDER is unset', async () => {
    delete process.env.LLM_PROVIDER;

    const anthropicComplete = vi
      .spyOn(AnthropicProvider.prototype, 'complete')
      .mockResolvedValue('anthropic');
    const openRouterComplete = vi
      .spyOn(OpenRouterProvider.prototype, 'complete')
      .mockResolvedValue('openrouter');

    const result = await completeWithLlmRouter(REQUEST);

    expect(result).toBe('anthropic');
    expect(getActiveLlmProviderName()).toBe('anthropic');
    expect(anthropicComplete).toHaveBeenCalledTimes(1);
    expect(openRouterComplete).not.toHaveBeenCalled();
  });

  it('routes to openrouter when explicitly configured', async () => {
    process.env.LLM_PROVIDER = 'openrouter';

    const anthropicComplete = vi
      .spyOn(AnthropicProvider.prototype, 'complete')
      .mockResolvedValue('anthropic');
    const openRouterComplete = vi
      .spyOn(OpenRouterProvider.prototype, 'complete')
      .mockResolvedValue('openrouter');

    const result = await completeWithLlmRouter(REQUEST);

    expect(result).toBe('openrouter');
    expect(getActiveLlmProviderName()).toBe('openrouter');
    expect(openRouterComplete).toHaveBeenCalledTimes(1);
    expect(anthropicComplete).not.toHaveBeenCalled();
  });
});
