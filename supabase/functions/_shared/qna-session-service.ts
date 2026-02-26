import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  QASession,
  QASessionStatus,
  QASessionSummary,
  QATurn,
} from './types.ts';

const DEFAULT_DURATION_LIMIT_SECONDS = 60;
const QA_EXPIRE_SAFETY_SECONDS = 75;

interface QASessionRow {
  id: string;
  run_id: string;
  status: QASessionStatus;
  conversation_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  turns: unknown;
  transcript: string | null;
  evaluation: unknown;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function normalizeTurns(turns: unknown): QATurn[] {
  if (!Array.isArray(turns)) return [];
  const normalized: QATurn[] = [];
  turns.forEach((turn, index) => {
    if (!turn || typeof turn !== 'object') return;
    const row = turn as Record<string, unknown>;
    const text = String(row.text ?? '').trim();
    if (!text) return;
    const speaker: QATurn['speaker'] =
      row.speaker === 'investor' || row.speaker === 'founder' || row.speaker === 'system'
        ? row.speaker
        : 'system';
    normalized.push({
      id: String(row.id ?? `turn-${index + 1}`),
      speaker,
      text,
      start_sec:
        typeof row.start_sec === 'number' && Number.isFinite(row.start_sec)
          ? row.start_sec
          : undefined,
      end_sec:
        typeof row.end_sec === 'number' && Number.isFinite(row.end_sec)
          ? row.end_sec
          : undefined,
      latency_ms:
        typeof row.latency_ms === 'number' && Number.isFinite(row.latency_ms)
          ? row.latency_ms
          : undefined,
      created_at:
        typeof row.created_at === 'string' && row.created_at
          ? row.created_at
          : new Date().toISOString(),
    });
  });
  return normalized;
}

function toQASession(row: QASessionRow): QASession {
  // deno-lint-ignore no-explicit-any
  const durationLimitSeconds = Number((row.meta as any)?.duration_limit_seconds ?? DEFAULT_DURATION_LIMIT_SECONDS);
  return {
    id: row.id,
    runId: row.run_id,
    status: row.status,
    conversationId: row.conversation_id ?? undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    durationLimitSeconds:
      Number.isFinite(durationLimitSeconds) && durationLimitSeconds > 0
        ? durationLimitSeconds
        : DEFAULT_DURATION_LIMIT_SECONDS,
    durationSeconds: row.duration_seconds ?? undefined,
    turns: normalizeTurns(row.turns),
    transcript: row.transcript ?? undefined,
    evaluation:
      row.evaluation && typeof row.evaluation === 'object'
        ? (row.evaluation as QASession['evaluation'])
        : undefined,
    meta: row.meta ?? undefined,
  };
}

export async function createQASession(supabase: SupabaseClient, input: {
  runId: string;
  userId: string;
  status?: QASessionStatus;
  conversationId?: string;
  durationLimitSeconds?: number;
  meta?: Record<string, unknown>;
}): Promise<QASession> {
  const durationLimitSeconds =
    typeof input.durationLimitSeconds === 'number' && input.durationLimitSeconds > 0
      ? Math.round(input.durationLimitSeconds)
      : DEFAULT_DURATION_LIMIT_SECONDS;
  const now = new Date().toISOString();
  const payload = {
    run_id: input.runId,
    user_id: input.userId,
    status: input.status ?? 'active',
    conversation_id: input.conversationId ?? null,
    started_at: now,
    turns: [],
    meta: {
      ...(input.meta ?? {}),
      duration_limit_seconds: durationLimitSeconds,
      created_from: 'native-elevenlabs',
    },
  };

  const { data, error } = await supabase.from('qa_sessions').insert(payload).select('*').single();
  if (error || !data) {
    throw new Error(`Failed to create QA session: ${error?.message ?? 'unknown error'}`);
  }

  return toQASession(data as QASessionRow);
}

export async function getQASession(supabase: SupabaseClient, qaSessionId: string): Promise<QASession | null> {
  const { data, error } = await supabase
    .from('qa_sessions')
    .select('*')
    .eq('id', qaSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch QA session: ${error.message}`);
  }
  if (!data) return null;
  return toQASession(data as QASessionRow);
}

export async function updateQASession(
  supabase: SupabaseClient,
  qaSessionId: string,
  patch: Partial<{
    status: QASessionStatus;
    conversation_id: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
    turns: QATurn[];
    transcript: string | null;
    evaluation: Record<string, unknown> | null;
    meta: Record<string, unknown> | null;
  }>,
): Promise<QASession> {
  const { data, error } = await supabase
    .from('qa_sessions')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', qaSessionId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update QA session: ${error?.message ?? 'unknown error'}`);
  }

  return toQASession(data as QASessionRow);
}

export async function completeQASession(
  supabase: SupabaseClient,
  qaSessionId: string,
  payload: {
    status?: QASessionStatus;
    conversationId?: string;
    durationSeconds?: number;
    turns?: QATurn[];
    transcript?: string;
    evaluation?: Record<string, unknown>;
    meta?: Record<string, unknown>;
  },
): Promise<QASession> {
  const now = new Date().toISOString();
  const nextStatus = payload.status ?? 'completed';
  const turns = payload.turns ?? [];
  return updateQASession(supabase, qaSessionId, {
    status: nextStatus,
    conversation_id: payload.conversationId ?? null,
    completed_at: now,
    duration_seconds:
      typeof payload.durationSeconds === 'number' && payload.durationSeconds >= 0
        ? Math.round(payload.durationSeconds)
        : null,
    turns,
    transcript: payload.transcript ?? null,
    evaluation: (payload.evaluation ?? null) as Record<string, unknown> | null,
    meta: (payload.meta ?? null) as Record<string, unknown> | null,
  });
}

export async function expireQASessionIfTimedOut(
  supabase: SupabaseClient,
  qaSessionId: string,
): Promise<QASession | null> {
  const session = await getQASession(supabase, qaSessionId);
  if (!session) return null;
  if (session.status !== 'created' && session.status !== 'active') return session;

  const startedAtMs = Date.parse(session.startedAt);
  if (!Number.isFinite(startedAtMs)) return session;
  const elapsedSeconds = (Date.now() - startedAtMs) / 1000;
  if (elapsedSeconds <= QA_EXPIRE_SAFETY_SECONDS) return session;

  return updateQASession(supabase, qaSessionId, {
    status: 'expired',
    completed_at: new Date().toISOString(),
    duration_seconds: Math.round(elapsedSeconds),
    meta: {
      ...(session.meta ?? {}),
      expired_by_timeout: true,
      timeout_seconds: QA_EXPIRE_SAFETY_SECONDS,
    },
  });
}

export async function listQASessionSummariesByRunIds(
  supabase: SupabaseClient,
  runIds: string[],
): Promise<Map<string, QASessionSummary[]>> {
  const summaryMap = new Map<string, QASessionSummary[]>();
  if (runIds.length === 0) return summaryMap;

  const uniqueRunIds = [...new Set(runIds)];
  const { data, error } = await supabase
    .from('qa_sessions')
    .select('id, run_id, status, started_at, completed_at, duration_seconds')
    .in('run_id', uniqueRunIds)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list QA session summaries: ${error.message}`);
  }

  for (const row of (data ?? []) as Array<{
    id: string;
    run_id: string;
    status: QASessionStatus;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
  }>) {
    const bucket = summaryMap.get(row.run_id) ?? [];
    bucket.push({
      qaSessionId: row.id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      durationSeconds: row.duration_seconds ?? undefined,
    });
    summaryMap.set(row.run_id, bucket);
  }

  return summaryMap;
}
