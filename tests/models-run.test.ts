import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getRuns, getRun, saveRun, deleteRun } from '@/models/run';
import type { Run } from '@/types/pitch';

// Mock localStorage
const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-1',
    createdAt: '2024-01-01T00:00:00Z',
    mode: 'vc_pitch',
    status: 'complete',
    inputType: 'text',
    transcript: 'test pitch',
    overallScore: 65,
    fallback: false,
    ...overrides,
  } as Run;
}

describe('models/run localStorage CRUD', () => {
  it('returns empty array when no runs stored', () => {
    const runs = getRuns();
    expect(runs).toEqual([]);
  });

  it('saves and retrieves a run', () => {
    const run = makeRun({ id: 'run-1' });
    saveRun(run);
    const runs = getRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe('run-1');
  });

  it('sorts runs by createdAt descending', () => {
    saveRun(makeRun({ id: 'r1', createdAt: '2024-01-01T00:00:00Z' }));
    saveRun(makeRun({ id: 'r2', createdAt: '2024-01-03T00:00:00Z' }));
    saveRun(makeRun({ id: 'r3', createdAt: '2024-01-02T00:00:00Z' }));
    const runs = getRuns();
    expect(runs[0].id).toBe('r2');
    expect(runs[1].id).toBe('r3');
    expect(runs[2].id).toBe('r1');
  });

  it('getRun returns matching run or null', () => {
    saveRun(makeRun({ id: 'r1' }));
    expect(getRun('r1')?.id).toBe('r1');
    expect(getRun('nonexistent')).toBeNull();
  });

  it('saveRun updates existing run by id', () => {
    saveRun(makeRun({ id: 'r1', overallScore: 50 }));
    saveRun(makeRun({ id: 'r1', overallScore: 80 }));
    const runs = getRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0].overallScore).toBe(80);
  });

  it('deleteRun removes run by id', () => {
    saveRun(makeRun({ id: 'r1' }));
    saveRun(makeRun({ id: 'r2' }));
    deleteRun('r1');
    const runs = getRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe('r2');
  });

  it('deleteRun is no-op for non-existent id', () => {
    saveRun(makeRun({ id: 'r1' }));
    deleteRun('nonexistent');
    expect(getRuns()).toHaveLength(1);
  });

  it('handles corrupted localStorage gracefully', () => {
    storage.set('pitchr_runs', 'not valid json');
    expect(getRuns()).toEqual([]);
  });

  it('handles non-array localStorage gracefully', () => {
    storage.set('pitchr_runs', JSON.stringify({ not: 'an array' }));
    expect(getRuns()).toEqual([]);
  });
});
