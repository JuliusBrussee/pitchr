import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';
import { PROJECT_TYPE_CONFIG } from './project-config.ts';
import type { PitchMode, Project, ProjectPromptOverrides, ProjectTypeId } from './types.ts';

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
  }
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  type: ProjectTypeId;
  workflow_mode: PitchMode;
  is_archived: boolean;
  is_seeded: boolean;
  prompt_overrides: ProjectPromptOverrides | null;
  created_at: string;
  updated_at: string;
}

function toProjectResponse(project: ProjectRecord): Project {
  return {
    id: project.id,
    name: project.name,
    type: project.type,
    workflowMode: project.workflow_mode,
    isArchived: project.is_archived,
    isSeeded: project.is_seeded,
    promptOverrides: (project.prompt_overrides ?? {}) as ProjectPromptOverrides,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function sortProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return [...projects].sort((a, b) => {
    if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
    if (a.type !== b.type) {
      if (a.type === 'two_min_pitch') return -1;
      if (b.type === 'two_min_pitch') return 1;
    }
    return a.created_at.localeCompare(b.created_at);
  });
}

export async function listProjectRecords(
  supabase: SupabaseClient,
  userId: string,
  opts?: { includeArchived?: boolean },
): Promise<ProjectRecord[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (!opts?.includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }
  return sortProjects((data ?? []) as ProjectRecord[]);
}

export async function listProjects(
  supabase: SupabaseClient,
  userId: string,
  opts?: { includeArchived?: boolean },
): Promise<Project[]> {
  const projects = await listProjectRecords(supabase, userId, opts);
  return projects.map(toProjectResponse);
}

export async function ensureSeedProjects(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProjectRecord[]> {
  const existing = await listProjectRecords(supabase, userId, { includeArchived: true });
  const seededTypes = new Set(
    existing.filter((project) => project.is_seeded).map((project) => project.type),
  );
  const missingSeedTypes = (Object.keys(PROJECT_TYPE_CONFIG) as ProjectTypeId[]).filter(
    (type) => !seededTypes.has(type),
  );

  if (missingSeedTypes.length > 0) {
    const inserts = missingSeedTypes.map((type) => {
      const config = PROJECT_TYPE_CONFIG[type];
      return {
        user_id: userId,
        name: config.seedName,
        type: config.id,
        workflow_mode: config.workflowMode,
        is_seeded: true,
        is_archived: false,
        prompt_overrides: {},
      };
    });

    const { error } = await supabase.from('projects').insert(inserts);
    if (error) {
      throw new Error(`Failed to seed projects: ${error.message}`);
    }
  }

  return listProjectRecords(supabase, userId, { includeArchived: true });
}

export async function getProjectById(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<ProjectRecord> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
  if (!data) {
    throw new ProjectNotFoundError(projectId);
  }
  return data as ProjectRecord;
}

export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  input: {
    name: string;
    type: ProjectTypeId;
    promptOverrides?: ProjectPromptOverrides;
  },
): Promise<ProjectRecord> {
  const config = PROJECT_TYPE_CONFIG[input.type];
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      type: config.id,
      workflow_mode: config.workflowMode,
      is_seeded: false,
      is_archived: false,
      prompt_overrides: input.promptOverrides ?? {},
    })
    .select('*')
    .single();
  if (error || !data) {
    throw new Error(`Failed to create project: ${error?.message ?? 'unknown error'}`);
  }
  return data as ProjectRecord;
}

export async function updateProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  updates: {
    name?: string;
    isArchived?: boolean;
    promptOverrides?: ProjectPromptOverrides;
  },
): Promise<ProjectRecord> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;
  if (updates.promptOverrides !== undefined) payload.prompt_overrides = updates.promptOverrides;
  if (Object.keys(payload).length === 0) {
    return getProjectById(supabase, userId, projectId);
  }

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
  if (!data) {
    throw new ProjectNotFoundError(projectId);
  }
  return data as ProjectRecord;
}

export async function getActiveProjectId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('active_project_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load active project from settings: ${error.message}`);
  }
  return (data?.active_project_id as string | null | undefined) ?? null;
}

export async function setActiveProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        user_id: userId,
        active_project_id: projectId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (error) {
    throw new Error(`Failed to set active project: ${error.message}`);
  }
}

function findModeCompatibleProject(projects: ProjectRecord[], mode: PitchMode): ProjectRecord | null {
  const nonArchived = projects.filter((project) => !project.is_archived);
  return (
    nonArchived.find((project) => project.workflow_mode === mode && project.is_seeded) ??
    nonArchived.find((project) => project.workflow_mode === mode) ??
    null
  );
}

function findDefaultProject(projects: ProjectRecord[]): ProjectRecord | null {
  const nonArchived = projects.filter((project) => !project.is_archived);
  return (
    nonArchived.find((project) => project.type === 'two_min_pitch') ??
    nonArchived[0] ??
    projects[0] ??
    null
  );
}

export async function resolveProjectForRequest(
  supabase: SupabaseClient,
  userId: string,
  opts?: {
    projectId?: string;
    mode?: PitchMode;
    persistResolvedProject?: boolean;
  },
): Promise<ProjectRecord> {
  const persistResolvedProject = opts?.persistResolvedProject === true;
  const projects = await ensureSeedProjects(supabase, userId);

  if (opts?.projectId) {
    const project = projects.find((item) => item.id === opts.projectId);
    if (!project) {
      throw new ProjectNotFoundError(opts.projectId);
    }
    if (persistResolvedProject && !project.is_archived) {
      await setActiveProject(supabase, userId, project.id);
    }
    return project;
  }

  const activeProjectId = await getActiveProjectId(supabase, userId);
  const activeProject = activeProjectId
    ? projects.find((project) => project.id === activeProjectId && !project.is_archived) ?? null
    : null;

  const resolved =
    (opts?.mode
      ? activeProject?.workflow_mode === opts.mode
        ? activeProject
        : findModeCompatibleProject(projects, opts.mode)
      : activeProject) ?? findDefaultProject(projects);

  if (!resolved) {
    throw new Error('No project available for this account.');
  }

  if (persistResolvedProject && activeProjectId !== resolved.id && !resolved.is_archived) {
    await setActiveProject(supabase, userId, resolved.id);
  }

  return resolved;
}

export function toProject(project: ProjectRecord): Project {
  return toProjectResponse(project);
}
