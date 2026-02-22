import { completeWithLlmRouterWithTelemetry } from '@/lib/llm/router';
import {
  buildSectionAnalysisPrompt,
  SECTION_ANALYSIS_SYSTEM_PROMPT,
} from '@/lib/prompts/judge';
import type { SectionBeat, SectionFeedback } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const ELEVATOR_BEATS: SectionBeat[] = ['intro', 'problem', 'solution', 'ask'];
const VC_PITCH_BEATS: SectionBeat[] = [
  'intro',
  'problem',
  'solution',
  'market',
  'model',
  'traction',
  'team',
  'ask',
];

const ALL_BEATS = new Set<string>([
  'intro',
  'problem',
  'solution',
  'market',
  'model',
  'traction',
  'team',
  'ask',
]);

export interface SectionAgentInput {
  mode: PitchMode;
  transcript: string;
  globalVerdict: string;
  topFixes: string[];
}

export interface SectionAgentResult {
  sections: SectionFeedback[];
  llmCallsUsed: number;
  latencyMs: number;
}

interface RawSection {
  beat?: unknown;
  quotes?: unknown;
  score?: unknown;
  score_reason?: unknown;
  good?: unknown;
  bad?: unknown;
  top_issues?: unknown;
  top_fixes?: unknown;
  rewrite?: unknown;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('Section agent response is not valid JSON.');
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function beatsForMode(mode: PitchMode): SectionBeat[] {
  return mode === 'elevator' ? ELEVATOR_BEATS : VC_PITCH_BEATS;
}

function isValidSection(value: unknown, expectedBeats: Set<string>): value is RawSection {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.beat === 'string' &&
    expectedBeats.has(entry.beat) &&
    Array.isArray(entry.quotes) &&
    typeof entry.score === 'number' &&
    entry.score >= 0 &&
    entry.score <= 5 &&
    typeof entry.score_reason === 'string'
  );
}

function validateSections(
  parsed: unknown,
  expectedBeats: SectionBeat[],
): SectionFeedback[] {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Section agent response must be an object.');
  }
  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.sections)) {
    throw new Error('Section agent response missing sections array.');
  }

  const expectedSet = new Set<string>(expectedBeats);
  const validSections: SectionFeedback[] = [];

  for (const raw of root.sections) {
    if (!isValidSection(raw, ALL_BEATS)) continue;

    const entry = raw as Record<string, unknown>;
    const beat = entry.beat as SectionBeat;
    const quotes = (entry.quotes as unknown[]).filter(
      (q): q is string => typeof q === 'string',
    );
    const topIssues = Array.isArray(entry.top_issues)
      ? (entry.top_issues as unknown[]).filter((i): i is string => typeof i === 'string')
      : [];
    const topFixes = Array.isArray(entry.top_fixes)
      ? (entry.top_fixes as unknown[]).filter((f): f is string => typeof f === 'string')
      : [];

    validSections.push({
      beat,
      start_sec: 0,
      end_sec: 0,
      quotes,
      score: Math.round(entry.score as number),
      score_reason: entry.score_reason as string,
      good: typeof entry.good === 'string' ? entry.good : '',
      bad: typeof entry.bad === 'string' ? entry.bad : '',
      evidence: quotes.join(' '),
      top_issues: topIssues.slice(0, 3),
      top_fixes: topFixes.slice(0, 3),
      rewrite: typeof entry.rewrite === 'string' ? entry.rewrite : undefined,
      confidence: 0.8,
    });

    expectedSet.delete(beat);
  }

  for (const missingBeat of expectedSet) {
    validSections.push({
      beat: missingBeat as SectionBeat,
      start_sec: 0,
      end_sec: 0,
      quotes: [],
      score: 0,
      score_reason: 'This beat was not covered in the pitch.',
      good: '',
      bad: `The ${missingBeat} beat is missing from the pitch.`,
      evidence: '',
      top_issues: [`No ${missingBeat} content detected.`],
      top_fixes: [`Add a clear ${missingBeat} section to your pitch.`],
      confidence: 1.0,
    });
  }

  const beatOrder = new Map(expectedBeats.map((b, i) => [b, i]));
  validSections.sort(
    (a, b) => (beatOrder.get(a.beat) ?? 99) - (beatOrder.get(b.beat) ?? 99),
  );

  return validSections;
}

export async function runSectionAgent(
  input: SectionAgentInput,
): Promise<SectionAgentResult> {
  const expectedBeats = beatsForMode(input.mode);

  const response = await completeWithLlmRouterWithTelemetry({
    systemPrompt: SECTION_ANALYSIS_SYSTEM_PROMPT,
    userPrompt: buildSectionAnalysisPrompt({
      transcript: input.transcript,
      beats: expectedBeats,
      globalVerdict: input.globalVerdict,
      topFixes: input.topFixes,
    }),
    responseFormat: 'json',
    temperature: 0.2,
    maxTokens: 4096,
    timeoutMs: 30_000,
    maxAttempts: 1,
  });

  const parsed = parseJson(response.text);
  const sections = validateSections(parsed, expectedBeats);

  return {
    sections,
    llmCallsUsed: response.telemetry.llmCallsUsed,
    latencyMs: response.telemetry.latencyMs,
  };
}
