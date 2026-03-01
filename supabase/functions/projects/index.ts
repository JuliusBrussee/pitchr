// Edge Function: projects
// Methods:
//   GET    /projects?includeArchived=true|false
//   POST   /projects
//   PATCH  /projects

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isProjectTypeId, PROJECT_TYPE_CONFIG } from '../_shared/project-config.ts';
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
import { getAnalysisPromptProfile } from '../_shared/analysis-profiles.ts';

class ProjectValidationError extends Error {}

function generateProjectPrompt(
  profile: ReturnType<typeof getAnalysisPromptProfile>,
  contextNotes: string,
  criteria: string[],
): string {
  const parts = [profile.systemPrompt];

  if (contextNotes) {
    parts.push('', 'Project context notes:', contextNotes);
  }

  if (criteria.length > 0) {
    parts.push(
      '',
      'Perfect pitch criteria for this project:',
      ...criteria.map((c, i) => `${i + 1}. ${c}`),
    );
  }

  parts.push(
    '',
    `Scoring profile: ${profile.modeConfig.label}`,
    `Target duration: ${profile.modeConfig.targetDurationSeconds}s, target WPM: ${profile.modeConfig.targetWpm}`,
  );

  return parts.join('\n');
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

  // Handle prompt reset action
  if (body.action === 'reset_prompt') {
    const profile = getAnalysisPromptProfile(project.type, project.workflow_mode);
    const contextNotes = typeof body.project_context_notes === 'string'
      ? body.project_context_notes.trim()
      : (project.prompt_overrides?.project_context_notes as string | undefined) ?? '';
    const criteria = Array.isArray(body.perfect_pitch_criteria)
      ? body.perfect_pitch_criteria.filter((c: unknown) => typeof c === 'string' && c.trim())
      : (project.prompt_overrides?.perfect_pitch_criteria as string[] | undefined) ?? [];

    const generatedPrompt = generateProjectPrompt(profile, contextNotes, criteria);
    const newOverrides = {
      ...(project.prompt_overrides ?? {}),
      analysis_system_prompt: generatedPrompt,
      analysis_prompt_mode: 'auto' as const,
      analysis_prompt_template_version: 'v1',
      analysis_prompt_generated_at: new Date().toISOString(),
      project_context_notes: contextNotes || undefined,
      perfect_pitch_criteria: criteria.length > 0 ? criteria : undefined,
    };

    project = await updateProject(supabase, user.id, projectId, {
      promptOverrides: newOverrides,
    });
  } else {
    // Standard update
    const promptOverrides =
      body.promptOverrides && typeof body.promptOverrides === 'object'
        ? body.promptOverrides as Record<string, unknown>
        : undefined;

    // If custom prompt is provided, mark as custom mode
    if (promptOverrides?.analysis_system_prompt && typeof promptOverrides.analysis_system_prompt === 'string') {
      promptOverrides.analysis_prompt_mode = 'custom';
    }

    project = await updateProject(supabase, user.id, projectId, {
      name: typeof body.name === 'string' ? body.name : undefined,
      isArchived: typeof body.isArchived === 'boolean' ? body.isArchived : undefined,
      promptOverrides,
    });
  }

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
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process project request',
      500,
    );
  }
});
