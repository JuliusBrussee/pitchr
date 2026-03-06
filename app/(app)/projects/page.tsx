'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FolderPlus, Loader2 } from 'lucide-react';
import { PROJECT_TYPE_OPTIONS } from '@/config/projectTypes';
import {
  RUBRIC_CONTEXT_MAX_CHARS,
  validateRubricContextForSave,
} from '@/supabase/functions/_shared/rubric-context';
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
  const [isSwitchingCreated, setIsSwitchingCreated] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<{ projectId: string; projectName: string } | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [rubricDraftByProjectId, setRubricDraftByProjectId] = useState<Record<string, string>>({});

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const maxCharactersText = RUBRIC_CONTEXT_MAX_CHARS.toLocaleString('en-US');

  const getSavedRubricContext = (projectId: string) => {
    const project = projects.find((entry) => entry.id === projectId);
    const value = project?.promptOverrides?.analysis_system_prompt;
    return typeof value === 'string' ? value : '';
  };

  const getDraftRubricContext = (projectId: string) =>
    rubricDraftByProjectId[projectId] ?? getSavedRubricContext(projectId);

  const openRubricEditor = (projectId: string) => {
    setOpenProjectId(projectId);
    setRubricDraftByProjectId((current) => {
      if (projectId in current) return current;
      return {
        ...current,
        [projectId]: getSavedRubricContext(projectId),
      };
    });
  };

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
              Current: {activeProject.name}
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
                setCreateSuccess(null);
                try {
                  const createdProject = await createProject({
                    name: name.trim(),
                    type,
                  });
                  setName('');
                  setCreateSuccess({
                    projectId: createdProject.id,
                    projectName: createdProject.name,
                  });
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
              Create project
            </button>
          </div>
          {createSuccess ? (
            <div
              className="mt-3 rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-3 flex-wrap"
              style={{
                borderColor: 'rgba(34,197,94,0.25)',
                backgroundColor: 'rgba(34,197,94,0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>
                Created <strong>{createSuccess.projectName}</strong>.
              </span>
              {createSuccess.projectId !== activeProjectId ? (
                <button
                  type="button"
                  disabled={isSwitchingCreated}
                  onClick={async () => {
                    setIsSwitchingCreated(true);
                    setMutationError(null);
                    try {
                      await setActiveProject(createSuccess.projectId);
                      setCreateSuccess(null);
                    } catch (caughtError) {
                      setMutationError(
                        caughtError instanceof Error
                          ? caughtError.message
                          : 'Failed to switch project.',
                      );
                    } finally {
                      setIsSwitchingCreated(false);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg px-2.5 py-1 border text-xs font-medium"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-surface)',
                    opacity: isSwitchingCreated ? 0.7 : 1,
                  }}
                >
                  {isSwitchingCreated ? 'Switching...' : 'Switch now'}
                </button>
              ) : null}
            </div>
          ) : null}
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
                      Current
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
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
                <section
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-surface-hover)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        Rubric & Context
                      </h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Add project-specific instructions for analysis feedback.
                      </p>
                    </div>
                    {openProjectId === project.id ? (
                      <button
                        type="button"
                        onClick={() => setOpenProjectId(null)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRubricEditor(project.id)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                        style={{
                          borderColor: 'rgba(255,89,65,0.35)',
                          color: '#ff5941',
                          backgroundColor: 'rgba(255,89,65,0.08)',
                        }}
                      >
                        Edit Rubric & Context
                      </button>
                    )}
                  </div>

                  {openProjectId === project.id ? (
                    (() => {
                      const draftValue = getDraftRubricContext(project.id);
                      const validationResult = validateRubricContextForSave(draftValue);
                      const validationMessage = validationResult.valid ? null : validationResult.error;
                      const currentCharactersText = draftValue.length.toLocaleString('en-US');

                      return (
                        <div
                          data-testid={`rubric-context-editor-shell-${project.id}`}
                          className="fixed inset-0 z-40 flex items-stretch bg-black/50 p-4 md:static md:z-auto md:bg-transparent md:p-0 mt-3"
                        >
                          <div
                            className="w-full h-full rounded-2xl border p-4 flex flex-col gap-3 md:h-auto md:rounded-xl"
                            style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                Rubric & Context
                              </p>
                              <button
                                type="button"
                                onClick={() => setOpenProjectId(null)}
                                className="inline-flex md:hidden items-center justify-center rounded-lg px-2.5 py-1 border text-xs font-medium"
                                style={{
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                Done
                              </button>
                            </div>
                            <textarea
                              aria-label={`Rubric & Context editor for ${project.name}`}
                              value={draftValue}
                              maxLength={RUBRIC_CONTEXT_MAX_CHARS}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setRubricDraftByProjectId((current) => ({
                                  ...current,
                                  [project.id]: nextValue,
                                }));
                              }}
                              className="min-h-[220px] md:min-h-[160px] rounded-lg border px-3 py-2 text-sm resize-y"
                              style={{
                                borderColor: validationMessage ? '#ef4444' : 'var(--border-color)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                              }}
                            />
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <p
                                className="text-xs"
                                style={{ color: validationMessage ? '#ef4444' : 'var(--text-muted)' }}
                              >
                                {currentCharactersText}/{maxCharactersText}
                              </p>
                              <button
                                type="button"
                                disabled={!validationResult.valid}
                                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: '#ff5941',
                                  color: 'white',
                                  opacity: validationResult.valid ? 1 : 0.6,
                                }}
                              >
                                Save
                              </button>
                            </div>
                            {validationMessage ? (
                              <p className="text-xs" style={{ color: '#ef4444' }}>
                                {validationMessage}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </section>
              </article>
            ))
          )}
        </section>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Switch projects from the sidebar `Current project` picker.
        </p>

        {error ? (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
