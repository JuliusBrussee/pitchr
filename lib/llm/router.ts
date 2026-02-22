import { AnthropicProvider } from '@/lib/llm/providers/anthropic';
import { OpenRouterProvider } from '@/lib/llm/providers/openrouter';
import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

export type LlmProviderName = 'openrouter' | 'anthropic';

function getConfiguredProvider(): LlmProviderName {
  const configured = process.env.LLM_PROVIDER?.toLowerCase();
  if (configured === 'openrouter') return 'openrouter';
  return 'anthropic';
}

function getProviderInstance(name: LlmProviderName): LlmProvider {
  if (name === 'anthropic') {
    return new AnthropicProvider();
  }
  return new OpenRouterProvider();
}

export async function completeWithLlmRouter(
  request: LlmCompletionRequest,
): Promise<string> {
  const providerName = getConfiguredProvider();
  const provider = getProviderInstance(providerName);
  return provider.complete(request);
}

export function getActiveLlmProviderName(): LlmProviderName {
  return getConfiguredProvider();
}
