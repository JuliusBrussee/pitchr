'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, Loader2, ArrowRight } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';

export default function ProjectsPage() {
  const router = useRouter();
  const {
    projects,
    activeProjectId,
    isLoading,
    error,
    createProject,
  } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const nonArchivedProjects = projects.filter((p) => !p.isArchived);

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
        <header>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Each project represents a startup or idea you&apos;re pitching.
          </p>
        </header>

        {/* Create project form */}
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
              New Project
            </h2>
          </div>
          <div className="flex flex-col gap-3">
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
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="One-line description (optional)"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              disabled={isCreating || name.trim().length === 0}
              onClick={async () => {
                setIsCreating(true);
                setMutationError(null);
                try {
                  const created = await createProject({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    setActive: true,
                  });
                  setName('');
                  setDescription('');
                  router.push(`/projects/${created.id}`);
                } catch (caughtError) {
                  setMutationError(
                    caughtError instanceof Error ? caughtError.message : 'Failed to create project.',
                  );
                } finally {
                  setIsCreating(false);
                }
              }}
              className="self-start inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
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
          {mutationError ? (
            <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
              {mutationError}
            </p>
          ) : null}
        </section>

        {/* Project cards */}
        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : nonArchivedProjects.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-surface-hover)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Create your first project to start pitching.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonArchivedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="rounded-2xl border p-4 text-left flex flex-col gap-2 transition-colors hover:scale-[1.01]"
                style={{
                  borderColor: activeProjectId === project.id ? '#ff5941' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {project.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                </div>
                {activeProjectId === project.id ? (
                  <span
                    className="self-start text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: '#ff5941', backgroundColor: 'rgba(255,89,65,0.12)' }}
                  >
                    Active
                  </span>
                ) : null}
              </button>
            ))}
          </section>
        )}

        {error ? (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
