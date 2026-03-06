import { PITCH_MODE_CONFIG } from '@/config/modes';
import { RUBRIC_CATEGORIES } from '@/config/rubric';
import type { PitchMode } from '@/types/pitch';

export const ANALYSIS_RESULT_SCHEMA_TEXT = `{
  "overall_score": number,
  "one_line_verdict": string,
  "rubric_breakdown": [
    {
      "category": "structure" | "clarity" | "evidence" | "market" | "delivery",
      "score": number,
      "max_score": 20,
      "rationale": string
    }
  ],
  "top_fixes": [
    {
      "rank": 1..5,
      "category": "structure" | "clarity" | "evidence" | "market" | "delivery",
      "issue": string,
      "fix": string,
      "impact": "high" | "medium" | "low"
    }
  ],
  "rewrite_script": string,
  "delivery_metrics": {
    "wpm": number,
    "duration_seconds": number,
    "filler_words": [{ "word": string, "count": number }],
    "repeated_phrases": [{ "phrase": string, "count": number }],
    "within_time_limit": boolean
  }
}`;

interface BuildRubricPromptInput {
  transcript: string;
  mode: PitchMode;
  targetDurationSeconds?: number;
}

export function buildRubricPrompt({ transcript, mode, targetDurationSeconds }: BuildRubricPromptInput): string {
  const modeConfig = PITCH_MODE_CONFIG[mode];
  const effectiveDuration = targetDurationSeconds ?? modeConfig.targetDurationSeconds;
  const rubricText = RUBRIC_CATEGORIES.map((category, index) => {
    let criteria = category.scoringCriteria;
    if (category.id === 'structure') {
      criteria = `${modeConfig.structureBeats.join(' -> ')}. Penalize missing beats or circular flow.`;
    }
    return `${index + 1}. ${category.label.toUpperCase()} (0-20)
Description: ${category.description}
Criteria: ${criteria}`;
  }).join('\n\n');

  return `Evaluate this startup pitch transcript using the rubric below.

Mode: ${modeConfig.label}
Target duration: ${effectiveDuration} seconds
Structure beats: ${modeConfig.structureBeats.join(' -> ')}

Rubric:
${rubricText}

Rules:
- Score each category from 0 to 20.
- Provide exactly 5 rubric_breakdown items (one per category).
- Provide at most 5 top_fixes, ranked by impact.
- Keep one_line_verdict to one sentence.
- rewrite_script must be spoken-language ready for this mode.
- delivery_metrics values may be placeholders; they will be replaced by local metrics.

Transcript:
"""
${transcript}
"""

Return JSON matching this exact schema:
${ANALYSIS_RESULT_SCHEMA_TEXT}`;
}

interface BuildRepairPromptInput {
  invalidOutput: string;
  transcript: string;
  mode: PitchMode;
}

export function buildRepairPrompt({
  invalidOutput,
  transcript,
  mode,
}: BuildRepairPromptInput): string {
  const modeConfig = PITCH_MODE_CONFIG[mode];
  return `The previous model output is invalid JSON or invalid schema.
Repair it into valid JSON only, matching the schema exactly.

Mode: ${modeConfig.label}
Transcript:
"""
${transcript}
"""

Invalid output:
"""
${invalidOutput}
"""

Return only valid JSON matching:
${ANALYSIS_RESULT_SCHEMA_TEXT}`;
}
