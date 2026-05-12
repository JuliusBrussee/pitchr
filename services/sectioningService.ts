import type { SectionBeat, TranscriptSegment } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

export interface SectionSlice {
  beat: SectionBeat;
  start_sec: number;
  end_sec: number;
  text: string;
  confidence: number;
}

interface TimedSentence {
  text: string;
  start: number;
  end: number;
}

const MODE_BEATS: Record<PitchMode, SectionBeat[]> = {
  elevator: ['intro', 'problem', 'solution', 'ask'],
  vc_pitch: ['intro', 'problem', 'solution', 'market', 'model', 'traction', 'team', 'ask'],
  hackathon: ['intro', 'problem', 'demo', 'innovation', 'impact', 'ask'],
  final_year: ['intro', 'problem', 'solution', 'traction', 'impact', 'ask'],
};

const BEAT_PATTERNS: Record<SectionBeat, RegExp[]> = {
  intro: [/\b(we build|we are|our company|today we)\b/iu],
  problem: [/\b(problem|pain|friction|broken|costly|slow)\b/iu],
  solution: [/\b(solution|platform|product|we help|we enable|we automate)\b/iu],
  market: [/\b(tam|sam|market|category|segment|industry)\b/iu],
  model: [/\b(pricing|subscription|business model|gross margin|unit economics)\b/iu],
  traction: [/\b(revenue|arr|mrr|growth|customers|retention|pipeline|pilot)\b/iu, /\d+%/u],
  team: [/\b(founder|team|operator|background|experience)\b/iu],
  ask: [/\b(raising|ask|use of funds|round|milestone)\b/iu],
  demo: [/\b(demo|prototype|let me show|screen[- ]?share|built|working|live)\b/iu],
  innovation: [/\b(novel|innovative|creative|unique|first|new approach|breakthrough)\b/iu],
  impact: [/\b(impact|benefit|help|solve|improve|change|transform|save)\b/iu],
};

function round(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function timedSentencesFromSegments(segments: TranscriptSegment[]): TimedSentence[] {
  const sentences: TimedSentence[] = [];
  for (const segment of segments) {
    const parts = splitSentences(segment.text);
    if (parts.length === 0) continue;
    const duration = Math.max(0.2, segment.end - segment.start);
    const charCount = parts.reduce((sum, part) => sum + part.length, 0) || parts.length;
    let cursor = segment.start;
    for (const part of parts) {
      const ratio = part.length / charCount;
      const sliceDuration = duration * ratio;
      const start = cursor;
      const end = Math.min(segment.end, start + sliceDuration);
      cursor = end;
      sentences.push({
        text: part,
        start,
        end,
      });
    }
  }
  return sentences;
}

function timedSentencesFromText(transcript: string): TimedSentence[] {
  const sentences = splitSentences(transcript);
  if (sentences.length === 0) return [];
  const words = transcript.split(/\s+/u).filter(Boolean).length;
  const totalDuration = Math.max(15, (words / 140) * 60);
  const tokenCounts = sentences.map((sentence) => sentence.split(/\s+/u).filter(Boolean).length);
  const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0) || sentences.length;
  let cursor = 0;
  return sentences.map((sentence, index) => {
    const ratio = tokenCounts[index] / totalTokens;
    const sliceDuration = totalDuration * ratio;
    const start = cursor;
    const end = start + sliceDuration;
    cursor = end;
    return {
      text: sentence,
      start,
      end,
    };
  });
}

function inferBeatByText(text: string): { beat: SectionBeat; confidence: number } | null {
  for (const [beat, patterns] of Object.entries(BEAT_PATTERNS) as Array<[SectionBeat, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return { beat, confidence: 0.8 };
    }
  }
  return null;
}

function beatByPosition(
  index: number,
  total: number,
  expectedBeats: SectionBeat[],
): SectionBeat {
  if (expectedBeats.length === 1) return expectedBeats[0];
  const ratio = total <= 1 ? 0 : index / (total - 1);
  const beatIndex = Math.min(
    expectedBeats.length - 1,
    Math.max(0, Math.round(ratio * (expectedBeats.length - 1))),
  );
  return expectedBeats[beatIndex];
}

function ensureExpectedBeats(
  slices: SectionSlice[],
  expectedBeats: SectionBeat[],
  totalDuration: number,
): SectionSlice[] {
  const byBeat = new Map<SectionBeat, SectionSlice>(slices.map((slice) => [slice.beat, slice]));
  let fallbackCursor = 0;
  const fallbackDuration = Math.max(0.5, totalDuration / Math.max(1, expectedBeats.length));

  for (const beat of expectedBeats) {
    if (byBeat.has(beat)) continue;
    const start = fallbackCursor;
    const end = Math.min(totalDuration, start + fallbackDuration);
    fallbackCursor = end;
    byBeat.set(beat, {
      beat,
      start_sec: round(start),
      end_sec: round(end),
      text: '',
      confidence: 0.15,
    });
  }

  return expectedBeats
    .map((beat) => byBeat.get(beat))
    .filter((slice): slice is SectionSlice => Boolean(slice))
    .sort((left, right) => left.start_sec - right.start_sec);
}

export function buildSectionSlices(input: {
  transcript: string;
  mode: PitchMode;
  segments?: TranscriptSegment[];
}): SectionSlice[] {
  const expectedBeats = MODE_BEATS[input.mode];
  const timedSentences =
    input.segments && input.segments.length > 0
      ? timedSentencesFromSegments(input.segments)
      : timedSentencesFromText(input.transcript);
  if (timedSentences.length === 0) {
    return ensureExpectedBeats([], expectedBeats, 0);
  }

  const assignments = timedSentences.map((sentence, index) => {
    const inferred = inferBeatByText(sentence.text);
    if (inferred) {
      return { ...sentence, beat: inferred.beat, confidence: inferred.confidence };
    }
    return {
      ...sentence,
      beat: beatByPosition(index, timedSentences.length, expectedBeats),
      confidence: 0.45,
    };
  });

  const grouped = new Map<SectionBeat, SectionSlice>();
  for (const item of assignments) {
    const current = grouped.get(item.beat);
    if (!current) {
      grouped.set(item.beat, {
        beat: item.beat,
        start_sec: round(item.start),
        end_sec: round(item.end),
        text: item.text,
        confidence: item.confidence,
      });
      continue;
    }

    const mergedText = `${current.text} ${item.text}`.trim();
    const mergedConfidence = round((current.confidence + item.confidence) / 2, 3);
    grouped.set(item.beat, {
      beat: item.beat,
      start_sec: round(Math.min(current.start_sec, item.start)),
      end_sec: round(Math.max(current.end_sec, item.end)),
      text: mergedText,
      confidence: mergedConfidence,
    });
  }

  const totalDuration = Math.max(...timedSentences.map((sentence) => sentence.end));
  return ensureExpectedBeats([...grouped.values()], expectedBeats, totalDuration);
}
