import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeStoredAnalysis } from '@/services/analysisNormalizationService';
import { updateStreak } from '@/models/userStats';
import { awardXp, checkAndAwardStreakXp } from '@/services/xpService';
import { XP_VALUES } from '@/config/arena';
import type { AnalysisResultV2 } from '@/types/analysis-v2';
import type { InputType, PitchMode, RunStats, RunStatus } from '@/types/pitch';

export class RunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Run not found: ${runId}`);
  }
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
  analysis: AnalysisResultV2;
  meta: AnalysisResultV2['meta'] | null;
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
  analysis: AnalysisResultV2;
  meta?: AnalysisResultV2['meta'];
  deck_id?: string;
  is_fallback?: boolean;
}

function normalizeRun(run: Omit<RunRecord, 'analysis'> & { analysis: unknown }): RunRecord {
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
    analysis: normalizeStoredAnalysis(run.analysis, run.is_fallback),
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
  return (data ?? []).map((row: Omit<RunRecord, 'analysis'> & { analysis: unknown }) =>
    normalizeRun(row),
  );
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

/* ——— Run Completion (streak + XP) ——— */

export async function handleRunCompletion(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  overallScore: number,
): Promise<{
  streakResult?: { currentStreak: number; isNewMilestone: boolean; milestone?: number };
  xpAwarded?: number;
}> {
  let streakResult: { currentStreak: number; isNewMilestone: boolean; milestone?: number } | undefined;
  let xpAwarded = 0;

  // 1. Update streak
  try {
    streakResult = await updateStreak(supabase, userId);
  } catch (err) {
    console.error('[run-completion] updateStreak failed:', err instanceof Error ? err.message : 'Unknown error');
  }

  // 2. Award streak milestone XP if applicable
  if (streakResult?.isNewMilestone && streakResult.milestone) {
    try {
      const milestoneXp = await checkAndAwardStreakXp(
        supabase,
        userId,
        streakResult.currentStreak,
      );
      xpAwarded += milestoneXp;
    } catch (err) {
      console.error('[run-completion] checkAndAwardStreakXp failed:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // 3. Award pitch analysis XP
  try {
    await awardXp(
      supabase,
      userId,
      'pitch_analysis',
      XP_VALUES.PITCH_ANALYSIS,
      runId,
      { overallScore },
    );
    xpAwarded += XP_VALUES.PITCH_ANALYSIS;
  } catch (err) {
    console.error('[run-completion] awardXp pitch_analysis failed:', err instanceof Error ? err.message : 'Unknown error');
  }

  return { streakResult, xpAwarded };
}
