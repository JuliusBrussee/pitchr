import { describe, expect, it, vi } from 'vitest';
import { runRewriteAgent } from '@/services/rewriteAgentService';

vi.mock('@/lib/llm/router', () => ({
  completeWithLlmRouterWithTelemetry: vi.fn().mockResolvedValue({
    text: '  We build tools for teams. Improved script.  ',
    telemetry: {
      providerUsed: 'anthropic',
      fallbackUsed: false,
      attemptCount: 1,
      latencyMs: 500,
      llmCallsUsed: 1,
    },
  }),
}));

describe('runRewriteAgent', () => {
  it('returns trimmed rewrite_script from LLM response', async () => {
    const result = await runRewriteAgent({
      mode: 'vc_pitch',
      transcript: 'We build tools for teams.',
      topFixes: [
        { rank: 1, category: 'evidence', issue: 'No metrics', fix: 'Add ARR', impact: 'high' },
      ],
    });

    expect(result.rewrite_script).toBe('We build tools for teams. Improved script.');
  });

  it('calls LLM with text format and buildRewritePrompt content', async () => {
    const { completeWithLlmRouterWithTelemetry } = await import('@/lib/llm/router');
    vi.mocked(completeWithLlmRouterWithTelemetry).mockClear();
    await runRewriteAgent({
      mode: 'elevator',
      transcript: 'Short pitch.',
      topFixes: [],
    });

    expect(completeWithLlmRouterWithTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: 'text',
        temperature: 0.3,
        maxTokens: 1024,
        timeoutMs: 20_000,
      }),
    );
    const call = vi.mocked(completeWithLlmRouterWithTelemetry).mock.calls[0][0];
    expect(call.userPrompt).toContain('Short pitch.');
    expect(call.userPrompt).toContain('Elevator Pitch');
    expect(call.systemPrompt).toContain('pitch editor');
  });
});
