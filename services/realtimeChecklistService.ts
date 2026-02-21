import { createInitialChecklistState, getChecklistDefinitions } from '../config/realtimeChecklist';
import { buildRealtimeChecklistPrompt } from '../lib/prompts/realtimeChecklist';
import type {
  ChecklistDefinition,
  ChecklistItemId,
  ChecklistStatus,
  ChecklistUpdateSource,
  RealtimeChecklistItemState,
  RealtimeChecklistUpdateMessage,
} from '../types/checklist';
import type { PitchMode } from '../types/pitch';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL_DEFAULT = 'google/gemini-3-flash-preview';
const OPENROUTER_TIMEOUT_MS = 20000;
const OPENROUTER_MAX_ATTEMPTS = 2;
const OPENROUTER_SYSTEM_PROMPT =
  'You are an expert startup pitch coach. Return valid JSON only.';

const MIN_EVALUATION_INTERVAL_MS = 6000;
const FORCE_EVALUATION_INTERVAL_MS = 10000;
const MIN_WORD_DELTA = 16;
const MIN_TRANSCRIPT_WORDS = 18;
const TAIL_WORD_LIMIT = 750;

const STATUS_ORDER: Record<ChecklistStatus, number> = {
  uncovered: 0,
  partial: 1,
  completed: 2,
};

const CHECKLIST_IDS = new Set<ChecklistItemId>([
  'intro_hook',
  'problem_statement',
  'solution_overview',
  'market_opportunity',
  'business_model',
  'traction_metrics',
  'team',
  'ask',
]);

interface OpenRouterMessage {
  content?: string | Array<{ text?: string }>;
}

interface OpenRouterResponse {
  choices?: Array<{ message?: OpenRouterMessage }>;
  error?: { message?: string };
}

interface RawChecklistItem {
  id?: string;
  status?: string;
  confidence?: number;
  evidence?: string;
}

interface RawChecklistPayload {
  items?: RawChecklistItem[];
  next_hint?: string;
}

interface NormalizedChecklistItem {
  id: ChecklistItemId;
  status: ChecklistStatus;
  confidence: number;
  evidence: string;
}

export interface RealtimeChecklistSchedulerState {
  lastEvaluatedAtMs: number;
  lastEvaluatedWordCount: number;
}

export interface RealtimeChecklistSessionState {
  mode: PitchMode;
  items: RealtimeChecklistItemState[];
  scheduler: RealtimeChecklistSchedulerState;
}

export interface ChecklistEvaluationResult {
  source: ChecklistUpdateSource;
  message: RealtimeChecklistUpdateMessage;
  items: RealtimeChecklistItemState[];
  scheduler: RealtimeChecklistSchedulerState;
}

export interface EvaluateRealtimeChecklistInput {
  mode: PitchMode;
  transcript: string;
  previousItems: RealtimeChecklistItemState[];
  scheduler: RealtimeChecklistSchedulerState;
  nowMs?: number;
  force?: boolean;
}

function countWords(text: string): number {
  const tokens = text.match(/\b[\w']+\b/g);
  return tokens?.length ?? 0;
}

function takeTailWords(transcript: string, limit: number = TAIL_WORD_LIMIT): string {
  const tokens = transcript.match(/\b[\w']+\b/g) ?? [];
  if (tokens.length <= limit) return transcript;
  const tail = tokens.slice(-limit).join(' ');
  return tail;
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function extractMessageContent(message: OpenRouterMessage | undefined): string {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  return (message.content ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

function parseJsonPayload(raw: string): RawChecklistPayload {
  try {
    return JSON.parse(raw) as RawChecklistPayload;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('Checklist model output is not valid JSON.');
    }
    return JSON.parse(raw.slice(start, end + 1)) as RawChecklistPayload;
  }
}

function isChecklistStatus(value: string): value is ChecklistStatus {
  return value === 'uncovered' || value === 'partial' || value === 'completed';
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeRawItems(payload: RawChecklistPayload): Map<ChecklistItemId, NormalizedChecklistItem> {
  const map = new Map<ChecklistItemId, NormalizedChecklistItem>();
  for (const item of payload.items ?? []) {
    if (!item || typeof item !== 'object') continue;
    if (!item.id || !CHECKLIST_IDS.has(item.id as ChecklistItemId)) continue;
    if (!item.status || !isChecklistStatus(item.status)) continue;

    const id = item.id as ChecklistItemId;
    map.set(id, {
      id,
      status: item.status,
      confidence: clampConfidence(item.confidence ?? 0),
      evidence: (item.evidence ?? '').trim(),
    });
  }
  return map;
}

function getHigherStatus(a: ChecklistStatus, b: ChecklistStatus): ChecklistStatus {
  return STATUS_ORDER[a] >= STATUS_ORDER[b] ? a : b;
}

function normalizeEvidence(evidence: string): string {
  return evidence.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function makeProgress(items: RealtimeChecklistItemState[]): { completed: number; total: number } {
  const requiredItems = items.filter((item) => item.required);
  return {
    completed: requiredItems.filter((item) => item.status === 'completed').length,
    total: requiredItems.length,
  };
}

function pickNextHint(items: RealtimeChecklistItemState[]): string | null {
  const pending = items.find((item) => item.required && item.status !== 'completed');
  if (!pending) return null;
  return `Cover "${pending.label}" with one concrete sentence.`;
}

export function createRealtimeChecklistSessionState(mode: PitchMode): RealtimeChecklistSessionState {
  return {
    mode,
    items: createInitialChecklistState(mode),
    scheduler: {
      lastEvaluatedAtMs: 0,
      lastEvaluatedWordCount: 0,
    },
  };
}

export function shouldEvaluateRealtimeChecklist({
  transcript,
  scheduler,
  nowMs,
  force = false,
}: {
  transcript: string;
  scheduler: RealtimeChecklistSchedulerState;
  nowMs?: number;
  force?: boolean;
}): boolean {
  const currentNow = nowMs ?? Date.now();
  const wordCount = countWords(transcript);
  if (wordCount === 0) return false;
  if (force) return true;
  if (wordCount < MIN_TRANSCRIPT_WORDS) return false;

  if (scheduler.lastEvaluatedAtMs === 0) return true;

  const elapsed = currentNow - scheduler.lastEvaluatedAtMs;
  const deltaWords = wordCount - scheduler.lastEvaluatedWordCount;

  if (elapsed < MIN_EVALUATION_INTERVAL_MS) return false;
  if (deltaWords >= MIN_WORD_DELTA) return true;
  if (elapsed >= FORCE_EVALUATION_INTERVAL_MS && deltaWords > 0) return true;
  return false;
}

function findHeuristicEvidence(transcript: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const matcher = new RegExp(pattern, 'i');
    const match = matcher.exec(transcript);
    if (!match) continue;

    const from = Math.max(0, match.index - 36);
    const to = Math.min(transcript.length, match.index + match[0].length + 56);
    return normalizeEvidence(transcript.slice(from, to));
  }
  return '';
}

function evaluateHeuristicChecklist(
  transcript: string,
  checklist: ChecklistDefinition[],
): Map<ChecklistItemId, NormalizedChecklistItem> {
  const map = new Map<ChecklistItemId, NormalizedChecklistItem>();
  for (const item of checklist) {
    let hitCount = 0;
    for (const pattern of item.cuePatterns) {
      const matcher = new RegExp(pattern, 'ig');
      const matches = transcript.match(matcher);
      hitCount += matches?.length ?? 0;
    }

    const evidence = findHeuristicEvidence(transcript, item.cuePatterns);
    const status: ChecklistStatus =
      hitCount >= 2 ? 'completed' : hitCount >= 1 ? 'partial' : 'uncovered';
    const confidence = hitCount >= 2 ? 0.62 : hitCount >= 1 ? 0.46 : 0.18;

    map.set(item.id, {
      id: item.id,
      status,
      confidence,
      evidence,
    });
  }
  return map;
}

async function completeWithOpenRouter(userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY for realtime checklist.');
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || OPENROUTER_MODEL_DEFAULT;

  for (let attempt = 1; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: OPENROUTER_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as OpenRouterResponse;
      if (!response.ok) {
        const message =
          payload.error?.message ??
          `OpenRouter realtime checklist failed (${response.status}).`;
        if (attempt < OPENROUTER_MAX_ATTEMPTS && shouldRetry(response.status)) {
          continue;
        }
        throw new Error(message);
      }

      const content = extractMessageContent(payload.choices?.[0]?.message);
      if (!content) {
        throw new Error('OpenRouter returned empty checklist output.');
      }
      return content;
    } catch (error) {
      if (attempt < OPENROUTER_MAX_ATTEMPTS) continue;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenRouter realtime checklist request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('OpenRouter realtime checklist request failed.');
}

function mergeChecklistStates({
  mode,
  previousItems,
  candidateItems,
  evaluatedAtIso,
}: {
  mode: PitchMode;
  previousItems: RealtimeChecklistItemState[];
  candidateItems: Map<ChecklistItemId, NormalizedChecklistItem>;
  evaluatedAtIso: string;
}): RealtimeChecklistItemState[] {
  const previousMap = new Map(previousItems.map((item) => [item.id, item]));
  const checklist = getChecklistDefinitions(mode);

  return checklist.map((definition) => {
    const previous = previousMap.get(definition.id);
    const fallbackPrevious =
      previous ??
      createInitialChecklistState(mode, evaluatedAtIso).find(
        (item) => item.id === definition.id,
      );
    const candidate = candidateItems.get(definition.id);

    const previousStatus = fallbackPrevious?.status ?? 'uncovered';
    const candidateStatus = candidate?.status ?? 'uncovered';
    const status = getHigherStatus(previousStatus, candidateStatus);

    const confidence = clampConfidence(
      status === previousStatus
        ? Math.max(fallbackPrevious?.confidence ?? 0, candidate?.confidence ?? 0)
        : candidate?.confidence ?? fallbackPrevious?.confidence ?? 0,
    );

    const evidence = normalizeEvidence(
      candidate?.evidence || fallbackPrevious?.evidence || '',
    );

    const changed =
      status !== (fallbackPrevious?.status ?? 'uncovered') ||
      evidence !== (fallbackPrevious?.evidence ?? '');

    return {
      id: definition.id,
      label: definition.label,
      status,
      confidence,
      evidence,
      required: definition.requiredModes.includes(mode),
      lastUpdatedAt: changed ? evaluatedAtIso : fallbackPrevious?.lastUpdatedAt ?? evaluatedAtIso,
    };
  });
}

export function buildChecklistUpdateMessage({
  mode,
  source,
  items,
  evaluatedAtIso,
}: {
  mode: PitchMode;
  source: ChecklistUpdateSource;
  items: RealtimeChecklistItemState[];
  evaluatedAtIso: string;
}): RealtimeChecklistUpdateMessage {
  return {
    type: 'checklist_update',
    mode,
    source,
    items,
    progress: makeProgress(items),
    nextHint: pickNextHint(items),
    updatedAt: evaluatedAtIso,
  };
}

async function evaluateWithOpenRouter({
  mode,
  transcript,
  previousItems,
}: {
  mode: PitchMode;
  transcript: string;
  previousItems: RealtimeChecklistItemState[];
}): Promise<{ items: Map<ChecklistItemId, NormalizedChecklistItem>; nextHint: string | null }> {
  const checklist = getChecklistDefinitions(mode);
  const userPrompt = buildRealtimeChecklistPrompt({
    mode,
    transcript: takeTailWords(transcript),
    checklist,
    previousItems,
  });
  const raw = await completeWithOpenRouter(userPrompt);
  const payload = parseJsonPayload(raw);
  const items = normalizeRawItems(payload);
  if (items.size === 0) {
    throw new Error('Checklist response did not contain valid items.');
  }

  const nextHint = typeof payload.next_hint === 'string' ? payload.next_hint.trim() : null;
  return { items, nextHint };
}

export async function evaluateRealtimeChecklist(
  input: EvaluateRealtimeChecklistInput,
): Promise<ChecklistEvaluationResult | null> {
  const nowMs = input.nowMs ?? Date.now();
  const shouldEvaluate = shouldEvaluateRealtimeChecklist({
    transcript: input.transcript,
    scheduler: input.scheduler,
    nowMs,
    force: input.force,
  });
  if (!shouldEvaluate) return null;

  const evaluatedAtIso = new Date(nowMs).toISOString();
  const wordCount = countWords(input.transcript);
  let source: ChecklistUpdateSource = 'openrouter';
  let candidateItems: Map<ChecklistItemId, NormalizedChecklistItem>;
  let llmNextHint: string | null = null;

  try {
    const llm = await evaluateWithOpenRouter({
      mode: input.mode,
      transcript: input.transcript,
      previousItems: input.previousItems,
    });
    candidateItems = llm.items;
    llmNextHint = llm.nextHint;
  } catch {
    source = 'heuristic';
    candidateItems = evaluateHeuristicChecklist(
      input.transcript,
      getChecklistDefinitions(input.mode),
    );
  }

  const items = mergeChecklistStates({
    mode: input.mode,
    previousItems: input.previousItems,
    candidateItems,
    evaluatedAtIso,
  });

  const message = buildChecklistUpdateMessage({
    mode: input.mode,
    source,
    items,
    evaluatedAtIso,
  });

  if (source === 'openrouter' && llmNextHint) {
    message.nextHint = normalizeEvidence(llmNextHint).slice(0, 120) || message.nextHint;
  }

  return {
    source,
    message,
    items,
    scheduler: {
      lastEvaluatedAtMs: nowMs,
      lastEvaluatedWordCount: wordCount,
    },
  };
}
