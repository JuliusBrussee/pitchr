import { PITCH_MODE_CONFIG } from '@/config/modes';
import type {
  AntiPatternHit,
  DeliveryEvent,
  DeliveryMetrics,
  DeckRubricCategory,
  RubricCategory,
  RubricScore,
  TranscriptSegment,
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
  words?: Array<{ text?: string; start?: number; end?: number }>;
}

interface DeliveryInput {
  transcript: string;
  mode: PitchMode;
  durationSeconds?: number;
  segments?: TranscriptSegment[] | SegmentLike[];
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

interface TimelineWord {
  text: string;
  start: number;
  end: number;
}

function cleanToken(token: string): string {
  return token.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '').trim();
}

function buildSyntheticWords(transcript: string): TimelineWord[] {
  const rawTokens = transcript.split(/\s+/u).filter(Boolean);
  const secondsPerWord = 60 / 140;
  return rawTokens.map((token, index) => {
    const start = index * secondsPerWord;
    const end = start + secondsPerWord * 0.8;
    return { text: token, start, end };
  });
}

function expandSegmentWords(segment: SegmentLike): TimelineWord[] {
  const words = segment.words ?? [];
  const withTimestamps = words
    .map((word) => {
      const text = String(word.text ?? '').trim();
      if (!text) return null;
      const start = typeof word.start === 'number' && word.start >= 0 ? word.start : null;
      const end = typeof word.end === 'number' && word.end >= 0 ? word.end : null;
      if (start === null || end === null || end < start) return null;
      return { text, start, end } satisfies TimelineWord;
    })
    .filter((entry): entry is TimelineWord => Boolean(entry));

  if (withTimestamps.length > 0) return withTimestamps;

  const fallbackTokens = String(segment.text ?? '').split(/\s+/u).filter(Boolean);
  if (fallbackTokens.length === 0) return [];

  const segStart = typeof segment.start === 'number' && segment.start >= 0 ? segment.start : 0;
  const segEnd =
    typeof segment.end === 'number' && segment.end >= segStart
      ? segment.end
      : segStart + Math.max(0.25, fallbackTokens.length * 0.33);
  const duration = Math.max(0.2, segEnd - segStart);
  const secondsPerWord = duration / fallbackTokens.length;

  return fallbackTokens.map((token, index) => {
    const start = segStart + index * secondsPerWord;
    const end = Math.min(segEnd, start + secondsPerWord * 0.9);
    return { text: token, start, end };
  });
}

function flattenTimelineWords(
  transcript: string,
  segments?: TranscriptSegment[] | SegmentLike[],
): TimelineWord[] {
  if (!segments || segments.length === 0) return buildSyntheticWords(transcript);
  const words = segments.flatMap(expandSegmentWords);
  if (words.length > 0) {
    return [...words].sort((left, right) => left.start - right.start);
  }
  return buildSyntheticWords(transcript);
}

function severityForPause(seconds: number): DeliveryEvent['severity'] {
  if (seconds >= 1.8) return 'high';
  if (seconds >= 1.2) return 'medium';
  return 'low';
}

function createEventId(
  type: DeliveryEvent['type'],
  startSec: number,
  endSec: number,
  index: number,
): string {
  const startTag = Math.round(startSec * 1000);
  const endTag = Math.round(endSec * 1000);
  return `${type}-${startTag}-${endTag}-${index}`;
}

export function extractDeliveryEvents(input: DeliveryInput): DeliveryEvent[] {
  const words = flattenTimelineWords(input.transcript, input.segments);
  if (words.length === 0) return [];

  const events: DeliveryEvent[] = [];
  const singleFillers = new Set(['um', 'uh', 'like', 'basically', 'actually']);
  const multiFillers = new Set(['you know', 'sort of', 'kind of']);

  for (let index = 0; index < words.length; index += 1) {
    const current = words[index];
    const next = words[index + 1];
    const currentToken = cleanToken(current.text);
    const nextToken = next ? cleanToken(next.text) : '';

    if (singleFillers.has(currentToken)) {
      events.push({
        id: createEventId('filler', current.start, current.end, events.length),
        type: 'filler',
        start_sec: round(current.start, 3),
        end_sec: round(current.end, 3),
        label: currentToken,
        evidence: `Detected filler "${currentToken}".`,
        severity: 'low',
      });
    }

    if (next && multiFillers.has(`${currentToken} ${nextToken}`)) {
      events.push({
        id: createEventId('filler', current.start, next.end, events.length),
        type: 'filler',
        start_sec: round(current.start, 3),
        end_sec: round(next.end, 3),
        label: `${currentToken} ${nextToken}`,
        evidence: `Detected filler phrase "${currentToken} ${nextToken}".`,
        severity: 'low',
      });
    }

    if (index > 0) {
      const previous = words[index - 1];
      const previousToken = cleanToken(previous.text);
      const gap = Math.max(0, current.start - previous.end);

      if (
        currentToken.length >= 2 &&
        previousToken.length >= 2 &&
        currentToken === previousToken &&
        gap <= 0.45
      ) {
        events.push({
          id: createEventId('stutter', previous.start, current.end, events.length),
          type: 'stutter',
          start_sec: round(previous.start, 3),
          end_sec: round(current.end, 3),
          label: currentToken,
          evidence: `Repeated token "${currentToken}" in a short window.`,
          severity: 'medium',
          count: 2,
        });
      }

      if (gap >= 0.95) {
        events.push({
          id: createEventId('hesitation', previous.end, current.start, events.length),
          type: 'hesitation',
          start_sec: round(previous.end, 3),
          end_sec: round(current.start, 3),
          label: 'pause',
          evidence: `Pause of ${round(gap, 2)} seconds before "${currentToken || current.text}".`,
          severity: severityForPause(gap),
        });
      }
    }
  }

  const bigramFirstSeen = new Map<string, TimelineWord>();
  for (let index = 0; index < words.length - 1; index += 1) {
    const left = cleanToken(words[index].text);
    const right = cleanToken(words[index + 1].text);
    if (!left || !right) continue;
    const bigram = `${left} ${right}`;
    const first = bigramFirstSeen.get(bigram);
    if (!first) {
      bigramFirstSeen.set(bigram, words[index]);
      continue;
    }

    const start = words[index].start;
    const end = words[index + 1].end;
    events.push({
      id: createEventId('repetition', start, end, events.length),
      type: 'repetition',
      start_sec: round(start, 3),
      end_sec: round(end, 3),
      label: bigram,
      evidence: `Repeated phrase "${bigram}" detected.`,
      severity: 'low',
      count: 2,
    });

    // Keep the earliest occurrence only and prevent a flood of duplicates.
    bigramFirstSeen.delete(bigram);
  }

  return events
    .sort((left, right) => left.start_sec - right.start_sec)
    .slice(0, 60);
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
  const events = extractDeliveryEvents(input);

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
    events,
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
