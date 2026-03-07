import type { InputType, PitchMode } from '@/types/pitch';

export interface NormalizedRubricBreakdownItem {
  category: string;
  score: number;
  max_score: number;
}

export interface NormalizedDeliveryMetrics {
  wpm: number;
  duration_seconds: number;
  filler_words: { word: string; count: number }[];
  repeated_phrases: string[];
  within_time_limit: boolean;
}

export interface NormalizedRunRecord {
  id: string;
  projectId?: string;
  mode: PitchMode;
  inputType: InputType;
  overallScore: number;
  createdAt: string;
  audioUrl?: string;
  projectName?: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: NormalizedRubricBreakdownItem[];
    delivery_metrics: NormalizedDeliveryMetrics;
  };
}

const DEFAULT_DELIVERY_METRICS: NormalizedDeliveryMetrics = {
  wpm: 0,
  duration_seconds: 0,
  filler_words: [],
  repeated_phrases: [],
  within_time_limit: false,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCategory(rawCategory: string): string {
  const normalized = rawCategory.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (normalized.includes('structure') || normalized.includes('narrative')) return 'structure';
  if (normalized.includes('clarity') || normalized.includes('concision')) return 'clarity';
  if (
    normalized.includes('evidence') ||
    normalized.includes('traction') ||
    normalized.includes('proof')
  ) {
    return 'evidence';
  }
  if (
    normalized.includes('market') ||
    normalized.includes('competition') ||
    normalized.includes('moat') ||
    normalized.includes('ask')
  ) {
    return 'market';
  }
  if (
    normalized.includes('delivery') ||
    normalized.includes('pace') ||
    normalized.includes('design') ||
    normalized.includes('speaking')
  ) {
    return 'delivery';
  }
  return normalized;
}

function getObjectField(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) {
      return source[key];
    }
  }
  return undefined;
}

function normalizeRubricBreakdown(value: unknown): NormalizedRubricBreakdownItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item)) return null;
      const categoryRaw = item.category;
      const category = typeof categoryRaw === 'string' ? normalizeCategory(categoryRaw) : null;
      if (typeof category !== 'string' || category.trim().length === 0) return null;
      const rawScore = toFiniteNumber(item.score, 0);
      const rawMax = toFiniteNumber(item.max_score ?? item.maxScore, 20);
      const scaledScore = rawScore > 0 && rawScore <= 1.2 ? rawScore * 20 : rawScore;
      const scaledMax = rawMax > 0 && rawMax <= 1.2 ? rawMax * 20 : rawMax;
      return {
        category,
        score: scaledScore,
        max_score: scaledMax,
      };
    })
    .filter((item): item is NormalizedRubricBreakdownItem => item !== null);
}

function normalizeFillerWords(value: unknown): { word: string; count: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item) || typeof item.word !== 'string') return null;
      return { word: item.word, count: toFiniteNumber(item.count, 0) };
    })
    .filter((item): item is { word: string; count: number } => item !== null);
}

function normalizeRepeatedPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (isObject(item) && typeof item.phrase === 'string') return item.phrase;
      return null;
    })
    .filter((item): item is string => item !== null && item.trim().length > 0);
}

function normalizeDeliveryMetrics(value: unknown): NormalizedDeliveryMetrics {
  if (!isObject(value)) return DEFAULT_DELIVERY_METRICS;
  const rawWpm = toFiniteNumber(value.wpm, 0);
  return {
    wpm: rawWpm > 0 && rawWpm <= 2 ? rawWpm * 140 : rawWpm,
    duration_seconds: toFiniteNumber(value.duration_seconds ?? value.durationSeconds, 0),
    filler_words: normalizeFillerWords(value.filler_words ?? value.fillerWords),
    repeated_phrases: normalizeRepeatedPhrases(value.repeated_phrases ?? value.repeatedPhrases),
    within_time_limit: Boolean(value.within_time_limit),
  };
}

function extractFeedback(rawRun: Record<string, unknown>): Record<string, unknown> | null {
  const analysis = isObject(rawRun.analysis) ? rawRun.analysis : null;
  const outputs = isObject(rawRun.outputs) ? rawRun.outputs : null;

  if (analysis && Array.isArray(analysis.rubric_breakdown)) {
    return analysis;
  }
  if (outputs && isObject(outputs.feedback)) {
    return outputs.feedback;
  }
  if (analysis && isObject(analysis.outputs) && isObject(analysis.outputs.feedback)) {
    return analysis.outputs.feedback;
  }
  if (analysis && isObject(analysis.analysis) && Array.isArray(analysis.analysis.rubric_breakdown)) {
    return analysis.analysis;
  }
  return null;
}

function parseMode(value: unknown): PitchMode {
  return value === 'elevator' || value === 'vc_pitch' ? value : 'vc_pitch';
}

function parseInputType(value: unknown): InputType {
  return value === 'audio' || value === 'upload' || value === 'text' ? value : 'text';
}

function parseRunRecord(raw: unknown): NormalizedRunRecord | null {
  if (!isObject(raw)) return null;

  const id = typeof raw.id === 'string' ? raw.id : null;
  const mode = parseMode(raw.mode);
  const createdAt = toIsoDate(raw.createdAt ?? raw.created_at);
  const feedback = extractFeedback(raw);
  if (!id || !createdAt || !feedback) return null;

  const rubric_breakdown = normalizeRubricBreakdown(
    getObjectField(feedback, ['rubric_breakdown', 'rubricBreakdown']),
  );
  const delivery_metrics = normalizeDeliveryMetrics(
    getObjectField(feedback, ['delivery_metrics', 'deliveryMetrics']),
  );

  const rawOverall = toFiniteNumber(raw.overallScore ?? raw.overall_score, Number.NaN);
  const feedbackOverall = toFiniteNumber(
    getObjectField(feedback, ['overall_score', 'overallScore']),
    Number.NaN,
  );
  const selectedOverall = Number.isFinite(rawOverall) && rawOverall > 0
    ? rawOverall
    : Number.isFinite(feedbackOverall)
      ? feedbackOverall
      : 0;
  const overallScore =
    selectedOverall > 0 && selectedOverall <= 1.2 ? selectedOverall * 100 : selectedOverall;

  const oneLineVerdict = getObjectField(feedback, ['one_line_verdict', 'oneLineVerdict']);
  const audioUrl = getObjectField(raw, ['audioUrl', 'audio_url']);
  const projectId = getObjectField(raw, ['projectId', 'project_id']);
  const projectName = getObjectField(raw, ['projectName', 'project_name']);
  const inputType = parseInputType(getObjectField(raw, ['inputType', 'input_type']));

  return {
    id,
    projectId: typeof projectId === 'string' ? projectId : undefined,
    mode,
    inputType,
    overallScore,
    createdAt,
    audioUrl: typeof audioUrl === 'string' ? audioUrl : undefined,
    projectName: typeof projectName === 'string' ? projectName : undefined,
    analysis: {
      one_line_verdict: typeof oneLineVerdict === 'string' ? oneLineVerdict : '',
      rubric_breakdown,
      delivery_metrics,
    },
  };
}

export function normalizeRuns(rawRuns: unknown): NormalizedRunRecord[] {
  if (!Array.isArray(rawRuns)) return [];
  return rawRuns
    .map((run) => parseRunRecord(run))
    .filter((run): run is NormalizedRunRecord => run !== null);
}
