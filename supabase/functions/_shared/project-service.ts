import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';
import type { PitchMode, Project, ProjectPromptOverrides } from './types.ts';

export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
  }
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_market: string | null;
  key_metrics: string | null;
  extra_notes: string | null;
  type: string | null;
  workflow_mode: string | null;
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
    description: project.description ?? null,
    targetMarket: project.target_market ?? null,
    keyMetrics: project.key_metrics ?? null,
    extraNotes: project.extra_notes ?? null,
    isArchived: project.is_archived,
    defaultMode: (project.workflow_mode as PitchMode) ?? null,
    promptOverrides: (project.prompt_overrides ?? {}) as ProjectPromptOverrides,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function sortProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return [...projects].sort((a, b) => {
    if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
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
    description?: string;
    targetMarket?: string;
    keyMetrics?: string;
    extraNotes?: string;
    workflowMode?: PitchMode;
    promptOverrides?: ProjectPromptOverrides;
  },
): Promise<ProjectRecord> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      target_market: input.targetMarket?.trim() || null,
      key_metrics: input.keyMetrics?.trim() || null,
      extra_notes: input.extraNotes?.trim() || null,
      workflow_mode: input.workflowMode ?? 'vc_pitch',
      type: 'two_min_pitch',
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
    description?: string | null;
    targetMarket?: string | null;
    keyMetrics?: string | null;
    extraNotes?: string | null;
    isArchived?: boolean;
    workflowMode?: PitchMode;
    promptOverrides?: ProjectPromptOverrides;
  },
): Promise<ProjectRecord> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.targetMarket !== undefined) payload.target_market = updates.targetMarket?.trim() || null;
  if (updates.keyMetrics !== undefined) payload.key_metrics = updates.keyMetrics?.trim() || null;
  if (updates.extraNotes !== undefined) payload.extra_notes = updates.extraNotes?.trim() || null;
  if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;
  if (updates.workflowMode !== undefined) payload.workflow_mode = updates.workflowMode;
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

export async function resolveProjectForRequest(
  supabase: SupabaseClient,
  userId: string,
  opts?: {
    projectId?: string;
    persistResolvedProject?: boolean;
  },
): Promise<ProjectRecord> {
  const persistResolvedProject = opts?.persistResolvedProject === true;
  const projects = await listProjectRecords(supabase, userId, { includeArchived: true });

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

  const resolved = activeProject ?? findDefaultProject(projects);

  if (!resolved) {
    throw new Error('No project available for this account.');
  }

  if (persistResolvedProject && activeProjectId !== resolved.id && !resolved.is_archived) {
    await setActiveProject(supabase, userId, resolved.id);
  }

  return resolved;
}

function findDefaultProject(projects: ProjectRecord[]): ProjectRecord | null {
  const nonArchived = projects.filter((project) => !project.is_archived);
  return nonArchived[0] ?? projects[0] ?? null;
}

export function toProject(project: ProjectRecord): Project {
  return toProjectResponse(project);
}
