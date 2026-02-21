import { PITCH_MODE_CONFIG } from '@/config/modes';
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
  const fixesText = topFixes
    .slice(0, 5)
    .map((fix) => `${fix.rank}. [${fix.category}] ${fix.issue} -> ${fix.fix}`)
    .join('\n');

  return `Rewrite this pitch for spoken delivery.

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
}
