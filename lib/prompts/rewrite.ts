import { PITCH_MODE_CONFIG } from '@/config/modes';
import type { Fix } from '@/types/analysis';
import type { PitchMode } from '@/types/pitch';
import type { SupportedLocale } from '@/types/locale';
import { withLocaleDirective } from '@/lib/prompts/locale';

interface BuildRewritePromptInput {
  mode: PitchMode;
  transcript: string;
  topFixes: Fix[];
  locale?: SupportedLocale;
}

export function buildRewritePrompt({
  mode,
  transcript,
  topFixes,
  locale,
}: BuildRewritePromptInput): string {
  const modeConfig = PITCH_MODE_CONFIG[mode];
  const fixesText = topFixes
    .slice(0, 5)
    .map((fix) => `${fix.rank}. [${fix.category}] ${fix.issue} -> ${fix.fix}`)
    .join('\n');

  const prompt = `Rewrite this pitch for spoken delivery.

Mode: ${modeConfig.label}
Target duration: ${modeConfig.targetDurationSeconds} seconds at ~140 WPM
Required beats: ${modeConfig.structureBeats.join(' -> ')}

Original transcript:
"""
${transcript}
"""

Top fixes to incorporate:
${fixesText || 'None provided'}

Return only the rewritten pitch text. No markdown, no JSON, no explanation.`;

  return locale ? withLocaleDirective(prompt, locale) : prompt;
}
