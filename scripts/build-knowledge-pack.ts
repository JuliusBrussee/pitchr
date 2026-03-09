import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface SnapshotCitation {
  source_id: string;
  source_url: string;
  source_title: string;
  access_status: 'full' | 'partial' | 'gated';
  snapshot_date: string;
  confidence_score: number;
}

interface SnapshotRecord extends SnapshotCitation {
  key_rules_do?: string[];
  key_rules_dont?: string[];
}

interface PatternRecord {
  id: string;
  title: string;
  stage: 'all' | 'pre_seed' | 'seed' | 'series_a' | 'series_b';
  text: string;
  weight: number;
  citations: string[];
}

interface AntiPatternRecord {
  id: string;
  label: string;
  description: string;
  default_weight: number;
  citations: string[];
}

type JudgeGuidanceCategory = 'structure' | 'clarity' | 'evidence' | 'market' | 'delivery';

interface BuildOutput {
  knowledge_version: string;
  built_at: string;
  positive_patterns: PatternRecord[];
  anti_patterns: AntiPatternRecord[];
  stage_expectations: Record<
    'pre_seed' | 'seed' | 'series_a' | 'series_b',
    string[]
  >;
  deck_structure_templates: Array<{ name: string; slides: string[] }>;
  benchmark_profiles: {
    yc_top_decile: string[];
    yc_median: string[];
    common_failures: string[];
  };
  judge_guidance: {
    do_rules: string[];
    dont_rules: string[];
    category_guidance: Record<JudgeGuidanceCategory, string[]>;
    anti_pattern_playbook: Record<string, string>;
    digest_version: string;
  };
  hackathon: {
    beat_patterns: string[];
    anti_patterns: string[];
    category_guidance: Record<JudgeGuidanceCategory, string[]>;
    benchmark_profiles: {
      hackathon_winner: string[];
      common_failures: string[];
    };
  };
  source_weights: Record<string, number>;
  source_citations: SnapshotCitation[];
}

const ROOT = process.cwd();
const CORPUS_DIR = path.join(ROOT, 'pitch backend');
const KNOWLEDGE_DIR = path.join(ROOT, 'knowledge');
const SNAPSHOTS_DIR = path.join(KNOWLEDGE_DIR, 'snapshots');
const CURATED_NOTES_FILE = path.join(
  KNOWLEDGE_DIR,
  'curated',
  'deck_commonality_notes.md',
);
const PATTERNS_FILE = path.join(KNOWLEDGE_DIR, 'patterns.v1.json');
const MANIFEST_FILE = path.join(KNOWLEDGE_DIR, 'manifest.json');

const KNOWLEDGE_VERSION = 'v1.2.0';
const MAX_RULE_CHARS = 120;
const MAX_PATTERN_CHARS = 500;
const MAX_BEAT_SNIPPET_CHARS = 220;
const MAX_BEAT_EXAMPLES_PER_BEAT = 10;

const RULE_MOJIBAKE = /(Ã|Â|â€|�)/u;
const JUNK_LINE_PATTERN = /^\s*(\d{1,2}:\d{2}(:\d{2})?|\[[^\]]+\])\s*/u;

const BEAT_PATTERNS: Record<string, RegExp[]> = {
  one_liner: [/\bwe (build|are|help)\b/iu, /\bfor\b.+\bwith\b/iu],
  problem: [/\b(problem|pain|friction|broken|expensive|slow)\b/iu],
  mechanism: [/\b(product|platform|workflow|automate|engine)\b/iu],
  proof: [/\b(revenue|arr|growth|users|customers|retention|pipeline)\b/iu, /\d+%/u],
  differentiation: [/\b(unlike|advantage|moat|defensible|why we win)\b/iu],
  wedge: [/\b(icp|beachhead|segment|wedge|niche)\b/iu],
  ask: [/\b(raising|ask|use of funds|round|capital)\b/iu],
};

const HACKATHON_BEAT_PATTERNS: Record<string, RegExp[]> = {
  demo: [/\b(demo|prototype|live|screen[- ]?share|show you|let me show|built|working)\b/iu],
  innovation: [/\b(novel|innovative|creative|unique|first|new approach|breakthrough)\b/iu],
  impact: [/\b(impact|benefit|help|solve|improve|change|transform)\b/iu],
  theme_alignment: [/\b(theme|challenge|track|prompt|hackathon|sponsor)\b/iu],
  technical_stack: [/\b(api|sdk|framework|stack|built with|using|powered by|smart contract)\b/iu],
};

const JARGON_TERMS = [
  'revolutionary',
  'synergy',
  'disruptive',
  'next-gen',
  'game-changing',
  'best-in-class',
  'leverage',
  'paradigm',
];

const DEFAULT_CATEGORY_GUIDANCE: Record<JudgeGuidanceCategory, string[]> = {
  structure: [
    'Use problem -> solution -> proof -> ask in that order.',
    'Open with what you do, for whom, and why now in one sentence.',
    'Tie the close to amount raised, runway, and concrete milestones.',
    'Do not spend early time on background before the core value claim.',
  ],
  clarity: [
    'Replace jargon with plain language and concrete nouns.',
    'Keep each sentence focused on one investor-relevant point.',
    'Avoid acronyms unless they are investor-standard terms.',
    'Trim adjectives that are not backed by evidence.',
  ],
  evidence: [
    'Attach a metric, timeframe, and denominator to major claims.',
    'Name customer type or cohort when citing traction numbers.',
    'Show baseline vs current to prove movement over time.',
    'Use one strong datapoint instead of multiple weak claims.',
  ],
  market: [
    'Define beachhead ICP before broad TAM expansion narrative.',
    'Name alternatives and explain your specific wedge advantage.',
    'Show why timing is favorable now with execution signal.',
    'Avoid TAM-only framing without GTM or traction proof.',
  ],
  delivery: [
    'Keep pace steady and pause before key proof statements.',
    'Remove filler words from opening and close first.',
    'Avoid repeating the same phrase across adjacent sentences.',
    'Use short transitions between beats to reduce verbal drift.',
  ],
};

const HACKATHON_CATEGORY_GUIDANCE: Record<JudgeGuidanceCategory, string[]> = {
  structure: [
    'Use hook -> problem -> demo -> innovation -> impact -> ask flow.',
    'Lead with a compelling hook that shows the problem.',
    'Transition to live demo within the first minute.',
    'End with a clear call-to-action for judges.',
  ],
  clarity: [
    'Explain what you built in one plain sentence.',
    'Avoid overly technical jargon for general audiences.',
    'Let the demo speak for the product.',
    'Keep explanations visual and concrete.',
  ],
  evidence: [
    'Show a working demo, not just slides or mockups.',
    'Demonstrate technical depth through implementation details.',
    'Show real data or user interactions if available.',
    'Reference specific APIs, protocols, or tools used.',
  ],
  market: [
    'Explain how your hack aligns with the event theme.',
    'Show real-world impact and who benefits.',
    'Differentiate from other hacks with similar approaches.',
    'Show potential for continued development.',
  ],
  delivery: [
    'Maintain high energy and enthusiasm throughout.',
    'Stay within the 3-minute time limit.',
    'Pause before key demo moments for emphasis.',
    'Use natural, conversational tone.',
  ],
};

const DEFAULT_ANTI_PATTERN_PLAYBOOK: Record<string, string> = {
  no_proof: 'Replace one abstract claim with one metric + timeframe + denominator.',
  no_ask: 'State raise amount, runway months, and 2-3 milestones funded.',
  tam_only: 'Follow TAM with ICP wedge, GTM motion, and proof of execution.',
  jargon_overload: 'Swap buzzwords for plain actions and measurable outcomes.',
  slide_overload: 'Tell spoken narrative first; slides should only support key proof.',
};

const YC_CANONICAL_DO_RULES = [
  'Lead with a clear one-liner before details.',
  'Tell a coherent story with simple language and concrete proof.',
  'Show traction with numbers tied to a timeframe.',
  'Explain the business model in plain terms.',
  'Close with a specific ask and milestone plan.',
  'Prioritize what investors must remember after the pitch ends.',
];

const YC_CANONICAL_DONT_RULES = [
  'Do not hide what you build until late in the pitch.',
  'Do not rely on buzzwords instead of concrete outcomes.',
  'Do not spend too long on problem setup before solution clarity.',
  'Do not end without a memorable close and explicit ask.',
  'Do not present TAM without execution evidence.',
  'Do not let slides dominate the narrative.',
];

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

function normalizeLine(line: string): string {
  return normalizeMojibake(line)
    .replace(JUNK_LINE_PATTERN, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function isInterviewerNoise(line: string): boolean {
  if (!line) return true;
  const lower = line.toLowerCase();
  if (lower.length < 12) return true;
  if (
    lower.startsWith('question') ||
    lower.startsWith('audience') ||
    lower.startsWith('judge') ||
    lower.includes('next question') ||
    lower.includes('thank you') ||
    lower.includes('can you repeat')
  ) {
    return true;
  }
  return lower.endsWith('?') && lower.split(/\s+/u).length <= 14;
}

function isLowQualityLine(line: string): boolean {
  if (!line) return true;
  if (line.length < 24) return true;
  if (RULE_MOJIBAKE.test(line)) return true;
  if (/^[-_=+*|`~]+$/u.test(line)) return true;
  if (/^\d+(\.\d+)?$/u.test(line)) return true;
  const words = line.split(/\s+/u);
  if (words.length < 6) return true;
  const alphaCount = (line.match(/[a-z]/giu) ?? []).length;
  const digitCount = (line.match(/[0-9]/gu) ?? []).length;
  return alphaCount < 12 || digitCount > alphaCount;
}

function dedupeRules(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const line of lines) {
    const normalized = clip(normalizeLine(line), MAX_RULE_CHARS);
    if (!normalized || isLowQualityLine(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }
  return output;
}

function isActionableRule(rule: string): boolean {
  const normalized = normalizeLine(rule);
  if (!normalized) return false;
  if (normalized.length < 28 || normalized.length > MAX_RULE_CHARS) return false;
  const lower = normalized.toLowerCase();
  if (
    lower.includes('while reading this guide') ||
    lower.includes('there is a more extensive reading list') ||
    lower.includes('it turns out that investors') ||
    lower.includes('for example') ||
    lower.startsWith('this is especially true') ||
    lower.startsWith('in that case')
  ) {
    return false;
  }
  if (/\b(i|we)\b/u.test(lower) && !lower.startsWith('do not')) return false;
  return /\b(lead|show|state|define|keep|focus|explain|close|avoid|replace|use|trim|cut)\b/u.test(
    lower,
  );
}

function isCompactDoRule(rule: string): boolean {
  const normalized = normalizeLine(rule);
  if (!isActionableRule(normalized)) return false;
  if (normalized.length > 90) return false;
  return /^(Lead|Show|State|Define|Keep|Focus|Explain|Close|Use|Trim|Cut)\b/u.test(
    normalized,
  );
}

function isCompactDontRule(rule: string): boolean {
  const normalized = normalizeLine(rule);
  if (!isActionableRule(normalized)) return false;
  if (normalized.length > 95) return false;
  return /^(Do not|Avoid)\b/u.test(normalized);
}

function toSentenceUnits(lines: string[]): string[] {
  const joined = lines.join(' ');
  const punct = joined
    .split(/(?<=[.!?])\s+/u)
    .map((part) => normalizeLine(part))
    .filter((part) => part.length > 0);

  if (punct.length >= 8) {
    return punct;
  }

  const windows: string[] = [];
  const windowSize = 3;
  for (let index = 0; index < lines.length; index += windowSize) {
    const chunk = normalizeLine(lines.slice(index, index + windowSize).join(' '));
    if (chunk.length > 0) windows.push(chunk);
  }
  return windows;
}

function extractBeats(units: string[]): Record<string, string[]> {
  const beats: Record<string, string[]> = {};

  for (const [beat, patterns] of Object.entries(BEAT_PATTERNS)) {
    const matches: string[] = [];
    for (const unit of units) {
      if (!patterns.some((pattern) => pattern.test(unit))) continue;
      if (isLowQualityLine(unit)) continue;
      matches.push(clip(unit, MAX_BEAT_SNIPPET_CHARS));
      if (matches.length >= MAX_BEAT_EXAMPLES_PER_BEAT) break;
    }
    beats[beat] = dedupeRules(matches);
  }

  return beats;
}

function detectAntiPatterns(text: string): Set<string> {
  const hits = new Set<string>();
  const lower = text.toLowerCase();
  const hasAsk = /\b(raising|ask|use of funds|round)\b/u.test(lower);
  const hasProof = /\b(\d+%|\$\d+|arr|mrr|revenue|retention|growth|customers)\b/u.test(
    lower,
  );
  const hasTam = /\b(tam|sam|som|market size)\b/u.test(lower);

  const jargonHits = JARGON_TERMS.reduce((count, term) => {
    const regex = new RegExp(`\\b${term.replace('-', '[- ]')}\\b`, 'gu');
    return count + (lower.match(regex)?.length ?? 0);
  }, 0);

  if (jargonHits >= 3) hits.add('jargon_overload');
  if (!hasAsk) hits.add('no_ask');
  if (!hasProof) hits.add('no_proof');
  if (hasTam && !hasProof) hits.add('tam_only');
  if ((lower.match(/\bslide\b/gu)?.length ?? 0) >= 4) hits.add('slide_overload');
  return hits;
}

function sourceWeightFor(sourceId: string): number {
  const normalized = sourceId.toLowerCase();
  if (normalized.startsWith('yc-')) return 1.0;
  if (normalized.includes('openvc') || normalized.includes('sequoia')) return 0.7;
  if (normalized.includes('slidebean')) return 0.5;
  if (normalized === 'local-corpus') return 0.4;
  return 0.5;
}

async function listSnapshotFiles(): Promise<string[]> {
  try {
    const dateFolders = await fs.readdir(SNAPSHOTS_DIR);
    const files: string[] = [];
    for (const dateFolder of dateFolders) {
      const fullDatePath = path.join(SNAPSHOTS_DIR, dateFolder);
      const stat = await fs.stat(fullDatePath);
      if (!stat.isDirectory()) continue;
      const dateFiles = await fs.readdir(fullDatePath);
      for (const file of dateFiles) {
        if (file.endsWith('.json')) {
          files.push(path.join(fullDatePath, file));
        }
      }
    }
    return files.sort();
  } catch {
    return [];
  }
}

async function loadSnapshotRecords(): Promise<SnapshotRecord[]> {
  const files = await listSnapshotFiles();
  const records: SnapshotRecord[] = [];

  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw.replace(/^\uFEFF/u, '')) as Partial<SnapshotRecord>;
      if (!parsed.source_id || !parsed.source_url || !parsed.source_title) continue;

      records.push({
        source_id: parsed.source_id,
        source_url: parsed.source_url,
        source_title: parsed.source_title,
        access_status: parsed.access_status ?? 'partial',
        snapshot_date:
          parsed.snapshot_date ??
          path.basename(path.dirname(file), path.extname(path.dirname(file))),
        confidence_score: parsed.confidence_score ?? 0.5,
        key_rules_do: parsed.key_rules_do ?? [],
        key_rules_dont: parsed.key_rules_dont ?? [],
      });
    } catch {
      // Continue processing remaining files.
    }
  }

  return records;
}

async function buildCorpusSignals(): Promise<{
  beatExamples: Record<string, string[]>;
  antiPatternCounts: Record<string, number>;
  transcriptCount: number;
}> {
  const beatExamples: Record<string, string[]> = {};
  const antiPatternCounts: Record<string, number> = {
    jargon_overload: 0,
    no_ask: 0,
    no_proof: 0,
    tam_only: 0,
    slide_overload: 0,
  };

  let transcriptCount = 0;
  const files = await fs.readdir(CORPUS_DIR);
  for (const file of files.sort()) {
    if (!file.toLowerCase().endsWith('.txt')) continue;

    const content = await fs.readFile(path.join(CORPUS_DIR, file), 'utf8');

    const normalizedLines = content
      .split(/\r?\n/u)
      .map(normalizeLine)
      .filter((line) => line.length > 0)
      .filter((line) => !isInterviewerNoise(line))
      .filter((line) => !isLowQualityLine(line));

    if (normalizedLines.length === 0) continue;

    transcriptCount += 1;
    const normalizedText = normalizedLines.join(' ');
    const beats = extractBeats(toSentenceUnits(normalizedLines));

    for (const [beat, lines] of Object.entries(beats)) {
      if (!beatExamples[beat]) beatExamples[beat] = [];
      beatExamples[beat].push(...lines);
      beatExamples[beat] = dedupeRules(beatExamples[beat]).slice(
        0,
        MAX_BEAT_EXAMPLES_PER_BEAT,
      );
    }

    for (const antiPattern of detectAntiPatterns(normalizedText)) {
      antiPatternCounts[antiPattern] = (antiPatternCounts[antiPattern] ?? 0) + 1;
    }
  }

  return { beatExamples, antiPatternCounts, transcriptCount };
}

function toHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function hashIfExists(filePath: string): Promise<string> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return toHash(raw.replace(/^\uFEFF/u, ''));
  } catch {
    return '';
  }
}

async function updateManifest(patternsRaw: string): Promise<void> {
  const manifestRaw = await fs.readFile(MANIFEST_FILE, 'utf8');
  const manifest = JSON.parse(manifestRaw.replace(/^\uFEFF/u, '')) as {
    generated_at: string;
    sources: Array<{
      id: string;
      snapshot_path: string;
      hash_sha256: string;
      kind: string;
    }>;
    artifacts: Array<{ path: string; hash_sha256: string }>;
  };

  manifest.generated_at = new Date().toISOString();
  manifest.sources = await Promise.all(
    (manifest.sources ?? []).map(async (source) => {
      if (source.kind === 'local_corpus') {
        const files = await fs.readdir(CORPUS_DIR);
        const joined = files
          .filter((name) => name.toLowerCase().endsWith('.txt'))
          .sort()
          .join('|');
        return { ...source, hash_sha256: toHash(joined) };
      }
      const fullPath = path.isAbsolute(source.snapshot_path)
        ? source.snapshot_path
        : path.join(ROOT, source.snapshot_path);
      return {
        ...source,
        hash_sha256: await hashIfExists(fullPath),
      };
    }),
  );

  manifest.artifacts = await Promise.all(
    manifest.artifacts.map(async (artifact) => {
      if (artifact.path === 'knowledge/patterns.v1.json') {
        return {
          ...artifact,
          hash_sha256: toHash(patternsRaw),
        };
      }
      const fullPath = path.join(ROOT, artifact.path);
      return {
        ...artifact,
        hash_sha256: await hashIfExists(fullPath),
      };
    }),
  );

  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
}

async function readCuratedNotes(): Promise<string> {
  try {
    const raw = await fs.readFile(CURATED_NOTES_FILE, 'utf8');
    return normalizeMojibake(raw.replace(/^\uFEFF/u, '')).trim();
  } catch {
    return '';
  }
}

function buildSourceWeights(sourceCitations: SnapshotCitation[]): Record<string, number> {
  const output: Record<string, number> = {
    'local-corpus': 0.4,
  };
  for (const citation of sourceCitations) {
    output[citation.source_id] = sourceWeightFor(citation.source_id);
  }
  return output;
}

function extractRuleCandidates(rawRule: string): string[] {
  const normalized = normalizeLine(rawRule);
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => clip(normalizeLine(sentence), MAX_RULE_CHARS))
    .filter((sentence) => sentence.length > 0);

  const cleaned = dedupeRules(sentences);
  return cleaned.length > 0 ? cleaned : dedupeRules([normalized]);
}

function pickTopRules(
  records: SnapshotRecord[],
  kind: 'do' | 'dont',
  maxItems: number,
): Array<{ sourceId: string; text: string }> {
  const prioritized = [...records].sort((left, right) => {
    const leftWeight = sourceWeightFor(left.source_id) * (left.confidence_score ?? 0.5);
    const rightWeight = sourceWeightFor(right.source_id) * (right.confidence_score ?? 0.5);
    return rightWeight - leftWeight;
  });

  const picked: Array<{ sourceId: string; text: string }> = [];
  const seen = new Set<string>();

  for (const record of prioritized) {
    const rules = kind === 'do' ? record.key_rules_do ?? [] : record.key_rules_dont ?? [];
    for (const rawRule of rules) {
      const candidates = extractRuleCandidates(rawRule);
      for (const candidate of candidates) {
        if (!isActionableRule(candidate)) continue;
        const key = candidate.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push({ sourceId: record.source_id, text: candidate });
        if (picked.length >= maxItems) return picked;
      }
    }
  }

  return picked;
}

function deriveJudgeGuidance(params: {
  curatedDoRules: Array<{ sourceId: string; text: string }>;
  curatedDontRules: Array<{ sourceId: string; text: string }>;
  antiPatternCounts: Record<string, number>;
}): BuildOutput['judge_guidance'] {
  const compactCuratedDo = params.curatedDoRules
    .map((item) => item.text)
    .filter(isCompactDoRule)
    .slice(0, 4);
  const compactCuratedDont = params.curatedDontRules
    .map((item) => item.text)
    .filter(isCompactDontRule)
    .slice(0, 4);

  const doRules = dedupeRules([
    ...YC_CANONICAL_DO_RULES,
    ...compactCuratedDo,
    params.antiPatternCounts.no_proof > 0
      ? 'Lead with one traction metric before describing broad market upside.'
      : '',
    params.antiPatternCounts.no_ask > 0
      ? 'State exactly what you are raising and which milestones it funds.'
      : '',
    params.antiPatternCounts.jargon_overload > 0
      ? 'Use plain claims first, then add one proof datapoint per claim.'
      : '',
  ]).slice(0, 12);

  const dontRules = dedupeRules([
    ...YC_CANONICAL_DONT_RULES,
    ...compactCuratedDont,
    params.antiPatternCounts.tam_only > 0
      ? 'Do not rely on TAM numbers without GTM and customer evidence.'
      : '',
    params.antiPatternCounts.slide_overload > 0
      ? 'Do not narrate slide-by-slide at the expense of your spoken story.'
      : '',
  ]).slice(0, 12);

  const category_guidance = {
    structure: DEFAULT_CATEGORY_GUIDANCE.structure.slice(0, 5).map((rule) => clip(rule, MAX_RULE_CHARS)),
    clarity: DEFAULT_CATEGORY_GUIDANCE.clarity.slice(0, 5).map((rule) => clip(rule, MAX_RULE_CHARS)),
    evidence: DEFAULT_CATEGORY_GUIDANCE.evidence.slice(0, 5).map((rule) => clip(rule, MAX_RULE_CHARS)),
    market: DEFAULT_CATEGORY_GUIDANCE.market.slice(0, 5).map((rule) => clip(rule, MAX_RULE_CHARS)),
    delivery: DEFAULT_CATEGORY_GUIDANCE.delivery.slice(0, 5).map((rule) => clip(rule, MAX_RULE_CHARS)),
  } satisfies Record<JudgeGuidanceCategory, string[]>;

  const anti_pattern_playbook = Object.fromEntries(
    Object.entries(DEFAULT_ANTI_PATTERN_PLAYBOOK).map(([key, value]) => [
      key,
      clip(value, MAX_RULE_CHARS),
    ]),
  );

  return {
    do_rules: doRules,
    dont_rules: dontRules,
    category_guidance,
    anti_pattern_playbook,
    digest_version: `${KNOWLEDGE_VERSION}-digest.1`,
  };
}

function corpusSummaryLine(
  beatExamples: Record<string, string[]>,
  beat: keyof typeof BEAT_PATTERNS,
  fallback: string,
): string {
  const sample = beatExamples[beat]?.[0];
  if (!sample) return fallback;
  return clip(sample, MAX_PATTERN_CHARS);
}

async function main(): Promise<void> {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });

  const { beatExamples, antiPatternCounts, transcriptCount } = await buildCorpusSignals();
  const snapshotRecords = await loadSnapshotRecords();
  const sourceCitations: SnapshotCitation[] = snapshotRecords.map((record) => ({
    source_id: record.source_id,
    source_url: record.source_url,
    source_title: record.source_title,
    access_status: record.access_status,
    snapshot_date: record.snapshot_date,
    confidence_score: record.confidence_score,
  }));
  const sourceWeights = buildSourceWeights(sourceCitations);
  const curatedNotes = await readCuratedNotes();

  const curatedDoRules = pickTopRules(snapshotRecords, 'do', 20);
  const curatedDontRules = pickTopRules(snapshotRecords, 'dont', 20);
  const judgeGuidance = deriveJudgeGuidance({
    curatedDoRules,
    curatedDontRules,
    antiPatternCounts,
  });

  const positivePatterns: PatternRecord[] = [
    {
      id: 'open-with-clarity',
      title: 'Clear one-line positioning',
      stage: 'all',
      text: judgeGuidance.do_rules[0] ?? 'Open with a clear company + customer + outcome line.',
      weight: 1.3,
      citations: ['yc-how-to-pitch', 'local-corpus'],
    },
    {
      id: 'proof-before-expansion',
      title: 'Evidence before expansion claims',
      stage: 'all',
      text:
        judgeGuidance.category_guidance.evidence[0] ??
        'Support each major claim with one concrete datapoint.',
      weight: 1.35,
      citations: ['yc-demo-day-guide', 'local-corpus'],
    },
    {
      id: 'ask-with-milestones',
      title: 'Ask tied to milestones',
      stage: 'seed',
      text:
        judgeGuidance.anti_pattern_playbook.no_ask ??
        'End with amount raised and milestone outcomes.',
      weight: 1.3,
      citations: ['yc-seed-deck', 'local-corpus'],
    },
    {
      id: 'corpus-problem-pattern',
      title: 'Corpus pattern: concrete problem framing',
      stage: 'all',
      text: corpusSummaryLine(
        beatExamples,
        'problem',
        'Strong pitches quickly state a concrete economic pain and who feels it.',
      ),
      weight: 1.05,
      citations: ['local-corpus'],
    },
    {
      id: 'corpus-proof-pattern',
      title: 'Corpus pattern: quant proof signal',
      stage: 'all',
      text: corpusSummaryLine(
        beatExamples,
        'proof',
        'Strong pitches support claims with quant evidence and timeframe.',
      ),
      weight: 1.1,
      citations: ['local-corpus'],
    },
  ].map(
    (entry): PatternRecord => ({
      id: entry.id,
      title: entry.title,
      stage: entry.stage as PatternRecord['stage'],
      text: clip(entry.text, MAX_PATTERN_CHARS),
      weight: entry.weight,
      citations: entry.citations,
    }),
  );

  if (curatedNotes.length > 0) {
    positivePatterns.push({
      id: 'deck-shared-dna',
      title: 'Deck narrative shared DNA',
      stage: 'all' as const,
      text: clip(curatedNotes, MAX_PATTERN_CHARS),
      weight: 1.0,
      citations: ['local-corpus'],
    });
  }

  const antiPatterns: AntiPatternRecord[] = [
    {
      id: 'jargon-overload',
      label: 'jargon_overload',
      description:
        'High buzzword density with weak operational specificity and unclear claim support.',
      default_weight: antiPatternCounts.jargon_overload > 0 ? 2.5 : 2.0,
      citations: ['local-corpus', 'yc-how-to-pitch'],
    },
    {
      id: 'no-ask',
      label: 'no_ask',
      description: 'Missing explicit raise ask or disconnected use-of-funds plan.',
      default_weight: antiPatternCounts.no_ask > 0 ? 3.2 : 3.0,
      citations: ['local-corpus', 'yc-demo-day-guide', 'yc-seed-deck'],
    },
    {
      id: 'no-proof',
      label: 'no_proof',
      description: 'Claims with weak or missing measurable proof points.',
      default_weight: antiPatternCounts.no_proof > 0 ? 2.8 : 2.6,
      citations: ['local-corpus', 'yc-how-to-pitch'],
    },
    {
      id: 'tam-only',
      label: 'tam_only',
      description: 'TAM-heavy framing without traction, GTM, or customer evidence.',
      default_weight: antiPatternCounts.tam_only > 0 ? 2.6 : 2.4,
      citations: ['local-corpus', 'yc-investor-vs-customer-pitch'],
    },
    {
      id: 'slide-overload',
      label: 'slide_overload',
      description: 'Narrative overwhelmed by excessive slide references or dense structure.',
      default_weight: antiPatternCounts.slide_overload > 0 ? 1.9 : 1.6,
      citations: ['local-corpus', 'yc-demo-day-guide'],
    },
  ];

  const ycDoRules = curatedDoRules
    .filter((rule) => rule.sourceId.startsWith('yc-'))
    .map((rule) => rule.text);

  const output: BuildOutput = {
    knowledge_version: KNOWLEDGE_VERSION,
    built_at: new Date().toISOString(),
    positive_patterns: positivePatterns.slice(0, 16),
    anti_patterns: antiPatterns,
    stage_expectations: {
      pre_seed: [
        'Demonstrate founder insight and urgency.',
        'Show a narrow wedge and clear early user profile.',
        'Anchor claims with concrete pilot or demand proof.',
      ],
      seed: [
        'Show repeatability in acquisition or retention.',
        'State clear differentiation against alternatives.',
        'Connect ask to 12-18 month milestones.',
      ],
      series_a: [
        'Present growth mechanics and unit economics together.',
        'Show why scale improves defensibility.',
        'Tie funding to execution milestones and hiring plan.',
      ],
      series_b: [
        'Show operating leverage and category strategy.',
        'Demonstrate durable moat under competition.',
        'Provide benchmarked scale economics and expansion plan.',
      ],
    },
    deck_structure_templates: [
      {
        name: 'Core Fundraising Narrative',
        slides: [
          'One-liner',
          'Problem',
          'Solution',
          'Traction',
          'Market',
          'Competition',
          'GTM',
          'Team',
          'Ask + Milestones',
        ],
      },
      {
        name: 'Demo-Day Spoken Narrative',
        slides: [
          'Hook',
          'Problem urgency',
          'Product mechanism',
          'Proof points',
          'Market and wedge',
          'Close ask',
        ],
      },
    ],
    benchmark_profiles: {
      yc_top_decile: dedupeRules([...judgeGuidance.do_rules, ...ycDoRules]).slice(0, 6),
      yc_median: dedupeRules([
        transcriptCount > 0
          ? `Corpus baseline from ${transcriptCount} pitches: one-liner and problem are usually present.`
          : 'Corpus baseline unavailable: use standard one-liner + problem + proof flow.',
        corpusSummaryLine(
          beatExamples,
          'one_liner',
          'Median pitches usually include a one-liner but lack strong differentiation.',
        ),
        corpusSummaryLine(
          beatExamples,
          'ask',
          'Median pitches mention an ask but often miss milestone linkage.',
        ),
      ]).slice(0, 6),
      common_failures: dedupeRules([...judgeGuidance.dont_rules, ...curatedDontRules.map((r) => r.text)]).slice(0, 8),
    },
    judge_guidance: judgeGuidance,
    hackathon: {
      beat_patterns: Object.keys(HACKATHON_BEAT_PATTERNS),
      anti_patterns: ['no_demo', 'no_theme_alignment', 'slides_only', 'too_many_features', 'no_cta'],
      category_guidance: HACKATHON_CATEGORY_GUIDANCE,
      benchmark_profiles: {
        hackathon_winner: [
          'Working demo shown within first 60 seconds.',
          'Single core innovation explained clearly.',
          'Theme alignment explicitly stated.',
          'Technical implementation depth demonstrated.',
          'Clear call-to-action at the end.',
          'High energy, natural delivery within 3 minutes.',
        ],
        common_failures: [
          'Slides-only presentation without working demo.',
          'Too many features listed without depth on any.',
          'No connection to hackathon theme or challenge.',
          'No clear ask or call-to-action at the end.',
          'Overly technical explanation without showing impact.',
        ],
      },
    },
    source_weights: sourceWeights,
    source_citations: sourceCitations,
  };

  const serialized = JSON.stringify(output, null, 2);
  await fs.writeFile(PATTERNS_FILE, serialized, 'utf8');
  await updateManifest(serialized);

  // eslint-disable-next-line no-console
  console.log(`Knowledge pack rebuilt: ${path.relative(ROOT, PATTERNS_FILE)}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to build knowledge pack:', error);
  process.exitCode = 1;
});
