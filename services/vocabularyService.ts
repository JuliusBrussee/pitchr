import type {
  DeliveryEvent,
  TranscriptSegment,
  VocabularyMetrics,
  VocabularyTermStat,
} from '@/types/analysis-v2';

const HEDGE_TERMS = [
  'maybe',
  'might',
  'perhaps',
  'probably',
  'possibly',
  'i think',
  'we think',
  'kind of',
  'sort of',
  'somewhat',
];

const JARGON_TERMS = [
  'synergy',
  'revolutionary',
  'disruptive',
  'best-in-class',
  'next-gen',
  'paradigm',
  'leverage',
  'transformative',
];

const SOFTENER_TERMS = [
  'just',
  'really',
  'quite',
  'basically',
  'actually',
  'like',
];

interface TimelineWord {
  text: string;
  start: number;
  end: number;
}

function round(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '').trim();
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? []).filter(Boolean);
}

function countTermStats(text: string, terms: string[]): VocabularyTermStat[] {
  const lower = text.toLowerCase();
  return terms
    .map((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gu');
      return { term, count: lower.match(regex)?.length ?? 0 };
    })
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count);
}

function flattenWords(segments?: TranscriptSegment[]): TimelineWord[] {
  if (!segments || segments.length === 0) return [];
  const words = segments.flatMap((segment) => {
    if (segment.words.length > 0) {
      return segment.words
        .filter((word) => Number.isFinite(word.start) && Number.isFinite(word.end))
        .map((word) => ({
          text: word.text,
          start: word.start,
          end: word.end,
        }));
    }

    const tokens = segment.text.split(/\s+/u).filter(Boolean);
    if (tokens.length === 0) return [];
    const duration = Math.max(0.2, segment.end - segment.start);
    const perWord = duration / tokens.length;
    return tokens.map((token, index) => {
      const start = segment.start + index * perWord;
      const end = Math.min(segment.end, start + perWord * 0.9);
      return { text: token, start, end };
    });
  });
  return words.sort((left, right) => left.start - right.start);
}

function getFallbackWordTimeline(transcript: string): TimelineWord[] {
  const tokens = transcript.split(/\s+/u).filter(Boolean);
  const secondsPerWord = 60 / 140;
  return tokens.map((token, index) => {
    const start = index * secondsPerWord;
    return {
      text: token,
      start,
      end: start + secondsPerWord * 0.8,
    };
  });
}

function firstOccurrence(
  words: TimelineWord[],
  rawTerm: string,
): { start: number; end: number } | null {
  const termTokens = rawTerm.split(/\s+/u).map(normalizeToken).filter(Boolean);
  if (termTokens.length === 0) return null;
  for (let index = 0; index <= words.length - termTokens.length; index += 1) {
    const maybeMatch = termTokens.every((token, tokenIndex) => {
      const current = words[index + tokenIndex];
      return normalizeToken(current.text) === token;
    });
    if (!maybeMatch) continue;
    return {
      start: words[index].start,
      end: words[index + termTokens.length - 1].end,
    };
  }
  return null;
}

function severityForCount(count: number): DeliveryEvent['severity'] {
  if (count >= 5) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
}

export function calculateVocabularyMetrics(transcript: string): VocabularyMetrics {
  const tokens = tokenize(transcript);
  const totalWords = tokens.length;
  const uniqueWords = new Set(tokens).size;

  const hedgeTerms = countTermStats(transcript, HEDGE_TERMS);
  const jargonTerms = countTermStats(transcript, JARGON_TERMS);
  const softenerTerms = countTermStats(transcript, SOFTENER_TERMS);

  const hedgeCount = hedgeTerms.reduce((sum, item) => sum + item.count, 0);
  const jargonCount = jargonTerms.reduce((sum, item) => sum + item.count, 0);
  const softenerCount = softenerTerms.reduce((sum, item) => sum + item.count, 0);
  const safeWordCount = Math.max(1, totalWords);

  return {
    total_words: totalWords,
    unique_words: uniqueWords,
    lexical_diversity: round(uniqueWords / safeWordCount),
    hedge_density: round(hedgeCount / safeWordCount),
    jargon_density: round(jargonCount / safeWordCount),
    softener_density: round(softenerCount / safeWordCount),
    hedge_terms: hedgeTerms,
    jargon_terms: jargonTerms,
    softener_terms: softenerTerms,
  };
}

export function buildVocabularyEvents(
  metrics: VocabularyMetrics,
  transcript: string,
  segments?: TranscriptSegment[],
): DeliveryEvent[] {
  const sourceWords = flattenWords(segments);
  const words = sourceWords.length > 0 ? sourceWords : getFallbackWordTimeline(transcript);
  const candidateTerms = [
    ...metrics.hedge_terms.map((item) => ({ ...item, bucket: 'hedge' as const })),
    ...metrics.jargon_terms.map((item) => ({ ...item, bucket: 'jargon' as const })),
    ...metrics.softener_terms.map((item) => ({ ...item, bucket: 'softener' as const })),
  ]
    .filter((item) => item.count >= 2)
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);

  return candidateTerms.reduce<DeliveryEvent[]>((events, term, index) => {
    const location = firstOccurrence(words, term.term);
    if (!location) return events;
    const bucketLabel =
      term.bucket === 'jargon' ? 'jargon' : term.bucket === 'softener' ? 'softener' : 'hedge';
    events.push({
      id: `vocab-${bucketLabel}-${index}-${Math.round(location.start * 1000)}`,
      type: 'vocab',
      start_sec: round(location.start, 3),
      end_sec: round(location.end, 3),
      label: term.term,
      evidence: `Repeated ${bucketLabel} term "${term.term}" (${term.count}x).`,
      severity: severityForCount(term.count),
      count: term.count,
    });
    return events;
  }, []);
}
