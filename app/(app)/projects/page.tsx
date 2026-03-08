'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, ArrowUpRight, Clock, Layers } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import { CreateProjectModal } from '@/views/components/CreateProjectModal';
import { EmptyState } from '@/views/components/ui';
import { RocketIllustration } from '@/views/components/ui/empty-state-illustrations';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, activeProjectId, isLoading, error } = useProject();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.15), rgba(255, 170, 51, 0.08))' }}
              >
                <Layers size={14} style={{ color: '#ff5941' }} />
              </div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Projects
              </h1>
              {nonArchivedProjects.length > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--border-color)' }}
                >
                  {nonArchivedProjects.length}
                </span>
              )}
            </div>
            <p className="text-[13px] ml-[38px]" style={{ color: 'var(--text-muted)' }}>
              Each project is a startup or idea you&apos;re pitching.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 12px rgba(255, 89, 65, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Project
          </button>
        </header>

        {/* Divider */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-color) 20%, var(--border-color) 80%, transparent)' }} />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: '#ff5941' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading projects...</span>
            </div>
          </div>
        ) : nonArchivedProjects.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface-hover)' }}
          >
            <EmptyState
              illustration={<RocketIllustration />}
              title="No projects yet"
              description="Create your first project to start analyzing and improving your pitch."
              cta={{ label: 'Create Project', onClick: () => setIsCreateOpen(true), icon: <Plus size={15} /> }}
              showGlow
            />
          </div>
        ) : (
          /* Project grid */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* New project card */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 transition-all duration-300 group"
              style={{
                borderColor: 'rgba(255, 89, 65, 0.15)',
                minHeight: '160px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.35)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 89, 65, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.15)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90"
                style={{ background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.08))' }}
              >
                <Plus size={18} style={{ color: '#ff5941' }} />
              </div>
              <span className="text-xs font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}>
                New Project
              </span>
            </button>

            {/* Project cards */}
            {nonArchivedProjects.map((project) => {
              const isActive = activeProjectId === project.id;
              const isHovered = hoveredId === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isActive
                      ? 'rgba(255, 89, 65, 0.4)'
                      : isHovered
                        ? 'var(--text-muted)'
                        : 'var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: isActive
                      ? '0 0 0 1px rgba(255, 89, 65, 0.15), 0 4px 20px rgba(255, 89, 65, 0.06)'
                      : isHovered
                        ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                        : 'none',
                    minHeight: '160px',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                >
                  {/* Active glow accent */}
                  {isActive && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: 'linear-gradient(90deg, #ff5941, #ffaa33)' }}
                    />
                  )}

                  {/* Content */}
                  <div className="flex items-start justify-between gap-2 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {project.name}
                        </h3>
                      </div>
                      {project.description ? (
                        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {project.description}
                        </p>
                      ) : (
                        <p className="text-[11px] italic" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                          No description
                        </p>
                      )}
                    </div>
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: isHovered ? 'rgba(255, 89, 65, 0.1)' : 'transparent',
                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                      }}
                    >
                      <ArrowUpRight
                        size={14}
                        style={{
                          color: isHovered ? '#ff5941' : 'var(--text-muted)',
                          opacity: isHovered ? 1 : 0.3,
                          transition: 'all 0.3s',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {isActive && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{
                          color: '#ff5941',
                          backgroundColor: 'rgba(255, 89, 65, 0.1)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Active
                      </span>
                    )}
                    <span
                      className="inline-flex items-center gap-1 text-[11px] ml-auto tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Clock size={10} />
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.12)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(projectId) => router.push(`/projects/${projectId}`)}
      />
    </main>
  );
}
