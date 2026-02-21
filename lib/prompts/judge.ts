import { DECK_RUBRIC_CATEGORIES, RUBRIC_CATEGORIES } from '@/config/rubric';
import type { ScoringContext } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const MAX_PROMPT_CHARS = 9000;
const MAX_PATTERN_TEXT_CHARS = 240;
const MAX_BEAT_TEXT_CHARS = 180;
const MAX_ANTI_EVIDENCE_CHARS = 180;

function clip(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

export const JUDGE_SYSTEM_PROMPT = [
  'You are Pitchr Judge Agent.',
  'You evaluate startup spoken pitches and optional deck text against YC top-decile fundraising standards.',
  'Return valid JSON only.',
  'Do not include markdown fences.',
  'Do not include explanations before or after JSON.',
  'Score harshly: 80+ should be rare and reserved for clear proof, clear ask, and clear differentiation.',
  'Penalize generic and vague language aggressively.',
  'Prioritize YC-aligned principles and then curated support sources.',
  'Be concise. Use compact sentences and avoid long explanations.',
  'Non-delivery categories are your responsibility.',
  'Delivery metrics will be overwritten by deterministic local scoring.',
].join('\n');

export const JUDGE_RESPONSE_SCHEMA_TEXT = `{
  "feedback": {
    "one_line_verdict": "string",
    "rubric_breakdown": [
      {
        "category": "structure|clarity|evidence|market|delivery|deck_narrative|deck_clarity|deck_evidence|deck_design|deck_ask",
        "score": "number",
        "max_score": 20,
        "rationale": "string"
      }
    ],
    "top_fixes": [
      {
        "rank": "number",
        "category": "structure|clarity|evidence|market|delivery|deck_narrative|deck_clarity|deck_evidence|deck_design|deck_ask",
        "issue": "string",
        "fix": "string",
        "impact": "high|medium|low"
      }
    ],
    "rewrite_script": "string",
    "sentiment_profile": {
      "confidence": "number",
      "urgency": "number",
      "credibility": "number",
      "clarity": "number",
      "investor_readiness": "number"
    },
    "citations": [
      {
        "source_id": "string",
        "source_url": "string",
        "source_title": "string",
        "access_status": "full|partial|gated",
        "snapshot_date": "YYYY-MM-DD",
        "confidence_score": "number",
        "excerpt": "string"
      }
    ],
    "do_next_checklist": ["string"]
  },
  "qa_1min": {
    "total_target_seconds": 60,
    "timing_plan_seconds": [20, 20, 20],
    "investor_questions": ["string", "string", "string"],
    "suggested_answers": [
      {"question": "string", "answer": "string", "target_seconds": 20},
      {"question": "string", "answer": "string", "target_seconds": 20},
      {"question": "string", "answer": "string", "target_seconds": 20}
    ],
    "focus_tags": ["string"],
    "red_flags_to_avoid": ["string"]
  }
}`;

function rubricText(): string {
  const spoken = RUBRIC_CATEGORIES.map(
    (category, index) =>
      `${index + 1}. ${category.id} (0-20): ${category.scoringCriteria}`,
  );
  const deck = DECK_RUBRIC_CATEGORIES.map(
    (category, index) =>
      `${index + 1}. ${category.id} (0-20): ${category.scoringCriteria}`,
  );
  return ['Spoken rubric:', ...spoken, '', 'Deck rubric:', ...deck].join('\n');
}

function toCompactContext(
  context: ScoringContext,
  options?: {
    includePatternText?: boolean;
    maxPatterns?: number;
    includeBenchmarks?: boolean;
  },
): Record<string, unknown> {
  const includePatternText = options?.includePatternText ?? true;
  const maxPatterns = options?.maxPatterns ?? 6;
  const includeBenchmarks = options?.includeBenchmarks ?? true;

  return {
    mode: context.mode,
    stage: context.stage,
    coverage: context.coverage,
    beats: context.beats.slice(0, 7).map((beat) => ({
      beat: beat.beat,
      evidence: clip(beat.evidence, MAX_BEAT_TEXT_CHARS),
    })),
    anti_pattern_hits: context.detected_anti_patterns.map((hit) => ({
      label: hit.label,
      hit: hit.hit,
      weight: hit.weight,
      evidence: clip(hit.evidence, MAX_ANTI_EVIDENCE_CHARS),
    })),
    delivery_summary: {
      word_count: context.delivery_metrics.word_count,
      duration_seconds: context.delivery_metrics.duration_seconds,
      wpm: context.delivery_metrics.wpm,
      target_wpm: context.delivery_metrics.target_wpm,
      filler_rate: context.delivery_metrics.filler_rate,
      stutter_rate: context.delivery_metrics.stutter_rate,
      repeat_rate: context.delivery_metrics.repeat_rate,
      within_time_limit: context.delivery_metrics.within_time_limit,
      delivery20: context.delivery_metrics.delivery20,
    },
    stage_expectations: context.stage_expectations.map((entry) => ({
      stage: entry.stage,
      expectations: entry.expectations.slice(0, 4).map((item) => clip(item, 120)),
    })),
    benchmark_profiles: includeBenchmarks
      ? {
          yc_top_decile:
            context.benchmark_profiles?.yc_top_decile
              ?.slice(0, 4)
              .map((item) => clip(item, 120)) ?? [],
          yc_median:
            context.benchmark_profiles?.yc_median
              ?.slice(0, 4)
              .map((item) => clip(item, 120)) ?? [],
          common_failures:
            context.benchmark_profiles?.common_failures
              ?.slice(0, 4)
              .map((item) => clip(item, 120)) ?? [],
        }
      : undefined,
    source_weights: context.source_weights,
    retrieved_patterns: context.retrieved_patterns.slice(0, maxPatterns).map((pattern) => ({
      type: pattern.type,
      title: pattern.title,
      weight: pattern.weight,
      text: includePatternText ? clip(pattern.text, MAX_PATTERN_TEXT_CHARS) : undefined,
    })),
  };
}

function buildPrompt(params: {
  mode: PitchMode;
  context: ScoringContext;
  transcript: string;
  deckText: string;
  includePatternText: boolean;
  maxPatterns: number;
  includeBenchmarks: boolean;
}): string {
  const compactContext = toCompactContext(params.context, {
    includePatternText: params.includePatternText,
    maxPatterns: params.maxPatterns,
    includeBenchmarks: params.includeBenchmarks,
  });

  return [
    'Task: score this pitch and produce dual output in one JSON object.',
    '',
    `Mode: ${params.mode}`,
    `Coverage: ${params.context.coverage}`,
    `Stage: ${params.context.stage}`,
    '',
    rubricText(),
    '',
    'Benchmark policy:',
    '- Grade against YC top-decile fundraising quality.',
    '- 80+ is rare and requires strong proof + clear differentiation + explicit ask.',
    '- Prioritize YC-weighted evidence over secondary sources.',
    '',
    'Compact scoring context (deterministic local features):',
    JSON.stringify(compactContext, null, 2),
    '',
    'Original transcript:',
    params.transcript || '[empty transcript]',
    '',
    'Deck text:',
    params.deckText || '[no deck text provided]',
    '',
    'Rules:',
    '- Return JSON only with fields exactly matching the schema.',
    '- Provide 5 spoken rubric items always.',
    '- Provide 5 deck rubric items only when deck text exists.',
    '- Keep one_line_verdict under 24 words.',
    '- Keep each rubric rationale under 18 words.',
    '- Keep top_fixes ranked with concrete issue and fix.',
    '- Keep each fix issue and fix under 16 words each.',
    '- Keep rewrite_script under 120 words.',
    '- Keep citations to maximum 2 entries.',
    '- Keep citation excerpt under 80 characters.',
    '- Keep do_next_checklist to maximum 5 short bullets.',
    '- Q&A must have exactly 3 questions and 3 timed answers.',
    '- Keep each Q&A answer under 45 words.',
    '- If deck exists, at least one question must reference deck claims.',
    '- Questions should prioritize weakest scoring dimensions.',
    '',
    'Response schema:',
    JUDGE_RESPONSE_SCHEMA_TEXT,
  ].join('\n');
}

export function buildJudgeUserPrompt({
  mode,
  transcript,
  deckText,
  context,
}: {
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  context: ScoringContext;
}): string {
  let workingTranscript = transcript.trim();
  let workingDeckText = deckText?.trim() ?? '';
  let includePatternText = true;
  let maxPatterns = 6;
  let includeBenchmarks = true;

  let prompt = buildPrompt({
    mode,
    context,
    transcript: workingTranscript,
    deckText: workingDeckText,
    includePatternText,
    maxPatterns,
    includeBenchmarks,
  });

  if (prompt.length > MAX_PROMPT_CHARS) {
    workingTranscript = clip(workingTranscript, 2800);
    workingDeckText = clip(workingDeckText, 1800);
    prompt = buildPrompt({
      mode,
      context,
      transcript: workingTranscript,
      deckText: workingDeckText,
      includePatternText,
      maxPatterns,
      includeBenchmarks,
    });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    includePatternText = false;
    maxPatterns = 4;
    prompt = buildPrompt({
      mode,
      context,
      transcript: workingTranscript,
      deckText: workingDeckText,
      includePatternText,
      maxPatterns,
      includeBenchmarks,
    });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    workingTranscript = clip(workingTranscript, 1800);
    workingDeckText = clip(workingDeckText, 1000);
    prompt = buildPrompt({
      mode,
      context,
      transcript: workingTranscript,
      deckText: workingDeckText,
      includePatternText,
      maxPatterns,
      includeBenchmarks,
    });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    includeBenchmarks = false;
    maxPatterns = 3;
    workingTranscript = clip(workingTranscript, 1400);
    workingDeckText = clip(workingDeckText, 700);
    prompt = buildPrompt({
      mode,
      context,
      transcript: workingTranscript,
      deckText: workingDeckText,
      includePatternText,
      maxPatterns,
      includeBenchmarks,
    });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    workingTranscript = clip(workingTranscript, 900);
    workingDeckText = clip(workingDeckText, 400);
    prompt = buildPrompt({
      mode,
      context,
      transcript: workingTranscript,
      deckText: workingDeckText,
      includePatternText,
      maxPatterns,
      includeBenchmarks,
    });
  }

  return prompt;
}
