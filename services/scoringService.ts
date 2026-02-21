import { PITCH_MODE_CONFIG } from '@/config/modes';
import type { DeliveryMetrics, FillerWord, RepeatedPhrase } from '@/types/analysis';
import type { PitchMode } from '@/types/pitch';

const FILLER_WORD_PATTERNS: Array<{ word: string; pattern: RegExp }> = [
  { word: 'um', pattern: /\bum\b/gi },
  { word: 'uh', pattern: /\buh\b/gi },
  { word: 'like', pattern: /\blike\b/gi },
  { word: 'basically', pattern: /\bbasically\b/gi },
  { word: 'actually', pattern: /\bactually\b/gi },
  { word: 'you know', pattern: /\byou\s+know\b/gi },
  { word: 'sort of', pattern: /\bsort\s+of\b/gi },
  { word: 'kind of', pattern: /\bkind\s+of\b/gi },
];

const IDEAL_WPM = 140;
const REPEATED_PHRASE_MIN_COUNT = 3;
const MAX_REPEATED_PHRASES = 8;

function normalizeTokens(transcript: string): string[] {
  const matches = transcript.toLowerCase().match(/\b[\w']+\b/g);
  return matches ?? [];
}

function countWords(transcript: string): number {
  return normalizeTokens(transcript).length;
}

function estimateDurationSeconds(wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.round((wordCount / IDEAL_WPM) * 60);
}

function getFillerWords(transcript: string): FillerWord[] {
  return FILLER_WORD_PATTERNS.map(({ word, pattern }) => {
    const matches = transcript.match(pattern);
    return {
      word,
      count: matches?.length ?? 0,
    };
  }).filter((entry) => entry.count > 0);
}

function getRepeatedPhrases(tokens: string[]): RepeatedPhrase[] {
  const frequency = new Map<string, number>();
  const nGramSizes = [2, 3];

  for (const n of nGramSizes) {
    for (let i = 0; i <= tokens.length - n; i += 1) {
      const phrase = tokens.slice(i, i + n).join(' ');
      frequency.set(phrase, (frequency.get(phrase) ?? 0) + 1);
    }
  }

  return Array.from(frequency.entries())
    .filter(([, count]) => count >= REPEATED_PHRASE_MIN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_REPEATED_PHRASES)
    .map(([phrase, count]) => ({ phrase, count }));
}

export function calculateDeliveryMetrics(
  transcript: string,
  mode: PitchMode,
): DeliveryMetrics {
  const modeConfig = PITCH_MODE_CONFIG[mode];
  const wordCount = countWords(transcript);
  const durationSeconds = estimateDurationSeconds(wordCount);
  const wpmByModeLimit =
    modeConfig.targetDurationSeconds > 0
      ? Math.round(wordCount / (modeConfig.targetDurationSeconds / 60))
      : 0;

  const fillerWords = getFillerWords(transcript);
  const repeatedPhrases = getRepeatedPhrases(normalizeTokens(transcript));
  const withinTimeLimit = durationSeconds <= modeConfig.maxDurationSeconds;

  return {
    wpm: wpmByModeLimit,
    duration_seconds: durationSeconds,
    filler_words: fillerWords,
    repeated_phrases: repeatedPhrases,
    within_time_limit: withinTimeLimit,
  };
}
