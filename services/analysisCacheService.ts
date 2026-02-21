import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { AnalysisResultV2, PitchStage } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface CacheEntry {
  key: string;
  createdAt: string;
  expiresAt: string;
  value: AnalysisResultV2;
}

interface CacheFile {
  entries: CacheEntry[];
}

export interface AnalysisCacheKeyInput {
  normalizedTranscript: string;
  mode: PitchMode;
  deckText?: string;
  stage: PitchStage;
  promptVersion: string;
  rubricVersion: string;
  knowledgeVersion: string;
}

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'pitch-analysis-cache.json');
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();
let loaded = false;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;

  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as CacheFile;
    for (const entry of parsed.entries ?? []) {
      if (Date.parse(entry.expiresAt) <= Date.now()) continue;
      memoryCache.set(entry.key, entry);
    }
  } catch {
    // File may not exist on first run.
  }
}

async function flushToDisk(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const payload: CacheFile = {
    entries: [...memoryCache.values()],
  };
  await fs.writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

export function buildAnalysisCacheKey(input: AnalysisCacheKeyInput): string {
  const deckHash = sha256((input.deckText ?? '').trim());
  const rawKey = [
    input.normalizedTranscript.trim(),
    input.mode,
    deckHash,
    input.stage,
    input.promptVersion,
    input.rubricVersion,
    input.knowledgeVersion,
  ].join('|');
  return sha256(rawKey);
}

export async function getCachedAnalysis(key: string): Promise<AnalysisResultV2 | null> {
  await ensureLoaded();
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.parse(entry.expiresAt) <= Date.now()) {
    memoryCache.delete(key);
    await flushToDisk();
    return null;
  }
  return entry.value;
}

export async function setCachedAnalysis(
  key: string,
  value: AnalysisResultV2,
  ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
  await ensureLoaded();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  memoryCache.set(key, {
    key,
    createdAt,
    expiresAt,
    value,
  });
  await flushToDisk();
}

export async function withInFlightDedup<T>(
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return (await existing) as T;
  }

  const promise = factory().finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return (await promise) as T;
}
