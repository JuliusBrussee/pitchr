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

const MAX_BEAT_SNIPPET_CHARS = 220;
const MAX_RULE_SNIPPET_CHARS = 220;
const MAX_BEAT_EXAMPLES_PER_BEAT = 10;

const BEAT_PATTERNS: Record<string, RegExp[]> = {
  one_liner: [/\bwe (build|are|help)\b/i, /\b(platform|company|tool) for\b/i],
  problem: [/\b(problem|pain|friction|broken|expensive|slow)\b/i],
  mechanism: [/\b(platform|product|engine|workflow|automate|model)\b/i],
  proof: [/\b(revenue|arr|growth|users|customers|pilot|retention)\b/i, /\d+%/i],
  differentiation: [/\b(unlike|differentiat|advantage|moat|defensible)\b/i],
  wedge: [/\b(icp|beachhead|segment|wedge|niche)\b/i],
  ask: [/\b(raising|ask|use of funds|round|capital)\b/i],
};

const JARGON_TERMS = [
  'revolutionary',
  'synergy',
  'disruptive',
  'next-gen',
  'game-changing',
  'best-in-class',
  'leverage',
];

function clip(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function normalizeLine(line: string): string {
  return line
    .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s+/u, '')
    .replace(/^\s*\[[^\]]+\]\s*/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function isInterviewerNoise(line: string): boolean {
  if (!line) return true;
  const lower = line.toLowerCase();
  if (lower.length < 2) return true;
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

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(line);
  }
  return output;
}

function toSentenceUnits(lines: string[]): string[] {
  const joined = lines.join(' ');
  const punct = joined
    .split(/(?<=[.!?])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (punct.length >= 8) return punct;

  // Fallback for timestamp-heavy transcripts with little punctuation.
  const windows: string[] = [];
  const windowSize = 3;
  for (let index = 0; index < lines.length; index += windowSize) {
    const chunk = lines.slice(index, index + windowSize).join(' ').trim();
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
      matches.push(clip(unit, MAX_BEAT_SNIPPET_CHARS));
      if (matches.length >= MAX_BEAT_EXAMPLES_PER_BEAT) break;
    }
    beats[beat] = dedupeLines(matches);
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
    return files;
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
}> {
  const beatExamples: Record<string, string[]> = {};
  const antiPatternCounts: Record<string, number> = {
    jargon_overload: 0,
    no_ask: 0,
    no_proof: 0,
    tam_only: 0,
    slide_overload: 0,
  };

  const files = await fs.readdir(CORPUS_DIR);
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.txt')) continue;
    const content = await fs.readFile(path.join(CORPUS_DIR, file), 'utf8');

    const normalizedLines = dedupeLines(
      content
        .split(/\r?\n/u)
        .map(normalizeLine)
        .filter((line) => line.length > 0)
        .filter((line) => !isInterviewerNoise(line)),
    );

    const normalizedText = normalizedLines.join(' ');
    const beats = extractBeats(toSentenceUnits(normalizedLines));

    for (const [beat, lines] of Object.entries(beats)) {
      if (!beatExamples[beat]) beatExamples[beat] = [];
      beatExamples[beat].push(...lines);
      beatExamples[beat] = dedupeLines(beatExamples[beat]).slice(
        0,
        MAX_BEAT_EXAMPLES_PER_BEAT,
      );
    }

    for (const antiPattern of detectAntiPatterns(normalizedText)) {
      antiPatternCounts[antiPattern] = (antiPatternCounts[antiPattern] ?? 0) + 1;
    }
  }

  return { beatExamples, antiPatternCounts };
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
    return raw.replace(/^\uFEFF/u, '').trim();
  } catch {
    return '';
  }
}

function buildSourceWeights(
  sourceCitations: SnapshotCitation[],
): Record<string, number> {
  const output: Record<string, number> = {
    'local-corpus': 0.4,
  };
  for (const citation of sourceCitations) {
    output[citation.source_id] = sourceWeightFor(citation.source_id);
  }
  return output;
}

function normalizeRule(rule: string): string {
  return clip(rule.replace(/\s+/gu, ' ').trim(), MAX_RULE_SNIPPET_CHARS);
}

function pickTopRules(
  records: SnapshotRecord[],
  kind: 'do' | 'dont',
  maxItems: number,
): Array<{ sourceId: string; text: string }> {
  const prioritized = [...records].sort((left, right) => {
    const leftWeight =
      sourceWeightFor(left.source_id) * (left.confidence_score ?? 0.5);
    const rightWeight =
      sourceWeightFor(right.source_id) * (right.confidence_score ?? 0.5);
    return rightWeight - leftWeight;
  });

  const picked: Array<{ sourceId: string; text: string }> = [];
  const seen = new Set<string>();
  for (const record of prioritized) {
    const rules =
      kind === 'do' ? record.key_rules_do ?? [] : record.key_rules_dont ?? [];
    for (const rule of rules) {
      const normalized = normalizeRule(rule);
      if (!normalized || seen.has(normalized.toLowerCase())) continue;
      seen.add(normalized.toLowerCase());
      picked.push({ sourceId: record.source_id, text: normalized });
      if (picked.length >= maxItems) return picked;
    }
  }
  return picked;
}

async function main(): Promise<void> {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });

  const { beatExamples, antiPatternCounts } = await buildCorpusSignals();
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

  const curatedDoRules = pickTopRules(snapshotRecords, 'do', 8);
  const curatedDontRules = pickTopRules(snapshotRecords, 'dont', 8);

  const positivePatterns: PatternRecord[] = [
    {
      id: 'beat-one-liner',
      title: 'One-line positioning',
      stage: 'all',
      text:
        beatExamples.one_liner?.[0] ??
        'Lead with a direct one-line description of company + customer outcome.',
      weight: 1.2,
      citations: ['local-corpus'],
    },
    {
      id: 'beat-proof',
      title: 'Evidence-forward traction',
      stage: 'all',
      text:
        beatExamples.proof?.[0] ??
        'Support key claims with concrete proof and a clear timeframe.',
      weight: 1.4,
      citations: ['local-corpus'],
    },
    {
      id: 'beat-ask',
      title: 'Explicit ask and milestones',
      stage: 'seed',
      text:
        beatExamples.ask?.[0] ??
        'Close with an explicit ask linked to measurable milestones.',
      weight: 1.3,
      citations: ['local-corpus'],
    },
  ];

  if (curatedNotes.length > 0) {
    positivePatterns.push({
      id: 'deck-shared-dna',
      title: 'Shared DNA and stage alignment',
      stage: 'all',
      text: clip(curatedNotes, 500),
      weight: 1.1,
      citations: ['local-corpus'],
    });
  }

  curatedDoRules.forEach((rule, index) => {
    positivePatterns.push({
      id: `curated-do-${index + 1}`,
      title: `Curated best practice ${index + 1}`,
      stage: 'all',
      text: rule.text,
      weight: 1.0,
      citations: [rule.sourceId],
    });
  });

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

  const output: BuildOutput = {
    knowledge_version: 'v1.1.0',
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
      yc_top_decile: curatedDoRules
        .filter((rule) => rule.sourceId.startsWith('yc-'))
        .map((rule) => rule.text)
        .slice(0, 6),
      yc_median: [
        beatExamples.one_liner?.[0] ?? 'Clear one-liner present but not highly differentiated.',
        beatExamples.problem?.[0] ?? 'Problem statement exists but lacks urgency detail.',
        beatExamples.ask?.[0] ?? 'Ask is mentioned but milestone linkage is often weak.',
      ].map((item) => clip(item, MAX_RULE_SNIPPET_CHARS)),
      common_failures: curatedDontRules.map((rule) => rule.text).slice(0, 8),
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
