import { promises as fs } from 'fs';
import path from 'path';
import { STAGE_EXPECTATIONS } from '@/config/rubric';
import { calculateDeliveryMetrics } from '@/services/scoringService';
import type {
  AntiPatternHit,
  PatternSnippet,
  PitchStage,
  ScoringContext,
  StageExpectation,
} from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface PatternsFile {
  knowledge_version: string;
  positive_patterns?: Array<{
    id: string;
    title: string;
    text: string;
    weight: number;
    stage?: PitchStage | 'all';
    citations?: string[];
  }>;
  anti_patterns?: Array<{
    id: string;
    label: string;
    description: string;
    default_weight: number;
    citations?: string[];
  }>;
  stage_expectations?: Partial<Record<PitchStage, string[]>>;
  benchmark_profiles?: {
    yc_top_decile?: string[];
    yc_median?: string[];
    common_failures?: string[];
  };
  source_weights?: Record<string, number>;
}

export interface PrepAgentInput {
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  stage?: PitchStage;
  transcriptSegments?: Array<{ text?: string; start?: number; end?: number }>;
}

const PATTERNS_FILE = path.join(process.cwd(), 'knowledge', 'patterns.v1.json');
const DEFAULT_STAGE: PitchStage = 'seed';
const PROMPT_VERSION = 'judge-v2.1.0';
const RUBRIC_VERSION = 'rubric-v2.0.0';

let cachedPatterns: PatternsFile | null = null;

function normalizeText(raw: string): string {
  return raw
    .split(/\r?\n/u)
    .map((line) =>
      line
        .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s+/u, '')
        .replace(/^\s*\[[^\]]+\]\s*/u, '')
        .trim(),
    )
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function clip(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function dropInterviewerHeavySegments(text: string): string {
  const filtered = text
    .split(/(?<=[.!?])\s+/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => {
      const lower = line.toLowerCase();
      const looksQuestion = lower.endsWith('?');
      const interviewerCue =
        lower.startsWith('question') ||
        lower.startsWith('so ') ||
        lower.includes('next question');
      return !(looksQuestion && interviewerCue);
    });
  return filtered.join(' ').trim();
}

function extractBeatEvidence(normalizedTranscript: string): ScoringContext['beats'] {
  const beatPatterns: Array<{
    beat: ScoringContext['beats'][number]['beat'];
    patterns: RegExp[];
  }> = [
    { beat: 'one_liner', patterns: [/\bwe (build|are|help)\b/iu, /\bis a\b/iu] },
    { beat: 'problem', patterns: [/\b(problem|pain|friction|broken)\b/iu] },
    { beat: 'mechanism', patterns: [/\b(product|platform|automate|engine)\b/iu] },
    { beat: 'proof', patterns: [/\b(arr|mrr|revenue|growth|customers|retention)\b/iu, /\d+%/u] },
    { beat: 'differentiation', patterns: [/\b(unlike|advantage|moat|defensible)\b/iu] },
    { beat: 'wedge', patterns: [/\b(niche|segment|wedge|beachhead|icp)\b/iu] },
    { beat: 'ask', patterns: [/\b(raising|ask|use of funds|round)\b/iu] },
  ];

  const sentences = normalizedTranscript
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return beatPatterns
    .map((entry) => {
      const evidence = sentences.find((sentence) =>
        entry.patterns.some((pattern) => pattern.test(sentence)),
      );
      return evidence ? { beat: entry.beat, evidence } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function detectAntiPatterns(
  normalizedTranscript: string,
  normalizedDeckText: string,
  patternDefs: PatternsFile['anti_patterns'],
): AntiPatternHit[] {
  const joined = `${normalizedTranscript} ${normalizedDeckText}`.trim();
  const lower = joined.toLowerCase();
  const hasAsk = /\b(raising|ask|use of funds|round)\b/u.test(lower);
  const hasProof = /\b(\d+%|\$\d+|arr|mrr|revenue|customers|retention|growth)\b/u.test(
    lower,
  );
  const tamOnly =
    /\b(tam|sam|som|market size)\b/u.test(lower) &&
    !/\b(customers|retention|conversion|pipeline|revenue)\b/u.test(lower);
  const jargonCount =
    (lower.match(/\b(revolutionary|synergy|disruptive|next[- ]?gen|best[- ]?in[- ]?class)\b/gu)
      ?.length ?? 0);

  const baseHits: Record<string, { hit: boolean; evidence: string }> = {
    jargon_overload: {
      hit: jargonCount >= 2,
      evidence:
        jargonCount >= 2
          ? `Detected ${jargonCount} high-level buzzword terms.`
          : 'No excessive buzzword density detected.',
    },
    no_ask: {
      hit: !hasAsk,
      evidence: hasAsk
        ? 'Explicit ask language detected.'
        : 'No explicit raise or use-of-funds ask detected.',
    },
    no_proof: {
      hit: !hasProof,
      evidence: hasProof
        ? 'Quantitative proof points detected.'
        : 'No concrete numeric proof points detected.',
    },
    tam_only: {
      hit: tamOnly,
      evidence: tamOnly
        ? 'Market-sizing language detected without adjacent execution proof.'
        : 'Market sizing is not isolated from execution claims.',
    },
    slide_overload: {
      hit: (lower.match(/\bslide\b/gu)?.length ?? 0) >= 4,
      evidence:
        (lower.match(/\bslide\b/gu)?.length ?? 0) >= 4
          ? 'Frequent slide references detected.'
          : 'Slide references are limited.',
    },
  };

  const defs = patternDefs ?? [];
  const mapped = defs.map((def) => {
    const signal = baseHits[def.label] ?? {
      hit: false,
      evidence: 'No deterministic signal configured.',
    };
    return {
      id: def.id,
      label: def.label,
      hit: signal.hit,
      weight: def.default_weight,
      evidence: signal.evidence,
      penalty: signal.hit ? 1 : 0,
    } satisfies AntiPatternHit;
  });

  return mapped;
}

async function readPatterns(): Promise<PatternsFile> {
  if (cachedPatterns) return cachedPatterns;
  try {
    const raw = await fs.readFile(PATTERNS_FILE, 'utf8');
    cachedPatterns = JSON.parse(raw) as PatternsFile;
    return cachedPatterns;
  } catch {
    cachedPatterns = {
      knowledge_version: 'v1.0.0',
      positive_patterns: [],
      anti_patterns: [],
      stage_expectations: {},
    };
    return cachedPatterns;
  }
}

function getStageExpectations(patterns: PatternsFile, stage: PitchStage): StageExpectation[] {
  const fromPatterns = patterns.stage_expectations?.[stage];
  if (fromPatterns && fromPatterns.length > 0) {
    return [{ stage, expectations: fromPatterns }];
  }
  const fallback = STAGE_EXPECTATIONS.find((item) => item.stage === stage);
  return [
    {
      stage,
      expectations: fallback?.expectations ?? [],
    },
  ];
}

function retrievePatternSnippets(
  patterns: PatternsFile,
  stage: PitchStage,
): PatternSnippet[] {
  const positive = (patterns.positive_patterns ?? [])
    .filter((pattern) => pattern.stage === 'all' || pattern.stage === stage)
    .slice(0, 4)
    .map(
      (pattern): PatternSnippet => ({
        id: pattern.id,
        type: 'positive',
        title: pattern.title,
        text: clip(pattern.text, 240),
        stage: pattern.stage ?? 'all',
        weight: pattern.weight,
      }),
    );

  const anti = (patterns.anti_patterns ?? [])
    .slice(0, 4)
    .map(
      (pattern): PatternSnippet => ({
        id: pattern.id,
        type: 'anti',
        title: pattern.label,
        text: clip(pattern.description, 240),
        stage: 'all',
        weight: pattern.default_weight,
      }),
    );

  return [...positive, ...anti];
}

export async function buildScoringContext(input: PrepAgentInput): Promise<ScoringContext> {
  const patterns = await readPatterns();
  const stage = input.stage ?? DEFAULT_STAGE;
  const normalizedTranscript = dropInterviewerHeavySegments(normalizeText(input.transcript));
  const normalizedDeckText = normalizeText(input.deckText ?? '');
  const coverage = normalizedDeckText.length > 0 ? 'spoken+deck' : 'spoken_only';

  const deliveryMetrics = calculateDeliveryMetrics({
    transcript: normalizedTranscript,
    mode: input.mode,
    segments: input.transcriptSegments,
  });

  const antiPatternHits = detectAntiPatterns(
    normalizedTranscript,
    normalizedDeckText,
    patterns.anti_patterns,
  );

  return {
    mode: input.mode,
    stage,
    coverage,
    normalized_transcript: normalizedTranscript,
    normalized_deck_text: normalizedDeckText,
    transcript_word_count: normalizedTranscript.split(/\s+/u).filter(Boolean).length,
    deck_word_count: normalizedDeckText.split(/\s+/u).filter(Boolean).length,
    beats: extractBeatEvidence(normalizedTranscript),
    detected_anti_patterns: antiPatternHits,
    delivery_metrics: deliveryMetrics,
    retrieved_patterns: retrievePatternSnippets(patterns, stage),
    stage_expectations: getStageExpectations(patterns, stage),
    benchmark_profiles: {
      yc_top_decile: patterns.benchmark_profiles?.yc_top_decile ?? [],
      yc_median: patterns.benchmark_profiles?.yc_median ?? [],
      common_failures: patterns.benchmark_profiles?.common_failures ?? [],
    },
    source_weights: patterns.source_weights ?? {},
    knowledge_version: patterns.knowledge_version ?? 'v1.0.0',
    prompt_version: PROMPT_VERSION,
    rubric_version: RUBRIC_VERSION,
  };
}
