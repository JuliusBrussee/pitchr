import type { AnalysisResult } from '@/types/analysis';
import type { Run, RunStats } from '@/types/pitch';

export const RUN_STORAGE_KEY = 'pitchr_runs';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isObject(value)) return false;
  return (
    typeof value.overall_score === 'number' &&
    typeof value.one_line_verdict === 'string' &&
    Array.isArray(value.rubric_breakdown) &&
    Array.isArray(value.top_fixes) &&
    typeof value.rewrite_script === 'string' &&
    isObject(value.delivery_metrics)
  );
}

function isRun(value: unknown): value is Run {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.mode === 'elevator' || value.mode === 'vc_pitch') &&
    (value.inputType === 'audio' || value.inputType === 'text') &&
    typeof value.transcript === 'string' &&
    typeof value.overallScore === 'number' &&
    isAnalysisResult(value.analysis) &&
    (value.fallback === undefined || typeof value.fallback === 'boolean')
  );
}

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function sortByCreatedAtDesc(runs: Run[]): Run[] {
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readRunsFromStorage(): Run[] {
  if (!hasWindow()) return [];
  const raw = window.localStorage.getItem(RUN_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByCreatedAtDesc(parsed.filter(isRun));
  } catch {
    return [];
  }
}

function writeRunsToStorage(runs: Run[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(sortByCreatedAtDesc(runs)));
}

export function getRuns(): Run[] {
  return readRunsFromStorage();
}

export function getRun(id: string): Run | null {
  return getRuns().find((run) => run.id === id) ?? null;
}

export function saveRun(run: Run): void {
  const current = getRuns();
  const withoutExisting = current.filter((existing) => existing.id !== run.id);
  writeRunsToStorage([...withoutExisting, run]);
}

export function deleteRun(id: string): boolean {
  const current = getRuns();
  const next = current.filter((run) => run.id !== id);
  if (next.length === current.length) return false;
  writeRunsToStorage(next);
  return true;
}

export function getStats(): RunStats {
  const runs = getRuns();
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      averageScore: 0,
      bestScore: 0,
      trend: [],
    };
  }

  const totalRuns = runs.length;
  const totalScore = runs.reduce((sum, run) => sum + run.overallScore, 0);
  const averageScore = Math.round(totalScore / totalRuns);
  const bestScore = runs.reduce((best, run) => Math.max(best, run.overallScore), 0);

  return {
    totalRuns,
    averageScore,
    bestScore,
    trend: runs
      .slice()
      .reverse()
      .slice(-10)
      .map((run) => run.overallScore),
  };
}
