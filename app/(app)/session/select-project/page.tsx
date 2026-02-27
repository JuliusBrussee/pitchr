'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Radio } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import { PROJECT_TYPE_OPTIONS } from '@/config/projectTypes';
import type { ProjectTypeId } from '@/types/project';

const WORKFLOW_COPY: Record<
  ProjectTypeId,
  {
    workflowLabel: string;
    judgePackLabel: string;
    promptLabel: string;
  }
> = {
  two_min_pitch: {
    workflowLabel: 'VC Pitch Workflow',
    judgePackLabel: 'VC rubric pack',
    promptLabel: 'Investor fundraising system prompt',
  },
  elevator_pitch: {
    workflowLabel: 'Elevator Workflow',
    judgePackLabel: 'Elevator rubric pack',
    promptLabel: 'Customer + investor clarity system prompt (30s core)',
  },
};

function parseProjectType(value: string | null): ProjectTypeId | null {
  if (value === 'two_min_pitch' || value === 'elevator_pitch') return value;
  return null;
}

export default function SessionProjectSelectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading project selector...</p>
        </main>
      }
    >
      <SessionProjectSelectPageContent />
    </Suspense>
  );
}

function SessionProjectSelectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, activeProjectId, setActiveProject, isLoading, error } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const requestedProjectType = parseProjectType(searchParams.get('projectType'));
  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    if (raw && raw.startsWith('/')) return raw;
    return '/session';
  }, [searchParams]);

  const availableProjects = useMemo(
    () => projects.filter((project) => !project.isArchived),
    [projects],
  );

  useEffect(() => {
    if (availableProjects.length === 0) return;
    if (selectedProjectId && availableProjects.some((project) => project.id === selectedProjectId)) {
      return;
    }

    const preferred =
      (requestedProjectType
        ? availableProjects.find((project) => project.type === requestedProjectType)
        : null)
      ?? availableProjects.find((project) => project.id === activeProjectId)
      ?? availableProjects[0];

    setSelectedProjectId(preferred.id);
  }, [activeProjectId, availableProjects, requestedProjectType, selectedProjectId]);

  const selectedProject = useMemo(
    () => availableProjects.find((project) => project.id === selectedProjectId) ?? null,
    [availableProjects, selectedProjectId],
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
              Select Project
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Pick a project before starting a session. Project selection determines the workflow,
              rubric, and system prompt path used by the judge.
            </p>
          </div>
          {selectedProject ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              <Radio size={14} />
              Workflow: {WORKFLOW_COPY[selectedProject.type].workflowLabel}
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : availableProjects.length === 0 ? (
          <section
            className="rounded-2xl border p-5 text-sm"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-surface-hover)',
            }}
          >
            No active projects are available. Create one in Projects before starting a session.
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProjects.map((project) => {
              const typeOption = PROJECT_TYPE_OPTIONS.find((option) => option.id === project.type);
              const isSelected = selectedProjectId === project.id;
              const workflowCopy = WORKFLOW_COPY[project.type];
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className="rounded-2xl border p-4 text-left flex flex-col gap-3 transition-colors"
                  style={{
                    borderColor: isSelected ? '#ff5941' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(255, 89, 65, 0.08)' : 'var(--bg-surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {project.name}
                      </h2>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {typeOption?.label ?? project.type}
                      </p>
                    </div>
                    {isSelected ? (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                        style={{ color: '#ff5941', backgroundColor: 'rgba(255,89,65,0.12)' }}
                      >
                        <CheckCircle2 size={12} />
                        Selected
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <p>Workflow: {workflowCopy.workflowLabel}</p>
                    <p>Judge: {workflowCopy.judgePackLabel}</p>
                    <p>Prompt: {workflowCopy.promptLabel}</p>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            You can switch projects anytime from the sidebar project selector.
          </p>
          <button
            type="button"
            disabled={!selectedProject || isContinuing}
            onClick={async () => {
              if (!selectedProject) return;
              setIsContinuing(true);
              setSelectionError(null);
              try {
                if (selectedProject.id !== activeProjectId) {
                  await setActiveProject(selectedProject.id);
                }
                router.push(returnTo);
              } catch (caughtError) {
                setSelectionError(
                  caughtError instanceof Error
                    ? caughtError.message
                    : 'Failed to set active project.',
                );
              } finally {
                setIsContinuing(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: '#ff5941',
              color: 'white',
              opacity: !selectedProject || isContinuing ? 0.7 : 1,
            }}
          >
            {isContinuing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Continue to Session
          </button>
        </div>

        {(selectionError || error) ? (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            {selectionError ?? error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
