import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/types/analysis';
import type { PitchMode, InputType } from '@/types/pitch';

/* ─── Types ─── */

export interface RunRecord {
  id: string;
  mode: PitchMode;
  input_type: InputType;
  transcript: string;
  audio_url: string | null;
  overall_score: number;
  analysis: AnalysisResult;
  deck_id: string | null;
  is_fallback: boolean;
  created_at: string;
}

export interface RunInsert {
  mode: PitchMode;
  input_type: InputType;
  transcript: string;
  audio_url?: string;
  overall_score: number;
  analysis: AnalysisResult;
  deck_id?: string;
  is_fallback?: boolean;
}

export interface RunStats {
  totalRuns: number;
  averageScore: number;
  bestScore: number;
  trend: number[];
}

/* ─── Database Operations ─── */

export async function insertRun(run: RunInsert): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .insert(run)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert run: ${error.message}`);
  return data;
}

export async function listRuns(opts?: { mode?: PitchMode; limit?: number }): Promise<RunRecord[]> {
  let query = supabase
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts?.mode) {
    query = query.eq('mode', opts.mode);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list runs: ${error.message}`);
  return data;
}

export async function getRun(id: string): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to get run: ${error.message}`);
  return data;
}

export async function deleteRun(id: string): Promise<void> {
  const { error } = await supabase
    .from('runs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete run: ${error.message}`);
}

export async function getRunStats(): Promise<RunStats> {
  const { data: runs, error } = await supabase
    .from('runs')
    .select('overall_score, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get run stats: ${error.message}`);

  if (!runs || runs.length === 0) {
    return { totalRuns: 0, averageScore: 0, bestScore: 0, trend: [] };
  }

  const totalRuns = runs.length;
  const totalScore = runs.reduce((sum, r) => sum + r.overall_score, 0);
  const averageScore = Math.round(totalScore / totalRuns);
  const bestScore = Math.max(...runs.map((r) => r.overall_score));
  const trend = runs
    .slice()
    .reverse()
    .slice(-10)
    .map((r) => r.overall_score);

  return { totalRuns, averageScore, bestScore, trend };
}
