'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectContextForm } from '@/views/components/ProjectContextForm';
import { ProjectDeckManager } from '@/views/components/ProjectDeckManager';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { projects, isLoading, updateProject } = useProject();
  const [isArchiving, setIsArchiving] = useState(false);

  const project: Project | null = projects.find((p) => p.id === projectId) ?? null;

  useEffect(() => {
    if (!isLoading && !project) {
      router.replace('/projects');
    }
  }, [isLoading, project, router]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </main>
    );
  }

  if (!project) return null;

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
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="p-1.5 rounded-lg transition-colors no-underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={isArchiving}
            onClick={async () => {
              setIsArchiving(true);
              try {
                await updateProject({ projectId: project.id, isArchived: true });
                router.push('/projects');
              } catch {
                setIsArchiving(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
            style={{
              borderColor: 'rgba(239,68,68,0.25)',
              color: '#ef4444',
              opacity: isArchiving ? 0.7 : 1,
            }}
          >
            {isArchiving ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
            Archive
          </button>
        </header>

        {/* Context form */}
        <section
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <ProjectContextForm project={project} />
        </section>

        {/* Deck manager */}
        <section
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <ProjectDeckManager projectId={project.id} />
        </section>

        {/* Prompt overrides (collapsible) */}
        <details
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <summary
            className="text-sm font-semibold cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            Advanced: Prompt Overrides
          </summary>
          <div className="mt-3">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Analysis System Prompt Override
            </label>
            <textarea
              defaultValue={project.promptOverrides?.analysis_system_prompt ?? ''}
              onBlur={(e) => {
                const value = e.target.value.trim();
                const current = project.promptOverrides?.analysis_system_prompt ?? '';
                if (value !== current) {
                  void updateProject({
                    projectId: project.id,
                    promptOverrides: {
                      ...project.promptOverrides,
                      analysis_system_prompt: value || undefined,
                    },
                  });
                }
              }}
              rows={4}
              placeholder="Leave blank to use the default system prompt..."
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono outline-none resize-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </details>
      </div>
    </main>
  );
}
