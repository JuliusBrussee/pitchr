import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAuthenticatedUser = vi.fn();
const mockCreateProject = vi.fn();
const mockEnsureSeedProjects = vi.fn();
const mockGetActiveProjectId = vi.fn();
const mockGetProjectById = vi.fn();
const mockResolveProjectForRequest = vi.fn();
const mockSetActiveProject = vi.fn();
const mockToProject = vi.fn();
const mockUpdateProject = vi.fn();

let servedHandler: ((req: Request) => Promise<Response>) | undefined;

vi.mock('@/supabase/functions/_shared/supabase.ts', () => {
  class AuthenticationError extends Error {}
  return {
    AuthenticationError,
    getAuthenticatedUser: mockGetAuthenticatedUser,
  };
});

vi.mock('@/supabase/functions/_shared/project-service.ts', () => {
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

async function getProjectsHandler() {
  await import('@/supabase/functions/projects/index.ts');
  if (!servedHandler) {
    throw new Error('Expected Deno.serve handler registration.');
  }
  return servedHandler;
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
    mockCreateProject.mockResolvedValue(buildProject());
    mockGetProjectById.mockResolvedValue(buildProject());
    mockUpdateProject.mockResolvedValue(buildProject());
    mockGetActiveProjectId.mockResolvedValue('11111111-1111-4111-8111-111111111111');
    mockSetActiveProject.mockResolvedValue(undefined);
    mockResolveProjectForRequest.mockResolvedValue(buildProject({ id: 'fallback-project' }));
    mockEnsureSeedProjects.mockResolvedValue([buildProject()]);
    mockToProject.mockImplementation((project) => ({
      id: project.id,
      isArchived: Boolean(project.is_archived),
      promptOverrides: project.prompt_overrides ?? {},
    }));
  });

  it('rejects invalid analysis_system_prompt on POST', async () => {
    const handler = await getProjectsHandler();
    const response = await handler(new Request('https://example.test/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'My Project',
        type: 'two_min_pitch',
        promptOverrides: {
          analysis_system_prompt: '   ',
        },
      }),
    }));

    expect(response.status).toBe(400);
    const payload = await response.json() as { error: string };
    expect(payload.error).toContain('analysis_system_prompt');
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it('rejects invalid analysis_system_prompt on PATCH', async () => {
    const handler = await getProjectsHandler();
    const response = await handler(new Request('https://example.test/projects', {
      method: 'PATCH',
      body: JSON.stringify({
        projectId: '22222222-2222-4222-8222-222222222222',
        promptOverrides: {
          analysis_system_prompt: 'a'.repeat(4001),
        },
      }),
    }));

    expect(response.status).toBe(400);
    const payload = await response.json() as { error: string };
    expect(payload.error).toContain('analysis_system_prompt');
  });
});
