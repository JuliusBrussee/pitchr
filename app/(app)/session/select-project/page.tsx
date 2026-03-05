'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Zap, BarChart3 } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import { PITCH_MODE_OPTIONS } from '@/config/pitchModes';
import type { PitchMode } from '@/types/pitch';

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

const MODE_ICONS = {
  'zap': Zap,
  'bar-chart': BarChart3,
} as const;

function SessionProjectSelectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, activeProjectId, setActiveProject, isLoading, error } = useProject();
  const [step, setStep] = useState<'project' | 'mode'>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<PitchMode | null>(null);
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

  const handleContinueToMode = () => {
    if (!selectedProject) return;
    setStep('mode');
  };

  const handleStart = async () => {
    if (!selectedProject || !selectedMode) return;
    setIsContinuing(true);
    setSelectionError(null);
    try {
      if (selectedProject.id !== activeProjectId) {
        await setActiveProject(selectedProject.id);
      }
      const target = returnTo === '/session' ? `/session?mode=${selectedMode}` : returnTo;
      router.push(target);
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
            {step === 'project' ? 'Select Project' : 'Select Pitch Mode'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {step === 'project'
              ? 'Pick the project you want to pitch.'
              : `Pitching "${selectedProject?.name}". Choose your format.`}
          </p>
        </header>

        {step === 'project' ? (
          <>
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
                disabled={!selectedProject}
                onClick={handleContinueToMode}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: '#ff5941',
                  color: 'white',
                  opacity: !selectedProject ? 0.7 : 1,
                }}
              >
                Next: Choose Mode
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Mode selection */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PITCH_MODE_OPTIONS.map((option) => {
                const isSelected = selectedMode === option.key;
                const Icon = MODE_ICONS[option.icon];
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedMode(option.key)}
                    className="rounded-2xl border p-5 text-left flex flex-col gap-3 transition-colors hover:scale-[1.02]"
                    style={{
                      borderColor: isSelected ? option.color : 'var(--border-color)',
                      backgroundColor: isSelected ? `${option.color}08` : 'var(--bg-surface)',
                    }}
                  >
                    <Icon
                      size={24}
                      style={{ color: isSelected ? option.color : 'var(--text-muted)' }}
                    />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {option.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {option.description}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {option.targetDurationLabel}
                    </span>
                  </button>
                );
              })}
            </section>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('project')}
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!selectedMode || isContinuing}
                onClick={() => void handleStart()}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: '#ff5941',
                  color: 'white',
                  opacity: !selectedMode || isContinuing ? 0.7 : 1,
                }}
              >
                {isContinuing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Start Session
              </button>
            </div>
          </>
        )}

        {(selectionError || error) ? (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            {selectionError ?? error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
