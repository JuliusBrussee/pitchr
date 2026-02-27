'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FolderPlus, Loader2 } from 'lucide-react';
import { PROJECT_TYPE_OPTIONS } from '@/config/projectTypes';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import type { ProjectTypeId } from '@/types/project';

export default function ProjectsPage() {
  const {
    projects,
    activeProjectId,
    isLoading,
    error,
    setActiveProject,
    createProject,
    updateProject,
  } = useProject();
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectTypeId>('two_min_pitch');
  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Projects
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Isolate runs, decks, and analytics by pitch workflow.
            </p>
          </div>
          {activeProject ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              <CheckCircle2 size={14} />
              Active: {activeProject.name}
            </div>
          ) : null}
        </header>

        <section
          className="rounded-2xl border p-4"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FolderPlus size={16} style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Create project
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <ProjectSelect
              ariaLabel="Project type"
              value={type}
              onChange={(nextValue) => setType(nextValue as ProjectTypeId)}
              options={PROJECT_TYPE_OPTIONS.map((option) => ({
                value: option.id,
                label: option.label,
                description: option.description,
              }))}
            />
            <button
              type="button"
              disabled={isCreating || name.trim().length === 0}
              onClick={async () => {
                setIsCreating(true);
                setMutationError(null);
                try {
                  await createProject({
                    name: name.trim(),
                    type,
                    setActive: true,
                  });
                  setName('');
                } catch (caughtError) {
                  setMutationError(
                    caughtError instanceof Error ? caughtError.message : 'Failed to create project.',
                  );
                } finally {
                  setIsCreating(false);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: '#ff5941',
                color: 'white',
                opacity: isCreating || name.trim().length === 0 ? 0.7 : 1,
              }}
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
              Create
            </button>
          </div>
          {mutationError ? (
            <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
              {mutationError}
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No projects found.
            </div>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border p-4 flex flex-col gap-3"
                style={{
                  borderColor: activeProjectId === project.id ? '#ff5941' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {PROJECT_TYPE_OPTIONS.find((option) => option.id === project.type)?.label}
                    </p>
                  </div>
                  {activeProjectId === project.id ? (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: '#ff5941', backgroundColor: 'rgba(255,89,65,0.12)' }}
                    >
                      Active
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeProjectId === project.id}
                    onClick={() => void setActiveProject(project.id)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Set active
                  </button>
                  {!project.isSeeded ? (
                    <button
                      type="button"
                      onClick={() => void updateProject({ projectId: project.id, isArchived: true })}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                      style={{
                        borderColor: 'rgba(239,68,68,0.25)',
                        color: '#ef4444',
                      }}
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>

        {error ? (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
