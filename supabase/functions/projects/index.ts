// Edge Function: projects
// Methods:
//   GET    /projects?includeArchived=true|false
//   POST   /projects
//   PATCH  /projects

import { handleCors } from '../_shared/cors.ts';
import {
  getAuthenticatedUser,
  createAdminClient,
  AuthenticationError,
} from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isProjectTypeId } from '../_shared/project-config.ts';
import {
  validateRubricContextForSave,
  withRubricContextPromptMetadata,
} from '../_shared/rubric-context.ts';
import {
  createProject,
  ensureSeedProjects,
  getActiveProjectId,
  getProjectById,
  ProjectNotFoundError,
  resolveProjectForRequest,
  setActiveProject,
  toProject,
  updateProject,
} from '../_shared/project-service.ts';

class ProjectValidationError extends Error {}
class ProjectPermissionError extends Error {}

function normalizePromptOverrides(
  value: unknown,
  opts?: { updatedBy?: string; nowIso?: string },
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const promptOverrides = value as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(promptOverrides, 'analysis_system_prompt')) {
    return promptOverrides;
  }

  const validation = validateRubricContextForSave(promptOverrides.analysis_system_prompt);
  if (!validation.valid) {
    throw new ProjectValidationError(validation.error);
  }

  const normalizedPromptOverrides = {
    ...promptOverrides,
    analysis_system_prompt: validation.value,
  };

  if (!opts?.updatedBy) {
    return normalizedPromptOverrides;
  }

  return withRubricContextPromptMetadata(
    normalizedPromptOverrides,
    opts.updatedBy,
    opts.nowIso,
  );
}

async function assertProjectPermission(
  projectId: string,
  userId: string,
): Promise<void> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('projects')
    .select('id,user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify project permissions: ${error.message}`);
  }
  if (data && data.user_id !== userId) {
    throw new ProjectPermissionError('Only project owner/admin can update rubric context.');
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

async function handleGet(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const includeArchived = url.searchParams.get('includeArchived') === 'true';

  // Run seed check and active project lookup in parallel
  const [projects, activeId] = await Promise.all([
    ensureSeedProjects(supabase, user.id),
    getActiveProjectId(supabase, user.id),
  ]);

  let activeProjectId = activeId;
  const activeExists = activeProjectId && projects.some((project) => project.id === activeProjectId && !project.is_archived);
  if (!activeExists) {
    // Resolve a fallback from the already-loaded projects list
    const nonArchived = projects.filter((p) => !p.is_archived);
    const fallback = nonArchived.find((p) => p.type === 'two_min_pitch') ?? nonArchived[0] ?? projects[0];
    if (fallback) {
      activeProjectId = fallback.id;
      await setActiveProject(supabase, user.id, fallback.id);
    } else {
      activeProjectId = null;
    }
  }

  return jsonResponse({
    projects: projects
      .filter((project) => includeArchived || !project.is_archived)
      .map(toProject),
    activeProjectId,
  });
}

async function handlePost(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    throw new ProjectValidationError('Invalid JSON body.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const type = body.type;
  const setActive = body.setActive === true;
  if (!name) {
    throw new ProjectValidationError('name is required.');
  }
  if (!isProjectTypeId(type)) {
    throw new ProjectValidationError('type must be one of: two_min_pitch, elevator_pitch.');
  }
  const promptOverrides = normalizePromptOverrides(body.promptOverrides, {
    updatedBy: user.id,
    nowIso: new Date().toISOString(),
  });

  const project = await createProject(supabase, user.id, {
    name,
    type,
    promptOverrides,
  });
  if (setActive) {
    await setActiveProject(supabase, user.id, project.id);
  }

  return jsonResponse(
    {
      project: toProject(project),
      activeProjectId: setActive ? project.id : await getActiveProjectId(supabase, user.id),
    },
    201,
  );
}

async function handlePatch(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    throw new ProjectValidationError('Invalid JSON body.');
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId || !isUuid(projectId)) {
    throw new ProjectValidationError('projectId is required and must be a UUID.');
  }

  const promptOverrides = normalizePromptOverrides(body.promptOverrides, {
    updatedBy: user.id,
    nowIso: new Date().toISOString(),
  });

  let project;
  try {
    project = await getProjectById(supabase, user.id, projectId);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      await assertProjectPermission(projectId, user.id);
    }
    throw error;
  }

  project = await updateProject(supabase, user.id, projectId, {
    name: typeof body.name === 'string' ? body.name : undefined,
    isArchived: typeof body.isArchived === 'boolean' ? body.isArchived : undefined,
    promptOverrides,
  });

  const setActive = body.setActive === true;
  if (setActive) {
    if (project.is_archived) {
      throw new ProjectValidationError('Archived projects cannot be set as active.');
    }
    await setActiveProject(supabase, user.id, project.id);
  }

  let activeProjectId = await getActiveProjectId(supabase, user.id);
  if (project.is_archived && activeProjectId === project.id) {
    const fallback = await resolveProjectForRequest(supabase, user.id, {
      persistResolvedProject: true,
    });
    activeProjectId = fallback.id;
  }

  return jsonResponse({
    project: toProject(project),
    activeProjectId,
  });
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'POST') return await handlePost(req);
    if (req.method === 'PATCH') return await handlePatch(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof ProjectValidationError) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ProjectPermissionError) {
      return errorResponse(error.message, 403);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process project request',
      500,
    );
  }
});
