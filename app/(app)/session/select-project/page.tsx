'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';

export default function SessionProjectSelectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
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

  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    if (raw && raw.startsWith('/')) return raw;
    return '/session';
  }, [searchParams]);

  const availableProjects = useMemo(
    () => projects.filter((project) => !project.isArchived),
    [projects],
  );

  // Pre-select current active project
  useEffect(() => {
    if (availableProjects.length === 0) return;
    if (selectedProjectId && availableProjects.some((p) => p.id === selectedProjectId)) return;
    const preferred = availableProjects.find((p) => p.id === activeProjectId) ?? availableProjects[0];
    setSelectedProjectId(preferred.id);
  }, [activeProjectId, availableProjects, selectedProjectId]);

  const selectedProject = useMemo(
    () => availableProjects.find((p) => p.id === selectedProjectId) ?? null,
    [availableProjects, selectedProjectId],
  );

  const handleStart = async () => {
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
        caughtError instanceof Error ? caughtError.message : 'Failed to set active project.',
      );
    } finally {
      setIsContinuing(false);
    }
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
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Select Project
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pick the project you want to pitch.
          </p>
        </header>

        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading projects...</div>
        ) : availableProjects.length === 0 ? (
          <section
            className="rounded-2xl border p-5 text-sm"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-surface-hover)',
            }}
          >
            <p>No projects yet. Create one to start pitching.</p>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-3 py-1.5 mt-3 rounded-lg border text-xs no-underline"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              Go to Projects
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProjects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className="rounded-2xl border p-4 text-left flex flex-col gap-2 transition-colors"
                  style={{
                    borderColor: isSelected ? '#ff5941' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(255, 89, 65, 0.08)' : 'var(--bg-surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {project.description}
                        </p>
                      )}
                    </div>
                    {isSelected ? (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0"
                        style={{ color: '#ff5941', backgroundColor: 'rgba(255,89,65,0.12)' }}
                      >
                        <CheckCircle2 size={12} />
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </section>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={!selectedProject || isContinuing}
            onClick={() => void handleStart()}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: '#ff5941',
              color: 'white',
              opacity: !selectedProject || isContinuing ? 0.7 : 1,
            }}
          >
            {isContinuing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Start Session
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
