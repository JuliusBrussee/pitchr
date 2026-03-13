import { getTargetWordCount, PITCH_MODE_CONFIG } from '@/config/modes';
import type { Fix } from '@/types/analysis';
import type { PitchMode } from '@/types/pitch';

interface BuildRewritePromptInput {
  mode: PitchMode;
  transcript: string;
  topFixes: Fix[];
}

export function buildRewritePrompt({
  mode,
  transcript,
  topFixes,
}: BuildRewritePromptInput): string {
  const modeConfig = PITCH_MODE_CONFIG[mode];
  const targetWords = getTargetWordCount(mode);
  const fixesText = topFixes
    .slice(0, 5)
    .map((fix) => `${fix.rank}. [${fix.category}] ${fix.issue} -> ${fix.fix}`)
    .join('\n');

  return `Rewrite this pitch for spoken delivery.

Principles:
- Apply every listed fix so the rewrite addresses structure, clarity, evidence, market, and delivery issues.
- Preserve the speaker's voice and all key facts, numbers, and claims; do not invent metrics or use generic "startup speak."
- Simplify language: no jargon, no "platform," no marketing fluff; predigested, baby-food clarity. One idea per beat.
- Respect the required structure beats so the rewrite is scannable and memorable.
- Output spoken-language only: natural to say aloud, no bullet points or slide language.

Mode: ${modeConfig.label}
Target duration: ${modeConfig.targetDurationSeconds} seconds at ~${modeConfig.targetWpm} WPM
Required beats: ${modeConfig.structureBeats.join(' -> ')}
Keep the rewrite under ${targetWords} words.

Original transcript:
"""
${transcript}
"""

Top fixes to incorporate:
${fixesText || 'None provided'}

Return only the rewritten pitch text. No markdown, no JSON, no explanation.`;
}
