import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';
import type { PitchMode, RunStats, RunStatus, InputType, Coverage, Run, QASessionSummary } from './types.ts';

export class RunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Run not found: ${runId}`);
  }
}

// deno-lint-ignore no-explicit-any
export interface RunRecord {
  id: string;
  user_id: string;
  mode: PitchMode;
  status: RunStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  input_type: InputType;
  transcript: string;
  audio_url: string | null;
  overall_score: number;
  // deno-lint-ignore no-explicit-any
  analysis: any;
  // deno-lint-ignore no-explicit-any
  meta: any;
  deck_id: string | null;
  is_fallback: boolean;
  created_at: string;
}

export interface RunInsert {
  id?: string;
  user_id: string;
  mode: PitchMode;
  status?: RunStatus;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  input_type: InputType;
  transcript: string;
  audio_url?: string;
  overall_score: number;
  // deno-lint-ignore no-explicit-any
  analysis: any;
  // deno-lint-ignore no-explicit-any
  meta?: any;
  deck_id?: string;
  is_fallback?: boolean;
}

function withMigrationHint(message: string): string {
  if (
    message.includes('column runs.status does not exist') ||
    message.includes('column "status" of relation "runs" does not exist') ||
    message.includes('column runs.meta does not exist') ||
    message.includes('column "meta" of relation "runs" does not exist')
  ) {
    return `${message}. Apply migration: migrations/08-add-run-lifecycle-columns.sql`;
  }
  return message;
}

function normalizeRun(run: RunRecord): RunRecord {
  const normalizedStatus: RunStatus =
    run.status === 'queued' || run.status === 'running' || run.status === 'failed'
      ? run.status
      : 'complete';
  return {
    ...run,
    status: normalizedStatus,
    error_message: run.error_message ?? null,
    started_at: run.started_at ?? null,
    completed_at: run.completed_at ?? null,
    meta: run.meta ?? null,
  };
}

export async function insertRun(supabase: SupabaseClient, run: RunInsert): Promise<RunRecord> {
  const payload = {
    ...run,
    status: run.status ?? 'complete',
    error_message: run.error_message ?? null,
    started_at: run.started_at ?? null,
    completed_at: run.completed_at ?? null,
    audio_url: run.audio_url ?? null,
    deck_id: run.deck_id ?? null,
    is_fallback: run.is_fallback ?? false,
    meta: run.meta ?? null,
  };
  const { data, error } = await supabase.from('runs').insert(payload).select('*').single();
  if (error || !data) {
    throw new Error(withMigrationHint(`Failed to insert run: ${error?.message ?? 'unknown error'}`));
  }
  return normalizeRun(data);
}

export async function listRuns(supabase: SupabaseClient, opts?: {
  mode?: PitchMode;
  limit?: number;
}): Promise<RunRecord[]> {
  let query = supabase.from('runs').select('*').order('created_at', { ascending: false });
  if (opts?.mode) query = query.eq('mode', opts.mode);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw new Error(withMigrationHint(`Failed to list runs: ${error.message}`));
  return (data ?? []).map((row: RunRecord) => normalizeRun(row));
}

export async function getRun(supabase: SupabaseClient, runId: string): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      throw new RunNotFoundError(runId);
    }
    throw new Error(withMigrationHint(`Failed to get run: ${error?.message ?? 'unknown error'}`));
  }
  return normalizeRun(data);
}

export async function deleteRun(supabase: SupabaseClient, runId: string): Promise<void> {
  const { error, count } = await supabase
    .from('runs')
    .delete({ count: 'exact' })
    .eq('id', runId);
  if (error) {
    throw new Error(withMigrationHint(`Failed to delete run: ${error.message}`));
  }
  if ((count ?? 0) === 0) {
    throw new RunNotFoundError(runId);
  }
}

export async function updateRun(
  supabase: SupabaseClient,
  runId: string,
  updates: Partial<
    Pick<
      RunRecord,
      | 'status'
      | 'error_message'
      | 'started_at'
      | 'completed_at'
      | 'overall_score'
      | 'analysis'
      | 'meta'
      | 'is_fallback'
      | 'audio_url'
    >
  >,
): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .update(updates)
    .eq('id', runId)
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      throw new RunNotFoundError(runId);
    }
    throw new Error(withMigrationHint(`Failed to update run: ${error?.message ?? 'unknown error'}`));
  }

  return normalizeRun(data);
}

export function computeRunStats(runs: RunRecord[]): RunStats {
  const completedRuns = runs.filter((run) => run.status === 'complete');

  if (completedRuns.length === 0) {
    return {
      totalRuns: 0,
      averageScore: 0,
      bestScore: 0,
      trend: [],
    };
  }

  const totalRuns = completedRuns.length;
  const totalScore = completedRuns.reduce((sum, run) => sum + run.overall_score, 0);
  const averageScore = Math.round(totalScore / totalRuns);
  const bestScore = Math.max(...completedRuns.map((run) => run.overall_score));
  const trend = [...completedRuns]
    .reverse()
    .slice(-10)
    .map((run) => run.overall_score);

  return { totalRuns, averageScore, bestScore, trend };
}

export async function getRunStats(supabase: SupabaseClient): Promise<RunStats> {
  const runs = await listRuns(supabase);
  return computeRunStats(runs);
}

export function toRunResponse(
  run: RunRecord,
  qaSessionsSummary?: QASessionSummary[],
): Run {
  const isComplete = run.status === 'complete';
  return {
    id: run.id,
    createdAt: run.created_at,
    startedAt: run.started_at ?? undefined,
    completedAt: run.completed_at ?? undefined,
    mode: run.mode,
    status: run.status,
    error: run.error_message ?? undefined,
    inputType: run.input_type,
    transcript: run.transcript,
    audioUrl: run.audio_url ?? undefined,
    deckId: run.deck_id ?? undefined,
    analysis: isComplete ? run.analysis?.outputs?.feedback : undefined,
    analysisVersion: isComplete ? run.analysis?.analysisVersion : undefined,
    coverage: isComplete ? run.analysis?.coverage : undefined,
    outputs: isComplete ? run.analysis?.outputs : undefined,
    meta: isComplete ? run.analysis?.meta : run.meta ?? undefined,
    qaSessionsSummary,
    overallScore: run.overall_score,
    fallback: run.is_fallback,
  };
}
