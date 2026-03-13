import { completeWithLlmRouterWithTelemetry } from '@/lib/llm/router';
import { buildRewritePrompt } from '@/lib/prompts/rewrite';
import type { Fix } from '@/types/analysis';
import type { PitchMode } from '@/types/pitch';

const REWRITE_SYSTEM_PROMPT =
  'You are a pitch editor. Output only the rewritten script, no preamble or explanation.';

export interface RewriteAgentInput {
  mode: PitchMode;
  transcript: string;
  topFixes: Fix[];
}

export interface RewriteAgentResult {
  rewrite_script: string;
}

export async function runRewriteAgent(input: RewriteAgentInput): Promise<RewriteAgentResult> {
  const userPrompt = buildRewritePrompt({
    mode: input.mode,
    transcript: input.transcript,
    topFixes: input.topFixes,
  });

  const response = await completeWithLlmRouterWithTelemetry({
    systemPrompt: REWRITE_SYSTEM_PROMPT,
    userPrompt,
    responseFormat: 'text',
    temperature: 0.3,
    maxTokens: 1024,
    timeoutMs: 20_000,
    maxAttempts: 1,
  });

  const rewrite_script = response.text.trim();
  return { rewrite_script };
}
