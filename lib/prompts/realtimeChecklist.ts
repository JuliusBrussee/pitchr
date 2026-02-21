import type { ChecklistDefinition, RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';

export interface BuildRealtimeChecklistPromptInput {
  mode: PitchMode;
  transcript: string;
  checklist: ChecklistDefinition[];
  previousItems: RealtimeChecklistItemState[];
}

function formatChecklistItem(item: ChecklistDefinition): string {
  const cues = item.cuePatterns.join(', ');
  const hints = item.semanticHints.join(', ');
  return [
    `- id: ${item.id}`,
    `  label: ${item.label}`,
    `  description: ${item.description}`,
    `  cue_patterns: ${cues}`,
    `  semantic_hints: ${hints}`,
  ].join('\n');
}

function formatPreviousItems(previousItems: RealtimeChecklistItemState[]): string {
  return previousItems
    .map(
      (item) =>
        `- ${item.id}: status=${item.status}, confidence=${item.confidence.toFixed(2)}, evidence="${item.evidence}"`,
    )
    .join('\n');
}

export const REALTIME_CHECKLIST_RESPONSE_SCHEMA = `{
  "items": [
    {
      "id": "intro_hook|problem_statement|solution_overview|market_opportunity|business_model|traction_metrics|team|ask",
      "status": "uncovered|partial|completed",
      "confidence": number,
      "evidence": string
    }
  ],
  "next_hint": string
}`;

export function buildRealtimeChecklistPrompt({
  mode,
  transcript,
  checklist,
  previousItems,
}: BuildRealtimeChecklistPromptInput): string {
  return `You evaluate live startup pitch transcript coverage against checklist items.
Return JSON only. No markdown. No explanations.

Pitch mode: ${mode}

Checklist definition:
${checklist.map(formatChecklistItem).join('\n')}

Previous checklist state (monotonic target):
${formatPreviousItems(previousItems)}

Rules:
- Evaluate semantic coverage, not exact wording only.
- If an item is implied but weakly supported, use "partial".
- Use "completed" only when the transcript clearly covers the item.
- confidence must be between 0 and 1.
- evidence must be a short quote or paraphrase from transcript.
- Return all checklist ids exactly once.
- Keep next_hint to one short action sentence.

Transcript:
"""
${transcript}
"""

Return JSON matching:
${REALTIME_CHECKLIST_RESPONSE_SCHEMA}`;
}
