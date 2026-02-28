'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { getEdgeErrorMessage, type EdgeErrorPayload } from '@/lib/supabase/edge-error';
import type { Project, ProjectPromptOverrides, ProjectTypeId } from '@/types/project';

const CACHE_KEY = 'pitchr_active_project';

interface ProjectsResponse {
  projects?: Project[];
  activeProjectId?: string | null;
}

function getCachedActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function setCachedActiveProjectId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) localStorage.setItem(CACHE_KEY, id);
    else localStorage.removeItem(CACHE_KEY);
  } catch { /* ignore */ }
}

async function readEdgePayload<T>(response: Response): Promise<T & EdgeErrorPayload> {
  const payload = await response.json().catch(() => ({}));
  return payload as T & EdgeErrorPayload;
}

interface ProjectContextValue {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setActiveProject: (projectId: string) => Promise<void>;
  createProject: (input: {
    name: string;
    type: ProjectTypeId;
    promptOverrides?: ProjectPromptOverrides;
    setActive?: boolean;
  }) => Promise<Project>;
  updateProject: (input: {
    projectId: string;
    name?: string;
    isArchived?: boolean;
    promptOverrides?: ProjectPromptOverrides;
    setActive?: boolean;
  }) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  activeProjectId: null,
  activeProject: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
  setActiveProject: async () => {},
  createProject: async () => ({
    id: '',
    name: '',
    type: 'two_min_pitch',
    workflowMode: 'vc_pitch',
    isArchived: false,
    isSeeded: false,
    promptOverrides: {},
    createdAt: '',
    updatedAt: '',
  }),
  updateProject: async () => {},
});

async function loadProjectsFromEdge(): Promise<{ projects: Project[]; activeProjectId: string | null }> {
  const response = await fetchEdge('projects');
  const payload = await readEdgePayload<ProjectsResponse>(response);
  if (!response.ok) {
    throw new Error(getEdgeErrorMessage(payload, 'Failed to load projects.'));
  }
  return {
    projects: Array.isArray(payload.projects) ? payload.projects : [],
    activeProjectId: payload.activeProjectId ?? null,
  };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdRaw] = useState<string | null>(() => getCachedActiveProjectId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdRaw(id);
    setCachedActiveProjectId(id);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await loadProjectsFromEdge();
      setProjects(payload.projects);
      setActiveProjectId(payload.activeProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load projects.');
      setProjects([]);
      setActiveProjectId(null);
    } finally {
      setIsLoading(false);
    }
  }, [setActiveProjectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setActiveProject = useCallback(async (projectId: string) => {
    const response = await fetchEdge('projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, setActive: true }),
    });
    const payload = await readEdgePayload<{ activeProjectId?: string | null }>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to set active project.'));
    }
    setActiveProjectId(payload.activeProjectId ?? projectId);
    setError(null);
  }, [setActiveProjectId]);

  const createProject = useCallback(async (input: {
    name: string;
    type: ProjectTypeId;
    promptOverrides?: ProjectPromptOverrides;
    setActive?: boolean;
  }) => {
    const response = await fetchEdge('projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        type: input.type,
        promptOverrides: input.promptOverrides,
        setActive: input.setActive,
      }),
    });
    const payload = await readEdgePayload<{ activeProjectId?: string | null; project?: Project }>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to create project.'));
    }
    await refresh();
    if (payload.activeProjectId) {
      setActiveProjectId(payload.activeProjectId);
    }
    if (!payload.project) {
      throw new Error('Failed to create project.');
    }
    return payload.project;
  }, [refresh, setActiveProjectId]);

  const updateProject = useCallback(async (input: {
    projectId: string;
    name?: string;
    isArchived?: boolean;
    promptOverrides?: ProjectPromptOverrides;
    setActive?: boolean;
  }) => {
    const response = await fetchEdge('projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await readEdgePayload<{ activeProjectId?: string | null }>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to update project.'));
    }
    await refresh();
    if (payload.activeProjectId !== undefined) {
      setActiveProjectId(payload.activeProjectId);
    }
  }, [refresh, setActiveProjectId]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        isLoading,
        error,
        refresh,
        setActiveProject,
        createProject,
        updateProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
