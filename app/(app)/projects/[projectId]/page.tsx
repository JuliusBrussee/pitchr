'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Loader2, MoreHorizontal, Settings2, Zap, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectContextForm } from '@/views/components/ProjectContextForm';
import { ProjectDeckManager } from '@/views/components/ProjectDeckManager';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { projects, activeProjectId, isLoading, updateProject, setActiveProject } = useProject();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const project: Project | null = projects.find((p) => p.id === projectId) ?? null;
  const isActive = activeProjectId === projectId;

  useEffect(() => {
    if (!isLoading && !project) {
      router.replace('/projects');
    }
  }, [isLoading, project, router]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMenuOpen]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: '#ff5941' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading project...</span>
        </div>
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
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/projects"
              className="p-2 rounded-xl transition-all duration-200 no-underline flex-shrink-0 hover:brightness-125"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h1>
                {isActive && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{
                      color: '#ff5941',
                      backgroundColor: 'rgba(255, 89, 65, 0.1)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isActive && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setActiveProject(projectId);
                  } catch { /* ignore */ }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.06))',
                  color: '#ff5941',
                  border: '1px solid rgba(255, 89, 65, 0.2)',
                }}
              >
                <Zap size={12} />
                Set Active
              </button>
            )}

            {/* Overflow menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: isMenuOpen ? 'var(--bg-surface-hover)' : 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  if (!isMenuOpen) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isMenuOpen) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MoreHorizontal size={16} />
              </button>
              {isMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1.5 z-20"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
                  }}
                >
                  {/* Menu header */}
                  <div className="px-3 pb-1.5 mb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Actions
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isArchiving}
                    onClick={async () => {
                      setIsArchiving(true);
                      setIsMenuOpen(false);
                      try {
                        await updateProject({ projectId: project.id, isArchived: true });
                        router.push('/projects');
                      } catch {
                        setIsArchiving(false);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all duration-150 text-left rounded-lg mx-0"
                    style={{ color: '#ef4444' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {isArchiving ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                    <span>Archive project</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-color) 20%, var(--border-color) 80%, transparent)' }} />

        {/* Project Context */}
        <section
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <ProjectContextForm project={project} />
        </section>

        {/* Deck manager */}
        <section
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <ProjectDeckManager projectId={project.id} />
        </section>

        {/* Prompt overrides */}
        <details
          className="rounded-xl border p-5 group/details"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <summary
            className="text-[13px] font-semibold cursor-pointer select-none flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <Settings2 size={12} style={{ color: 'var(--text-muted)' }} />
            </div>
            <span>Advanced: Prompt Overrides</span>
            <svg
              className="ml-auto w-4 h-4 transition-transform duration-200 group-open/details:rotate-180"
              style={{ color: 'var(--text-muted)' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-full rounded-xl border px-4 py-3 text-xs font-mono outline-none resize-none transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.3)'}
              onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </details>
      </div>
    </main>
  );
}
