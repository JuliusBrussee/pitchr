import { createInitialChecklistState, getChecklistDefinitions } from '../config/realtimeChecklist';
import { AnthropicProvider } from '../lib/llm/providers/anthropic';
import { OpenRouterProvider } from '../lib/llm/providers/openrouter';
import { completeWithLlmRouter } from '../lib/llm/router';
import { buildRealtimeChecklistPrompt } from '../lib/prompts/realtimeChecklist';
import type { LlmCompletionRequest, LlmProviderName } from '../lib/llm/types';
import type {
  ChecklistDefinition,
  ChecklistItemId,
  ChecklistStatus,
  ChecklistUpdateSource,
  RealtimeChecklistItemState,
  RealtimeChecklistUpdateMessage,
} from '../types/checklist';
import type { PitchMode } from '../types/pitch';

const CHECKLIST_LLM_TIMEOUT_MS = 20000;
const CHECKLIST_LLM_SYSTEM_PROMPT =
  'You are an expert startup pitch coach. Return valid JSON only.';

const MIN_EVALUATION_INTERVAL_MS = 6000;
const FORCE_EVALUATION_INTERVAL_MS = 10000;
const MIN_WORD_DELTA = 6;
const MIN_TRANSCRIPT_WORDS = 6;
const TAIL_WORD_LIMIT = 750;
const REQUIRED_ITEM_FAIL_AFTER_SECONDS_DEFAULT = 30;

const NON_COMPLETED_STATUS_ORDER: Record<'uncovered' | 'partial', number> = {
  uncovered: 0,
  partial: 1,
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
  startedAtMs: number;
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
  sessionStartedAtMs: number;
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
  return (
    value === 'uncovered' ||
    value === 'partial' ||
    value === 'completed' ||
    value === 'failed'
  );
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

export function createRealtimeChecklistSessionState(
  mode: PitchMode,
  startedAtMs: number = Date.now(),
): RealtimeChecklistSessionState {
  return {
    mode,
    startedAtMs,
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
  const normalizedTranscript = transcript.toLowerCase();
  const map = new Map<ChecklistItemId, NormalizedChecklistItem>();
  for (const item of checklist) {
    let hitCount = 0;
    for (const pattern of item.cuePatterns) {
      const matcher = new RegExp(pattern, 'ig');
      const matches = transcript.match(matcher);
      hitCount += matches?.length ?? 0;
    }

    const semanticHitCount = item.semanticHints.reduce((count, hint) => {
      const tokens = hint.toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return count;
      const matchedTokens = tokens.filter((token) =>
        normalizedTranscript.includes(token),
      ).length;
      return count + (matchedTokens >= Math.ceil(tokens.length / 2) ? 1 : 0);
    }, 0);

    const evidence = findHeuristicEvidence(transcript, item.cuePatterns);
    const status: ChecklistStatus =
      hitCount >= 1 ? 'completed' : semanticHitCount >= 1 ? 'partial' : 'uncovered';
    const confidence =
      status === 'completed' ? 0.62 : status === 'partial' ? 0.42 : 0.16;

    map.set(item.id, {
      id: item.id,
      status,
      confidence,
      evidence,
    });
  }
  return map;
}

function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function hasOpenRouterApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function hasProviderApiKey(providerName: LlmProviderName): boolean {
  return providerName === 'anthropic' ? hasAnthropicApiKey() : hasOpenRouterApiKey();
}

function getAlternateProviderName(providerName: LlmProviderName): LlmProviderName {
  return providerName === 'anthropic' ? 'openrouter' : 'anthropic';
}

function isLikelyProviderKeyRoutingIssue(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('missing anthropic_api_key') ||
    message.includes('missing openrouter_api_key') ||
    message.includes('status 401') ||
    message.includes('status 403') ||
    message.includes('unauthorized')
  );
}

async function completeWithDirectProvider(
  providerName: LlmProviderName,
  request: LlmCompletionRequest,
): Promise<string> {
  if (providerName === 'anthropic') {
    return new AnthropicProvider().complete(request);
  }
  return new OpenRouterProvider().complete(request);
}

async function completeWithChecklistLlm(userPrompt: string): Promise<string> {
  const request: LlmCompletionRequest = {
    systemPrompt: CHECKLIST_LLM_SYSTEM_PROMPT,
    userPrompt,
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 1200,
    timeoutMs: CHECKLIST_LLM_TIMEOUT_MS,
  };

  try {
    return await completeWithLlmRouter(request);
  } catch (primaryError) {
    const primaryProvider =
      process.env.LLM_PROVIDER?.toLowerCase() === 'openrouter'
        ? 'openrouter'
        : 'anthropic';
    const alternateProvider = getAlternateProviderName(primaryProvider);
    if (
      !isLikelyProviderKeyRoutingIssue(primaryError) ||
      !hasProviderApiKey(alternateProvider)
    ) {
      throw primaryError;
    }

    return completeWithDirectProvider(alternateProvider, request);
  }
}

function getHigherNonCompletedStatus(
  a: ChecklistStatus,
  b: ChecklistStatus,
): 'uncovered' | 'partial' {
  const first = a === 'partial' ? 'partial' : 'uncovered';
  const second = b === 'partial' ? 'partial' : 'uncovered';
  return NON_COMPLETED_STATUS_ORDER[first] >= NON_COMPLETED_STATUS_ORDER[second]
    ? first
    : second;
}

function mergeChecklistStatus({
  previousStatus,
  candidateStatus,
  required,
  timedOut,
}: {
  previousStatus: ChecklistStatus;
  candidateStatus: ChecklistStatus;
  required: boolean;
  timedOut: boolean;
}): ChecklistStatus {
  if (previousStatus === 'completed' || candidateStatus === 'completed') {
    return 'completed';
  }

  const candidateFailed = candidateStatus === 'failed' && required && timedOut;
  if (previousStatus === 'failed' || candidateFailed) {
    return 'failed';
  }

  const baseStatus = getHigherNonCompletedStatus(previousStatus, candidateStatus);
  if (required && timedOut) return 'failed';
  return baseStatus;
}

function getRequiredFailAfterSeconds(definition: ChecklistDefinition): number {
  if (typeof definition.requiredFailAfterSeconds === 'number') {
    return definition.requiredFailAfterSeconds;
  }
  return REQUIRED_ITEM_FAIL_AFTER_SECONDS_DEFAULT;
}

function makeFailedEvidence(failAfterSeconds: number): string {
  return `Not covered within the first ${Math.round(failAfterSeconds)} seconds.`;
}

function mergeChecklistStates({
  mode,
  previousItems,
  candidateItems,
  evaluatedAtIso,
  sessionElapsedSeconds,
}: {
  mode: PitchMode;
  previousItems: RealtimeChecklistItemState[];
  candidateItems: Map<ChecklistItemId, NormalizedChecklistItem>;
  evaluatedAtIso: string;
  sessionElapsedSeconds: number;
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
    const required = definition.requiredModes.includes(mode);
    const failAfterSeconds = getRequiredFailAfterSeconds(definition);
    const timedOut = required && sessionElapsedSeconds >= failAfterSeconds;
    const status = mergeChecklistStatus({
      previousStatus,
      candidateStatus,
      required,
      timedOut,
    });

    const rawConfidence = clampConfidence(
      status === previousStatus
        ? Math.max(fallbackPrevious?.confidence ?? 0, candidate?.confidence ?? 0)
        : candidate?.confidence ?? fallbackPrevious?.confidence ?? 0,
    );
    const confidence = status === 'failed' ? Math.max(rawConfidence, 0.9) : rawConfidence;

    const mergedEvidence = normalizeEvidence(
      candidate?.evidence || fallbackPrevious?.evidence || '',
    );
    const evidence =
      status === 'failed'
        ? mergedEvidence || makeFailedEvidence(failAfterSeconds)
        : mergedEvidence;

    const changed =
      status !== (fallbackPrevious?.status ?? 'uncovered') ||
      evidence !== (fallbackPrevious?.evidence ?? '');

    return {
      id: definition.id,
      label: definition.label,
      status,
      confidence,
      evidence,
      required,
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

async function evaluateWithLlm({
  mode,
  transcript,
  sessionElapsedSeconds,
  previousItems,
}: {
  mode: PitchMode;
  transcript: string;
  sessionElapsedSeconds: number;
  previousItems: RealtimeChecklistItemState[];
}): Promise<{ items: Map<ChecklistItemId, NormalizedChecklistItem>; nextHint: string | null }> {
  const checklist = getChecklistDefinitions(mode);
  const userPrompt = buildRealtimeChecklistPrompt({
    mode,
    transcript: takeTailWords(transcript),
    sessionElapsedSeconds,
    checklist,
    previousItems,
  });
  const raw = await completeWithChecklistLlm(userPrompt);
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
  const sessionElapsedSeconds = Math.max(
    0,
    (nowMs - input.sessionStartedAtMs) / 1000,
  );
  const wordCount = countWords(input.transcript);
  let source: ChecklistUpdateSource = 'llm';
  let candidateItems: Map<ChecklistItemId, NormalizedChecklistItem>;
  let llmNextHint: string | null = null;

  try {
    const llm = await evaluateWithLlm({
      mode: input.mode,
      transcript: input.transcript,
      sessionElapsedSeconds,
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
    sessionElapsedSeconds,
  });

  const message = buildChecklistUpdateMessage({
    mode: input.mode,
    source,
    items,
    evaluatedAtIso,
  });

  if (source === 'llm' && llmNextHint) {
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
