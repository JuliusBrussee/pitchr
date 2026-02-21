import { PITCH_MODE_CONFIG } from '@/config/modes';
import type {
  AntiPatternHit,
  DeliveryMetrics,
  DeckRubricCategory,
  RubricCategory,
  RubricScore,
} from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const FILLER_WORD_PATTERNS: Array<{ word: string; pattern: RegExp }> = [
  { word: 'um', pattern: /\bum\b/giu },
  { word: 'uh', pattern: /\buh\b/giu },
  { word: 'like', pattern: /\blike\b/giu },
  { word: 'basically', pattern: /\bbasically\b/giu },
  { word: 'actually', pattern: /\bactually\b/giu },
  { word: 'you know', pattern: /\byou\s+know\b/giu },
  { word: 'sort of', pattern: /\bsort\s+of\b/giu },
  { word: 'kind of', pattern: /\bkind\s+of\b/giu },
];

const DISFLUENCY_PATTERNS = [
  /\b(um+|uh+|er+|ah+|hmm+)\b/giu,
  /\b([a-z]+)\s+\1\b/giu,
  /\b(i|we|the)\s+\1\b/giu,
];

interface SegmentLike {
  start?: number;
  end?: number;
  text?: string;
}

interface DeliveryInput {
  transcript: string;
  mode: PitchMode;
  durationSeconds?: number;
  segments?: SegmentLike[];
}

interface CompositeScoreInput {
  spokenRubric: RubricScore[];
  deckRubric: RubricScore[];
  delivery20: number;
  antiPatternHits: AntiPatternHit[];
  hasDeck: boolean;
}

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeTokens(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? []).filter(Boolean);
}

function getWordCount(text: string): number {
  return normalizeTokens(text).length;
}

function getDurationFromSegments(segments: SegmentLike[] | undefined): number | null {
  if (!segments || segments.length === 0) return null;
  const starts = segments
    .map((segment) => segment.start)
    .filter((value): value is number => typeof value === 'number' && value >= 0);
  const ends = segments
    .map((segment) => segment.end)
    .filter((value): value is number => typeof value === 'number' && value >= 0);
  if (starts.length === 0 || ends.length === 0) return null;
  const start = Math.min(...starts);
  const end = Math.max(...ends);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return end - start;
}

function getDurationSeconds({
  transcript,
  mode,
  durationSeconds,
  segments,
}: DeliveryInput): number {
  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    return durationSeconds;
  }
  const segmentDuration = getDurationFromSegments(segments);
  if (segmentDuration && segmentDuration > 0) {
    return segmentDuration;
  }
  const wc = getWordCount(transcript);
  if (wc === 0) {
    const modeConfig = PITCH_MODE_CONFIG[mode];
    return modeConfig.targetDurationSeconds;
  }
  // Fallback duration estimate from locked formula.
  return (wc / 140) * 60;
}

function getFillerWords(transcript: string): DeliveryMetrics['filler_words'] {
  return FILLER_WORD_PATTERNS.map(({ word, pattern }) => ({
    word,
    count: transcript.match(pattern)?.length ?? 0,
  })).filter((entry) => entry.count > 0);
}

function getDisfluencyCount(transcript: string): number {
  let total = 0;
  for (const pattern of DISFLUENCY_PATTERNS) {
    total += transcript.match(pattern)?.length ?? 0;
  }
  return total;
}

function getRepeatedPhrases(tokens: string[]): DeliveryMetrics['repeated_phrases'] {
  const frequency = new Map<string, number>();
  for (const n of [2, 3]) {
    for (let index = 0; index <= tokens.length - n; index += 1) {
      const phrase = tokens.slice(index, index + n).join(' ');
      frequency.set(phrase, (frequency.get(phrase) ?? 0) + 1);
    }
  }
  return [...frequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([phrase, count]) => ({ phrase, count }));
}

function getRepeatedNgramTokens(repeatedPhrases: DeliveryMetrics['repeated_phrases']): number {
  return repeatedPhrases.reduce((sum, phrase) => {
    const tokenLength = phrase.phrase.split(' ').length;
    return sum + Math.max(0, phrase.count - 1) * tokenLength;
  }, 0);
}

function getTimeScore(
  durationSeconds: number,
  minDurationSeconds: number,
  maxDurationSeconds: number,
): number {
  if (durationSeconds >= minDurationSeconds && durationSeconds <= maxDurationSeconds) {
    return 1;
  }
  if (durationSeconds < minDurationSeconds) {
    const underflowPct = (minDurationSeconds - durationSeconds) / minDurationSeconds;
    return clamp01(1 - underflowPct * 1.5);
  }
  const overrunPct = (durationSeconds - maxDurationSeconds) / maxDurationSeconds;
  return clamp01(1 - overrunPct * 1.5);
}

export function calculateDeliveryMetrics(
  transcriptOrInput: string | DeliveryInput,
  maybeMode?: PitchMode,
): DeliveryMetrics {
  const input: DeliveryInput =
    typeof transcriptOrInput === 'string'
      ? {
          transcript: transcriptOrInput,
          mode: maybeMode ?? 'vc_pitch',
        }
      : transcriptOrInput;

  const modeConfig = PITCH_MODE_CONFIG[input.mode];
  const transcript = input.transcript ?? '';
  const tokens = normalizeTokens(transcript);
  const wordCount = tokens.length;
  const durationSeconds = getDurationSeconds(input);
  const wpm = durationSeconds > 0 ? (60 * wordCount) / durationSeconds : 0;
  const fillerWords = getFillerWords(transcript);
  const fillerCount = fillerWords.reduce((sum, item) => sum + item.count, 0);
  const disfluencyCount = getDisfluencyCount(transcript);
  const repeatedPhrases = getRepeatedPhrases(tokens);
  const repeatedNgramTokens = getRepeatedNgramTokens(repeatedPhrases);

  const safeWordCount = Math.max(1, wordCount);
  const fillerRate = fillerCount / safeWordCount;
  const stutterRate = disfluencyCount / safeWordCount;
  const repeatRate = repeatedNgramTokens / safeWordCount;

  const sPace = clamp01(1 - Math.abs(wpm - modeConfig.targetWpm) / 40);
  const sFiller = clamp01(1 - fillerRate / 0.03);
  const sStutter = clamp01(1 - stutterRate / 0.02);
  const sRepeat = clamp01(1 - repeatRate / 0.015);
  const sTime = getTimeScore(
    durationSeconds,
    modeConfig.minDurationSeconds,
    modeConfig.maxDurationSeconds,
  );

  const delivery20 = 20 * (0.28 * sPace + 0.3 * sFiller + 0.18 * sStutter + 0.14 * sRepeat + 0.1 * sTime);

  return {
    word_count: wordCount,
    duration_seconds: Math.round(durationSeconds),
    target_wpm: modeConfig.targetWpm,
    wpm: Math.round(wpm),
    filler_count: fillerCount,
    filler_rate: round(fillerRate),
    disfluency_count: disfluencyCount,
    stutter_rate: round(stutterRate),
    repeated_ngram_tokens: repeatedNgramTokens,
    repeat_rate: round(repeatRate),
    within_time_limit:
      durationSeconds >= modeConfig.minDurationSeconds &&
      durationSeconds <= modeConfig.maxDurationSeconds,
    pace_score_component: round(sPace),
    filler_score_component: round(sFiller),
    stutter_score_component: round(sStutter),
    repeat_score_component: round(sRepeat),
    time_score_component: round(sTime),
    delivery20: round(Math.max(0, Math.min(20, delivery20)), 2),
    filler_words: fillerWords,
    repeated_phrases: repeatedPhrases,
  };
}

export function calculatePenalty(antiPatternHits: AntiPatternHit[]): number {
  const summedPenalty = antiPatternHits
    .filter((hit) => hit.hit)
    .reduce((sum, hit) => sum + hit.weight * Math.max(0, hit.penalty || 1), 0);
  return Math.min(12, round(summedPenalty, 2));
}

function scoreLookup(
  rubric: RubricScore[],
  categories: Array<RubricCategory | DeckRubricCategory>,
): number {
  return categories.reduce((sum, category) => {
    const item = rubric.find((entry) => entry.category === category);
    return sum + (item?.score ?? 0);
  }, 0);
}

export function calculateCompositeScore(input: CompositeScoreInput): {
  spoken100: number;
  deck100: number | null;
  coverage: 'spoken_only' | 'spoken+deck';
  overallBeforePenalty: number;
  penalty: number;
  finalScore: number;
} {
  const spokenWithoutDelivery = scoreLookup(input.spokenRubric, [
    'structure',
    'clarity',
    'evidence',
    'market',
  ]);
  const spoken100 = Math.max(
    0,
    Math.min(100, spokenWithoutDelivery + input.delivery20),
  );

  const deck100 = input.hasDeck
    ? Math.max(
        0,
        Math.min(
          100,
          scoreLookup(input.deckRubric, [
            'deck_narrative',
            'deck_clarity',
            'deck_evidence',
            'deck_design',
            'deck_ask',
          ]),
        ),
      )
    : null;

  const overallBeforePenalty =
    deck100 === null ? spoken100 : Math.round(0.65 * spoken100 + 0.35 * deck100);
  const penalty = calculatePenalty(input.antiPatternHits);
  const finalScore = Math.max(0, Math.round(overallBeforePenalty - penalty));

  return {
    spoken100: round(spoken100, 2),
    deck100: deck100 === null ? null : round(deck100, 2),
    coverage: deck100 === null ? 'spoken_only' : 'spoken+deck',
    overallBeforePenalty: round(overallBeforePenalty, 2),
    penalty: round(penalty, 2),
    finalScore,
  };
}

