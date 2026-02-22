import { promises as fs } from 'fs';
import path from 'path';
import { queueResourceGap } from '@/services/qna/resourceGapService';
import type { Citation } from '@/types/analysis-v2';

interface KnowledgePattern {
  id: string;
  title: string;
  text: string;
  citations?: string[];
}

interface PatternsFile {
  positive_patterns?: KnowledgePattern[];
  source_citations?: Citation[];
}

interface ManifestFile {
  sources?: Array<{
    id: string;
    url: string;
    fetch_date?: string;
    kind?: string;
  }>;
}

export interface KnowledgeLookupResult {
  confidence: number;
  summary: string;
  citations: Citation[];
  matchedSnippets: string[];
}

const PATTERNS_FILE = path.join(process.cwd(), 'knowledge', 'patterns.v1.json');
const MANIFEST_FILE = path.join(process.cwd(), 'knowledge', 'manifest.json');

let cachedPatterns: PatternsFile | null = null;
let cachedManifest: ManifestFile | null = null;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? []).filter(
    (token) => token.length >= 3,
  );
}

function overlapScore(query: string[], content: string[]): number {
  if (query.length === 0 || content.length === 0) return 0;
  const contentSet = new Set(content);
  const shared = query.filter((token) => contentSet.has(token));
  return shared.length / query.length;
}

async function loadPatterns(): Promise<PatternsFile> {
  if (cachedPatterns) return cachedPatterns;
  try {
    const raw = await fs.readFile(PATTERNS_FILE, 'utf8');
    cachedPatterns = JSON.parse(raw.replace(/^\uFEFF/u, '')) as PatternsFile;
    return cachedPatterns;
  } catch {
    cachedPatterns = {};
    return cachedPatterns;
  }
}

async function loadManifest(): Promise<ManifestFile> {
  if (cachedManifest) return cachedManifest;
  try {
    const raw = await fs.readFile(MANIFEST_FILE, 'utf8');
    cachedManifest = JSON.parse(raw.replace(/^\uFEFF/u, '')) as ManifestFile;
    return cachedManifest;
  } catch {
    cachedManifest = {};
    return cachedManifest;
  }
}

function mapSourceToCitation(
  sourceId: string,
  sourceCitations: Citation[],
  manifest: ManifestFile,
): Citation {
  const existing = sourceCitations.find((citation) => citation.source_id === sourceId);
  if (existing) return existing;
  const source = manifest.sources?.find((item) => item.id === sourceId);
  return {
    source_id: sourceId,
    source_url: source?.url ?? '',
    source_title: sourceId,
    access_status: 'partial',
    snapshot_date: source?.fetch_date ?? new Date().toISOString().slice(0, 10),
    confidence_score: 0.5,
    excerpt: '',
  };
}

export async function lookupLocalKnowledge(queryText: string): Promise<KnowledgeLookupResult> {
  const [patterns, manifest] = await Promise.all([loadPatterns(), loadManifest()]);
  const queryTokens = tokenize(queryText);
  const candidates = (patterns.positive_patterns ?? []).map((pattern) => {
    const score = overlapScore(queryTokens, tokenize(`${pattern.title} ${pattern.text}`));
    return { pattern, score };
  });

  const topMatches = candidates
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const averageScore =
    topMatches.length === 0
      ? 0
      : topMatches.reduce((sum, entry) => sum + entry.score, 0) / topMatches.length;
  const confidence = Math.max(0.05, Math.min(0.95, averageScore));

  const sourceCitations = patterns.source_citations ?? [];
  const citations = topMatches.flatMap((entry) => {
    const sourceIds = entry.pattern.citations ?? [];
    return sourceIds.map((sourceId) => {
      const citation = mapSourceToCitation(sourceId, sourceCitations, manifest);
      return {
        ...citation,
        confidence_score: Math.max(citation.confidence_score, confidence),
        excerpt: entry.pattern.text.slice(0, 220),
      } satisfies Citation;
    });
  });

  const dedupedCitations = [...new Map(citations.map((citation) => [citation.source_id, citation])).values()].slice(
    0,
    4,
  );

  const matchedSnippets = topMatches.map((entry) => entry.pattern.text.slice(0, 260));
  const summary = matchedSnippets.join('\n');

  return {
    confidence,
    summary,
    citations: dedupedCitations,
    matchedSnippets,
  };
}

export async function queueKnowledgeGapIfNeeded(input: {
  runId?: string;
  qaSessionId?: string;
  topic: string;
  queryText: string;
  confidence: number;
  threshold?: number;
}): Promise<boolean> {
  const threshold = input.threshold ?? 0.35;
  if (input.confidence >= threshold) return false;

  await queueResourceGap({
    runId: input.runId,
    qaSessionId: input.qaSessionId,
    topic: input.topic,
    queryText: input.queryText,
    reason: `Low local knowledge confidence (${input.confidence.toFixed(3)}).`,
    meta: {
      confidence: input.confidence,
      threshold,
    },
  });
  return true;
}
