import type { Run } from '@/types/pitch';

const RUNS_STORAGE_KEY = 'pitchr_runs';

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function parseRuns(raw: string | null): Run[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Run[]) : [];
  } catch {
    return [];
  }
}

function writeRuns(runs: Run[]): void {
  if (!isClient()) return;
  window.localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs));
}

export function getRuns(): Run[] {
  if (!isClient()) return [];
  return parseRuns(window.localStorage.getItem(RUNS_STORAGE_KEY)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getRun(id: string): Run | null {
  return getRuns().find((run) => run.id === id) ?? null;
}

export function saveRun(run: Run): void {
  const runs = getRuns();
  const index = runs.findIndex((entry) => entry.id === run.id);
  if (index >= 0) {
    runs[index] = run;
  } else {
    runs.unshift(run);
  }
  writeRuns(runs);
}

export function deleteRun(id: string): void {
  const next = getRuns().filter((run) => run.id !== id);
  writeRuns(next);
}

