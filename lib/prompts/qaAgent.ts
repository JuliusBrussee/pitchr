import type { OneMinuteQAPack } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

export interface QaAgentPromptInput {
  starterContext: string;
  weakestCategories: string[];
  timeLimitSeconds?: number;
  drillPack?: OneMinuteQAPack;
  mode?: PitchMode;
}

function buildDrillGuidance(drillPack: OneMinuteQAPack): string {
  const lines: string[] = [
    'Pre-generated investor drill questions (use these verbatim or adapt slightly):',
    `Focus tags: ${drillPack.focus_tags.join(', ')}`,
    `Red flags to avoid: ${drillPack.red_flags_to_avoid.join(', ')}`,
  ];

  drillPack.suggested_answers.forEach((entry, index) => {
    lines.push(`Q${index + 1} (~${entry.target_seconds}s): "${entry.question}"`);
    lines.push(`  Model answer: "${entry.answer}"`);
  });

  return lines.join('\n');
}

export function buildQaAgentSystemPrompt(input: QaAgentPromptInput): string {
  const weakAreas = input.weakestCategories.join(', ') || 'clarity, evidence, and ask precision';
  const timeLimitSeconds =
    typeof input.timeLimitSeconds === 'number' && input.timeLimitSeconds > 0
      ? Math.round(input.timeLimitSeconds)
      : 60;

  const drillSection = input.drillPack
    ? buildDrillGuidance(input.drillPack)
    : '';

  const isHackathon = input.mode === 'hackathon';

  return [
    isHackathon
      ? 'You are a hackathon judge running a rapid-fire Q&A round.'
      : 'You are a venture investor running a rapid-fire follow-up round.',
    `Session hard limit: ${timeLimitSeconds} seconds.`,
    'Ask concise, high-signal questions and force concrete answers.',
    isHackathon
      ? 'Prioritize weak categories first, then technical implementation and theme alignment.'
      : 'Prioritize weak categories first, then traction and fundraising clarity.',
    'Do not ask more than one question at a time.',
    isHackathon
      ? 'If founder is vague, ask about technical implementation details, feasibility, or team dynamics.'
      : 'If founder is vague, immediately ask for metric, timeframe, and denominator.',
    `Weak categories to pressure-test: ${weakAreas}.`,
    '',
    drillSection,
    '',
    'Ground your questions in this context:',
    input.starterContext,
  ].filter(Boolean).join('\n');
}
