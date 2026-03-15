import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  PLAYWRIGHT_DISABLE_SUPABASE_AUTH: process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH,
};

const LOCAL_REGRESSION_STORAGE_KEY = 'pitchr_local_regression_edge_v1';

function restoreEnv(key: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[key];
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

beforeEach(() => {
  localStorage.removeItem(LOCAL_REGRESSION_STORAGE_KEY);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH = 'true';
});

afterEach(() => {
  localStorage.removeItem(LOCAL_REGRESSION_STORAGE_KEY);
  restoreEnv('NEXT_PUBLIC_SUPABASE_URL');
  restoreEnv('PLAYWRIGHT_DISABLE_SUPABASE_AUTH');
});

describe('local regression edge fallback', () => {
  it('enables local regression mode for placeholder supabase URL in local playwright bypass mode', async () => {
    const { isLocalRegressionMode } = await import('@/lib/supabase/local-regression-edge');
    expect(isLocalRegressionMode()).toBe(true);
  });

  it('returns deterministic seeded projects and creates runs via local pitch-run handler', async () => {
    const {
      handleLocalRegressionEdgeRequest,
    } = await import('@/lib/supabase/local-regression-edge');

    const projectsResponse = await handleLocalRegressionEdgeRequest('projects');
    expect(projectsResponse.ok).toBe(true);
    const projectsPayload = (await projectsResponse.json()) as {
      projects: Array<{ id: string }>;
      activeProjectId: string | null;
    };

    expect(projectsPayload.projects.length).toBeGreaterThan(0);
    expect(projectsPayload.activeProjectId).toBe(projectsPayload.projects[0]?.id ?? null);

    const projectId = projectsPayload.activeProjectId ?? projectsPayload.projects[0]!.id;

    const createRunResponse = await handleLocalRegressionEdgeRequest('pitch-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'vc_pitch',
        inputType: 'text',
        projectId,
        transcript: 'We help founders practice investor pitches.',
      }),
    });

    expect(createRunResponse.ok).toBe(true);
    const createdRun = (await createRunResponse.json()) as {
      runId: string;
      status: string;
    };
    expect(createdRun.status).toBe('complete');
    expect(createdRun.runId).toMatch(/[0-9a-f-]{36}/iu);

    const detailResponse = await handleLocalRegressionEdgeRequest('pitch-run-detail', {
      params: { runId: createdRun.runId },
    });
    expect(detailResponse.ok).toBe(true);
    const detailPayload = (await detailResponse.json()) as {
      run: { id: string; status: string; outputs?: unknown; analysis?: unknown };
    };
    expect(detailPayload.run.id).toBe(createdRun.runId);
    expect(detailPayload.run.status).toBe('complete');
    expect(detailPayload.run.outputs).toBeDefined();
    expect(detailPayload.run.analysis).toBeDefined();

    const listResponse = await handleLocalRegressionEdgeRequest('pitch-run', {
      params: { projectId },
    });
    expect(listResponse.ok).toBe(true);
    const listPayload = (await listResponse.json()) as {
      runs: Array<{ id: string }>;
      stats: { totalRuns: number };
    };
    expect(listPayload.runs[0]?.id).toBe(createdRun.runId);
    expect(listPayload.stats.totalRuns).toBeGreaterThan(0);
  });
});
