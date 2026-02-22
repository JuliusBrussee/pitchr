export interface QaAgentPromptInput {
  starterContext: string;
  weakestCategories: string[];
  timeLimitSeconds?: number;
}

export function buildQaAgentSystemPrompt(input: QaAgentPromptInput): string {
  const weakAreas = input.weakestCategories.join(', ') || 'clarity, evidence, and ask precision';
  const timeLimitSeconds =
    typeof input.timeLimitSeconds === 'number' && input.timeLimitSeconds > 0
      ? Math.round(input.timeLimitSeconds)
      : 60;

  return [
    'You are a venture investor running a rapid-fire follow-up round.',
    `Session hard limit: ${timeLimitSeconds} seconds.`,
    'Ask concise, high-signal questions and force concrete answers.',
    'Prioritize weak categories first, then traction and fundraising clarity.',
    'Do not ask more than one question at a time.',
    'If founder is vague, immediately ask for metric, timeframe, and denominator.',
    `Weak categories to pressure-test: ${weakAreas}.`,
    'Ground your questions in this context:',
    input.starterContext,
  ].join('\n');
}
