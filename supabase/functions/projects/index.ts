// Edge Function: projects
// Methods:
//   GET    /projects?includeArchived=true|false
//   POST   /projects
//   PATCH  /projects

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isProjectTypeId } from '../_shared/project-config.ts';
import {
  createProject,
  ensureSeedProjects,
  getActiveProjectId,
  getProjectById,
  listProjectRecords,
  ProjectNotFoundError,
  resolveProjectForRequest,
  setActiveProject,
  toProject,
  updateProject,
} from '../_shared/project-service.ts';

class ProjectValidationError extends Error {}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

async function handleGet(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const includeArchived = url.searchParams.get('includeArchived') === 'true';

  await ensureSeedProjects(supabase, user.id);
  const projects = await listProjectRecords(supabase, user.id, { includeArchived: true });
  let activeProjectId = await getActiveProjectId(supabase, user.id);
  const activeExists = activeProjectId && projects.some((project) => project.id === activeProjectId);
  if (!activeExists) {
    const fallback = await resolveProjectForRequest(supabase, user.id);
    activeProjectId = fallback.id;
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
  const setActive = body.setActive !== false;
  if (!name) {
    throw new ProjectValidationError('name is required.');
  }
  if (!isProjectTypeId(type)) {
    throw new ProjectValidationError('type must be one of: two_min_pitch, elevator_pitch.');
  }
  const promptOverrides =
    body.promptOverrides && typeof body.promptOverrides === 'object'
      ? body.promptOverrides as Record<string, unknown>
      : undefined;

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

  let project = await getProjectById(supabase, user.id, projectId);
  project = await updateProject(supabase, user.id, projectId, {
    name: typeof body.name === 'string' ? body.name : undefined,
    isArchived: typeof body.isArchived === 'boolean' ? body.isArchived : undefined,
    promptOverrides:
      body.promptOverrides && typeof body.promptOverrides === 'object'
        ? body.promptOverrides as Record<string, unknown>
        : undefined,
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
    const fallback = await resolveProjectForRequest(supabase, user.id);
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
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process project request',
      500,
    );
  }
});
