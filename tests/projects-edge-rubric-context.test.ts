import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAuthenticatedUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockCreateProject = vi.fn();
const mockEnsureSeedProjects = vi.fn();
const mockGetActiveProjectId = vi.fn();
const mockGetProjectById = vi.fn();
const mockResolveProjectForRequest = vi.fn();
const mockSetActiveProject = vi.fn();
const mockToProject = vi.fn();
const mockUpdateProject = vi.fn();

let servedHandler: ((req: Request) => Promise<Response>) | undefined;

vi.mock('npm:@supabase/supabase-js@^2.97.0', () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock(import('@/supabase/functions/_shared/supabase.ts'), () => {
  class AuthenticationError extends Error {}
  return {
    AuthenticationError,
    createAdminClient: mockCreateAdminClient,
    getAuthenticatedUser: mockGetAuthenticatedUser,
  };
});

vi.mock(import('@/supabase/functions/_shared/project-service.ts'), () => {
  class ProjectNotFoundError extends Error {}
  return {
    ProjectNotFoundError,
    createProject: mockCreateProject,
    ensureSeedProjects: mockEnsureSeedProjects,
    getActiveProjectId: mockGetActiveProjectId,
    getProjectById: mockGetProjectById,
    resolveProjectForRequest: mockResolveProjectForRequest,
    setActiveProject: mockSetActiveProject,
    toProject: mockToProject,
    updateProject: mockUpdateProject,
  };
});

function buildProject(overrides?: Record<string, unknown>) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    is_archived: false,
    prompt_overrides: {},
    ...overrides,
  };
}

function buildAdminClientLookup(projectRow: { id: string; user_id: string } | null) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: { allowed: true, current: 1, limit: 15, retry_after: 0 },
      error: null,
    }),
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: projectRow, error: null }),
        }),
      }),
    }),
  };
}

async function getProjectsHandler() {
  await import('@/supabase/functions/projects/index.ts');
  if (!servedHandler) {
    throw new Error('Expected Deno.serve handler registration.');
  }
  return servedHandler;
}

async function invokeProjectsHandler(method: 'POST' | 'PATCH', body: Record<string, unknown>) {
  const handler = await getProjectsHandler();
  return handler(new Request('https://example.test/projects', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }));
}

describe('projects edge rubric context validation (ProjectValidationError mapping)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    servedHandler = undefined;

    (globalThis as Record<string, unknown>).Deno = {
      serve: (handler: (req: Request) => Promise<Response>) => {
        servedHandler = handler;
      },
    };

    mockGetAuthenticatedUser.mockResolvedValue({
      supabase: { test: 'client' },
      user: { id: 'user-123' },
    });
    mockCreateAdminClient.mockReturnValue(buildAdminClientLookup(null));
    mockCreateProject.mockResolvedValue(buildProject());
    mockGetProjectById.mockResolvedValue(buildProject());
    mockUpdateProject.mockResolvedValue(buildProject());
    mockGetActiveProjectId.mockResolvedValue('11111111-1111-4111-8111-111111111111');
    mockSetActiveProject.mockResolvedValue(undefined);
    mockResolveProjectForRequest.mockResolvedValue(buildProject({ id: 'fallback-project' }));
    mockEnsureSeedProjects.mockResolvedValue([buildProject()]);
    mockToProject.mockImplementation((project: any) => ({
      id: project.id,
      isArchived: Boolean(project.is_archived),
      promptOverrides: project.prompt_overrides ?? {},
    }));
  });

  it('rejects invalid analysis_system_prompt on POST', async () => {
    const response = await invokeProjectsHandler('POST', {
      name: 'My Project',
      type: 'two_min_pitch',
      promptOverrides: {
        analysis_system_prompt: '   ',
      },
    });

    expect(response.status).toBe(400);
    const payload = await response.json() as { error: string };
    expect(payload.error).toContain('analysis_system_prompt');
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it('rejects invalid analysis_system_prompt on PATCH', async () => {
    const response = await invokeProjectsHandler('PATCH', {
      projectId: '22222222-2222-4222-8222-222222222222',
      promptOverrides: {
        analysis_system_prompt: 'a'.repeat(4001),
      },
    });

    expect(response.status).toBe(400);
    const payload = await response.json() as { error: string };
    expect(payload.error).toContain('analysis_system_prompt');
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it('normalizes valid analysis_system_prompt values before persistence', async () => {
    const postResponse = await invokeProjectsHandler('POST', {
      name: 'My Project',
      type: 'two_min_pitch',
      promptOverrides: {
        analysis_system_prompt: '  Keep this concise.  ',
      },
    });
    expect(postResponse.status).toBe(201);
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
        expect.objectContaining({
          promptOverrides: expect.objectContaining({
            analysis_system_prompt: 'Keep this concise.',
            analysis_system_prompt_policy: expect.objectContaining({
              version: 'v1',
              source_chars: 'Keep this concise.'.length,
              required_terms: expect.any(Array),
              hard_caps: expect.any(Array),
            }),
            analysis_system_prompt_meta: expect.objectContaining({
              updated_by: 'user-123',
              updated_at: expect.any(String),
            }),
          }),
      }),
    );

    const patchResponse = await invokeProjectsHandler('PATCH', {
      projectId: '22222222-2222-4222-8222-222222222222',
      promptOverrides: {
        analysis_system_prompt: '  Refine the ask and proof.  ',
      },
    });
    expect(patchResponse.status).toBe(200);
    expect(mockUpdateProject).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      '22222222-2222-4222-8222-222222222222',
        expect.objectContaining({
          promptOverrides: expect.objectContaining({
            analysis_system_prompt: 'Refine the ask and proof.',
            analysis_system_prompt_policy: expect.objectContaining({
              version: 'v1',
              source_chars: 'Refine the ask and proof.'.length,
              required_terms: expect.any(Array),
              hard_caps: expect.any(Array),
            }),
            analysis_system_prompt_meta: expect.objectContaining({
              updated_by: 'user-123',
              updated_at: expect.any(String),
            }),
          }),
        }),
      );
    });

  it('stores parsed hard-cap policy when rubric includes explicit cap rule', async () => {
    const response = await invokeProjectsHandler('POST', {
      name: 'My Project',
      type: 'two_min_pitch',
      promptOverrides: {
        analysis_system_prompt:
          'If "pineapple" is absent, do not score any category above 6/20.',
      },
    });

    expect(response.status).toBe(201);
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({
        promptOverrides: expect.objectContaining({
          analysis_system_prompt_policy: expect.objectContaining({
            required_terms: expect.arrayContaining(['pineapple']),
            hard_caps: expect.arrayContaining([
              expect.objectContaining({
                scope: 'all',
                required_term: 'pineapple',
                max_score: 6,
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it('keeps POST/PATCH behavior unchanged when rubric context is not updated', async () => {
    const postResponse = await invokeProjectsHandler('POST', {
      name: 'My Project',
      type: 'two_min_pitch',
    });
    expect(postResponse.status).toBe(201);
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      expect.objectContaining({
        promptOverrides: undefined,
      }),
    );

    const patchResponse = await invokeProjectsHandler('PATCH', {
      projectId: '22222222-2222-4222-8222-222222222222',
      name: 'Renamed Project',
    });
    expect(patchResponse.status).toBe(200);
    expect(mockUpdateProject).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      '22222222-2222-4222-8222-222222222222',
      expect.objectContaining({
        name: 'Renamed Project',
        promptOverrides: undefined,
      }),
    );
  });

  it('returns 403 when patching a project owned by another user', async () => {
    const { ProjectNotFoundError } = await import('@/supabase/functions/_shared/project-service.ts');
    mockGetProjectById.mockRejectedValueOnce(
      new ProjectNotFoundError('22222222-2222-4222-8222-222222222222'),
    );
    mockCreateAdminClient.mockReturnValue(
      buildAdminClientLookup({
        id: '22222222-2222-4222-8222-222222222222',
        user_id: 'someone-else',
      }),
    );

    const response = await invokeProjectsHandler('PATCH', {
      projectId: '22222222-2222-4222-8222-222222222222',
      promptOverrides: {
        analysis_system_prompt: 'Protect the upside with clear execution proof.',
      },
    });

    expect(response.status).toBe(403);
    const payload = await response.json() as { error: string };
    expect(payload.error).toContain('owner/admin');
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });
});
