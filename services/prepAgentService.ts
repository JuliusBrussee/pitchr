import { promises as fs } from 'fs';
import path from 'path';
import { STAGE_EXPECTATIONS } from '@/config/rubric';
import { calculateDeliveryMetrics } from '@/services/scoringService';
import type {
  AntiPatternHit,
  KnowledgeDigest,
  KnowledgeDigestCategory,
  PatternSnippet,
  PitchStage,
  ScoringContext,
  StageExpectation,
  TranscriptSegment,
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
  judge_guidance?: {
    do_rules?: string[];
    dont_rules?: string[];
    category_guidance?: Partial<Record<KnowledgeDigestCategory, string[]>>;
    anti_pattern_playbook?: Record<string, string>;
    digest_version?: string;
  };
  source_weights?: Record<string, number>;
}

export interface PrepAgentInput {
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  deckId?: string;
  stage?: PitchStage;
  transcriptSegments?: TranscriptSegment[];
}

const PATTERNS_FILE = path.join(process.cwd(), 'knowledge', 'patterns.v1.json');
const DEFAULT_STAGE: PitchStage = 'seed';
const PROMPT_VERSION = 'judge-v2.1.0';
const RUBRIC_VERSION = 'rubric-v2.0.0';
const KNOWLEDGE_DIGEST_TARGET_CHARS = 1200;
const KNOWLEDGE_DIGEST_MIN_CHARS = 320;
const KNOWLEDGE_RULE_MAX_CHARS = 120;

const CATEGORY_ORDER: KnowledgeDigestCategory[] = [
  'structure',
  'clarity',
  'evidence',
  'market',
  'delivery',
];

const DEFAULT_DO_RULES = [
  'Open with one sentence: what you do, for whom, and why now.',
  'Quantify traction with metric, timeframe, and denominator.',
  'State one clear wedge and why you win in it first.',
  'Tie the ask to specific 12-18 month milestones.',
  'Use concrete nouns and verbs instead of adjectives.',
];

const DEFAULT_DONT_RULES = [
  'Do not spend the first half on background before saying what you build.',
  'Do not claim market size without execution proof.',
  'Do not use buzzwords when a plain sentence works.',
  'Do not end without a specific raise and use of funds.',
  'Do not list many priorities; choose the single most important outcome.',
];

const DEFAULT_CATEGORY_GUIDANCE: Record<KnowledgeDigestCategory, string[]> = {
  structure: [
    'Use problem -> solution -> proof -> ask in that order.',
    'Transition between beats with one sentence each.',
    'Land the close with amount, runway, and milestone targets.',
  ],
  clarity: [
    'Replace abstract claims with plain-English statements.',
    'Limit each sentence to one idea and one outcome.',
    'Cut acronyms unless they are investor-standard.',
  ],
  evidence: [
    'Attach every core claim to one measurable datapoint.',
    'Name customer type and timeframe for traction metrics.',
    'Show a baseline and a current number when possible.',
  ],
  market: [
    'Define the first beachhead customer before TAM expansion.',
    'Name alternatives and your specific advantage over each.',
    'Show why timing is favorable now, not someday.',
  ],
  delivery: [
    'Keep pace steady and pause before key proof statements.',
    'Remove filler from opening and close first.',
    'Avoid repeating the same phrase in adjacent sentences.',
  ],
};

const DEFAULT_ANTI_PATTERN_PLAYBOOK: Record<string, string> = {
  no_proof: 'Replace one abstract claim with one metric + timeframe + denominator.',
  no_ask: 'State amount raised, runway months, and 2-3 milestone outcomes.',
  tam_only: 'Follow TAM with ICP wedge, GTM motion, and traction proof.',
  jargon_overload: 'Swap buzzwords for plain actions and measurable outcomes.',
  slide_overload: 'Tell the spoken narrative first; slides only support key proof.',
};

const ANTI_PATTERN_CATEGORY_HINTS: Record<string, KnowledgeDigestCategory[]> = {
  no_proof: ['evidence', 'market'],
  no_ask: ['structure', 'market'],
  tam_only: ['market', 'evidence'],
  jargon_overload: ['clarity'],
  slide_overload: ['structure', 'delivery'],
};

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
  return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}

function normalizeMojibake(text: string): string {
  return text
    .replace(/â€™/gu, "'")
    .replace(/â€œ|â€\x9d/gu, '"')
    .replace(/â€“|â€”/gu, '-')
    .replace(/â€¦/gu, '...')
    .replace(/â€¢/gu, '-')
    .replace(/Â/gu, '')
    .replace(/\uFFFD/gu, '');
}

function cleanRuleText(text: string, maxChars = KNOWLEDGE_RULE_MAX_CHARS): string {
  const normalized = normalizeMojibake(text)
    .replace(/\s+/gu, ' ')
    .replace(/^[\s\-:;,.]+/u, '')
    .replace(/[\s\-:;,.]+$/u, '')
    .trim();

  if (!normalized) return '';
  if (normalized.length < 16) return '';
  if (/^\d{1,2}:\d{2}/u.test(normalized)) return '';
  if (/^[^a-zA-Z]+$/u.test(normalized)) return '';
  return clip(normalized, maxChars);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    const clean = cleanRuleText(item);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
}

function emptyCategoryGuidance(): Record<KnowledgeDigestCategory, string[]> {
  return {
    structure: [],
    clarity: [],
    evidence: [],
    market: [],
    delivery: [],
  };
}

function estimateDigestChars(digest: KnowledgeDigest): number {
  return JSON.stringify(digest).length;
}

function estimateDigestRulesCount(digest: KnowledgeDigest): number {
  const categoryRules = CATEGORY_ORDER.reduce(
    (sum, category) => sum + digest.category_guidance[category].length,
    0,
  );
  return (
    digest.do_rules.length +
    digest.dont_rules.length +
    categoryRules +
    Object.keys(digest.anti_pattern_playbook).length
  );
}

function appendUnique(target: string[], value: string): void {
  const clean = cleanRuleText(value);
  if (!clean) return;
  if (target.some((entry) => entry.toLowerCase() === clean.toLowerCase())) return;
  target.push(clean);
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
      judge_guidance: {
        do_rules: [...DEFAULT_DO_RULES],
        dont_rules: [...DEFAULT_DONT_RULES],
        category_guidance: { ...DEFAULT_CATEGORY_GUIDANCE },
        anti_pattern_playbook: { ...DEFAULT_ANTI_PATTERN_PLAYBOOK },
        digest_version: 'v1.0.0-default',
      },
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

function inferLikelyWeakCategories(antiPatterns: AntiPatternHit[]): KnowledgeDigestCategory[] {
  const ordered: KnowledgeDigestCategory[] = [];
  for (const hit of antiPatterns) {
    if (!hit.hit) continue;
    for (const category of ANTI_PATTERN_CATEGORY_HINTS[hit.label] ?? []) {
      if (!ordered.includes(category)) ordered.push(category);
    }
  }
  return ordered;
}

function stageHints(stage: PitchStage, stageExpectations: StageExpectation[]): string[] {
  const expectationBlock = stageExpectations.find((entry) => entry.stage === stage);
  return dedupe(expectationBlock?.expectations ?? []);
}

function mergeCategoryGuidance(
  fromPatterns: PatternsFile['judge_guidance'],
): Record<KnowledgeDigestCategory, string[]> {
  const merged = emptyCategoryGuidance();
  for (const category of CATEGORY_ORDER) {
    const patternRules = fromPatterns?.category_guidance?.[category] ?? [];
    const defaults = DEFAULT_CATEGORY_GUIDANCE[category];
    merged[category] = dedupe([...patternRules, ...defaults]).slice(0, 5);
  }
  return merged;
}

export function buildKnowledgeDigest(params: {
  patterns: PatternsFile;
  stage: PitchStage;
  mode: PitchMode;
  antiPatterns: AntiPatternHit[];
  stageExpectations: StageExpectation[];
}): KnowledgeDigest {
  const { patterns, stage, mode, antiPatterns, stageExpectations } = params;
  const guidance = patterns.judge_guidance;
  const doRules: string[] = [];
  const dontRules: string[] = [];

  const antiPatternPlaybook = {
    ...DEFAULT_ANTI_PATTERN_PLAYBOOK,
    ...(guidance?.anti_pattern_playbook ?? {}),
  };

  const categoryGuidance = mergeCategoryGuidance(guidance);
  const likelyWeakCategories = inferLikelyWeakCategories(antiPatterns);
  const antiPatternHits = antiPatterns.filter((hit) => hit.hit);

  if (mode === 'elevator') {
    appendUnique(doRules, 'Keep one customer, one proof point, and one ask in under 45 seconds.');
  } else {
    appendUnique(doRules, 'Cover problem, mechanism, proof, market, and ask within two minutes.');
  }

  // Priority 1: anti-pattern playbook hits.
  for (const hit of antiPatternHits) {
    const playbookRule = antiPatternPlaybook[hit.label];
    if (playbookRule) appendUnique(doRules, playbookRule);
    if (hit.label === 'jargon_overload') {
      appendUnique(dontRules, 'Do not use buzzwords when a plain sentence is stronger.');
    }
    if (hit.label === 'no_ask') {
      appendUnique(dontRules, 'Do not finish without a clear raise and milestone linkage.');
    }
    if (hit.label === 'no_proof') {
      appendUnique(dontRules, 'Do not leave core claims unsupported by numbers.');
    }
  }

  // Priority 2: likely weakest rubric dimensions.
  for (const category of likelyWeakCategories) {
    for (const rule of categoryGuidance[category].slice(0, 3)) {
      appendUnique(doRules, rule);
    }
  }

  // Priority 3: stage-specific guidance.
  for (const hint of stageHints(stage, stageExpectations)) {
    appendUnique(doRules, hint);
  }

  // Priority 4: general do/dont rules.
  for (const rule of dedupe([...(guidance?.do_rules ?? []), ...DEFAULT_DO_RULES])) {
    appendUnique(doRules, rule);
  }
  for (const rule of dedupe([...(guidance?.dont_rules ?? []), ...DEFAULT_DONT_RULES])) {
    appendUnique(dontRules, rule);
  }

  for (const category of CATEGORY_ORDER) {
    if (categoryGuidance[category].length === 0) {
      categoryGuidance[category] = [...DEFAULT_CATEGORY_GUIDANCE[category]];
    }
  }

  const digest: KnowledgeDigest = {
    do_rules: doRules.slice(0, 12),
    dont_rules: dontRules.slice(0, 12),
    category_guidance: categoryGuidance,
    anti_pattern_playbook: antiPatternPlaybook,
    digest_version: guidance?.digest_version ?? `${patterns.knowledge_version}-digest`,
  };

  const relaxCategoryGuidance = (): boolean => {
    for (const category of [...CATEGORY_ORDER].reverse()) {
      if (digest.category_guidance[category].length > 1) {
        digest.category_guidance[category].pop();
        return true;
      }
    }
    return false;
  };

  while (estimateDigestChars(digest) > KNOWLEDGE_DIGEST_TARGET_CHARS) {
    if (digest.do_rules.length > 4) {
      digest.do_rules.pop();
      continue;
    }
    if (digest.dont_rules.length > 3) {
      digest.dont_rules.pop();
      continue;
    }
    if (relaxCategoryGuidance()) {
      continue;
    }
    break;
  }

  if (estimateDigestChars(digest) < KNOWLEDGE_DIGEST_MIN_CHARS) {
    for (const rule of DEFAULT_DO_RULES) {
      appendUnique(digest.do_rules, rule);
      if (estimateDigestChars(digest) >= KNOWLEDGE_DIGEST_MIN_CHARS) break;
    }
    for (const rule of DEFAULT_DONT_RULES) {
      appendUnique(digest.dont_rules, rule);
      if (estimateDigestChars(digest) >= KNOWLEDGE_DIGEST_MIN_CHARS) break;
    }
  }

  return digest;
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
  const stageExpectations = getStageExpectations(patterns, stage);
  const knowledgeDigest = buildKnowledgeDigest({
    patterns,
    stage,
    mode: input.mode,
    antiPatterns: antiPatternHits,
    stageExpectations,
  });
  const knowledgeDigestChars = estimateDigestChars(knowledgeDigest);
  const knowledgeDigestRulesCount = estimateDigestRulesCount(knowledgeDigest);

  if (knowledgeDigestChars < KNOWLEDGE_DIGEST_MIN_CHARS) {
    console.warn('[prep-agent] knowledge digest below minimum size', {
      chars: knowledgeDigestChars,
      minChars: KNOWLEDGE_DIGEST_MIN_CHARS,
      digestVersion: knowledgeDigest.digest_version,
    });
  }

  return {
    mode: input.mode,
    stage,
    coverage,
    deck_id: input.deckId,
    normalized_transcript: normalizedTranscript,
    normalized_deck_text: normalizedDeckText,
    transcript_word_count: normalizedTranscript.split(/\s+/u).filter(Boolean).length,
    deck_word_count: normalizedDeckText.split(/\s+/u).filter(Boolean).length,
    transcript_segments: input.transcriptSegments,
    beats: extractBeatEvidence(normalizedTranscript),
    detected_anti_patterns: antiPatternHits,
    delivery_metrics: deliveryMetrics,
    knowledge_digest: knowledgeDigest,
    knowledge_digest_chars: knowledgeDigestChars,
    knowledge_digest_rules_count: knowledgeDigestRulesCount,
    retrieved_patterns: retrievePatternSnippets(patterns, stage),
    stage_expectations: stageExpectations,
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
