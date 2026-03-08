'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  Play,
  Calendar,
  Grid,
  List,
  Trash2,
  Mic,
  FileText,
  Upload,
} from 'lucide-react';
import {
  ConfirmDialog,
  GlassCard,
  ScoreBadge,
  TagPill,
  SectionHeader,
  SearchInput,
  EmptyState,
  SkeletonListRow,
  useDelayedLoading,
  getModeColor,
  getModeBgColor,
  getModeLabel,
} from '@/views/components/ui';
import { TimelineIllustration } from '@/views/components/ui/empty-state-illustrations';
import type { PitchMode } from '@/views/components/ui';
import { RecordingPlayer } from '@/views/components/RecordingPlayer';
import { RunDetailModal } from '@/views/components/RunDetailModal';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useTutorial } from '@/hooks/useTutorial';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import { useProject } from '@/views/components/ProjectProvider';
import { normalizeRuns as normalizeSharedRuns } from '@/lib/runNormalization';

/* ——— Types ——— */

interface HistoryRun {
  id: string;
  number: number;
  mode: PitchMode;
  inputType: 'audio' | 'text' | 'upload';
  overallScore: number;
  one_line_verdict: string;
  createdAt: string;
  duration_seconds: number;
  audioUrl?: string;
  projectName?: string;
  deck?: string;
  dateGroup: 'today' | 'yesterday' | 'thisWeek' | 'earlier';
}

/* ——— Helpers ——— */

function getDateGroup(iso: string): 'today' | 'yesterday' | 'thisWeek' | 'earlier' {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  if (date >= weekAgo) return 'thisWeek';
  return 'earlier';
}

/* ——— Constants ——— */

const DATE_GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  earlier: 'Earlier',
};

const DATE_GROUP_ORDER = ['today', 'yesterday', 'thisWeek', 'earlier'];

type ViewMode = 'list' | 'grid';
type ModeFilter = 'all' | 'elevator' | 'vc_pitch';

/* ——— Helpers ——— */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ——— Component ——— */

export default function HistoryPage() {
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const { activeProjectId } = useProject();
  const [visibleCount, setVisibleCount] = useState(8);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteRun, setConfirmDeleteRun] = useState<{ id: string; number: number } | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const { showTooltip } = useSmartTooltip();
  const { registerPage } = useTutorial('history');
  const runListRef = useRef<HTMLDivElement | null>(null);
  const loadRequestIdRef = useRef(0);
  const showSkeleton = useDelayedLoading(loading);
  const showTooltipRef = useRef(showTooltip);
  showTooltipRef.current = showTooltip;

  const loadRuns = useCallback(() => {
    const requestId = ++loadRequestIdRef.current;
    setFetchError(false);
    if (!activeProjectId) {
      setRuns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEdge('pitch-run', {
      params: { projectId: activeProjectId },
    })
      .then((res) => res.json())
      .then((payload: { runs?: unknown }) => {
        if (requestId !== loadRequestIdRef.current) return;
        const records = normalizeSharedRuns(payload.runs);
        const mapped = records.map((r, i) => ({
          id: r.id,
          number: records.length - i,
          mode: r.mode as PitchMode,
          inputType: r.inputType as 'audio' | 'text' | 'upload',
          overallScore: r.overallScore,
          one_line_verdict: r.analysis.one_line_verdict || 'No verdict available.',
          createdAt: r.createdAt,
          duration_seconds: r.analysis.delivery_metrics.duration_seconds,
          audioUrl: r.audioUrl,
          projectName: r.projectName,
          deck: undefined,
          dateGroup: getDateGroup(r.createdAt),
        }));
        setRuns(mapped);
      })
      .catch(() => {
        if (requestId !== loadRequestIdRef.current) return;
        setRuns([]);
        setFetchError(true);
        if (runListRef.current) {
          showTooltipRef.current(runListRef.current, 'error', 'Failed to load pitch history. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false);
        }
      });
  }, [activeProjectId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    registerPage('history');
  }, [registerPage]);

  /* Filtering */
  const filtered = runs.filter((run) => {
    // Mode filter
    if (modeFilter !== 'all' && run.mode !== modeFilter) return false;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        run.one_line_verdict.toLowerCase().includes(q) ||
        (run.deck ?? '').toLowerCase().includes(q) ||
        getModeLabel(run.mode).toLowerCase().includes(q) ||
        `pitch #${run.number}`.includes(q);
      if (!matchesText) return false;
    }
    return true;
  });

  const visibleRuns = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  /* Group visible runs by date */
  const groupedVisible = DATE_GROUP_ORDER.reduce<Record<string, HistoryRun[]>>((acc, group) => {
    const items = visibleRuns.filter((r) => r.dateGroup === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  /* Perform delete (called from ConfirmDialog onConfirm) */
  const performDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await fetchEdge('pitch-run-detail', { method: 'DELETE', params: { runId: id } });
      setRuns((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteRun(null);
    } finally {
      setDeletingId(null);
    }
  }, []);

  /* Running index for stagger animations */
  let animIndex = 0;

  const modeFilters: { value: ModeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'elevator', label: 'Elevator' },
    { value: 'vc_pitch', label: 'VC Pitch' },
  ];

  return (
    <main className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
      {/* ——— Header Card ——— */}
      <GlassCard className="flex-shrink-0 flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(139,92,246,0.12)' }}
            >
              <Clock size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                History
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {filtered.length} run{filtered.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
          {/* Upload link */}
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-150 no-underline"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            <Upload size={14} />
            Upload
          </Link>

          {/* View toggle */}
          <div
            data-tour="tour-history-view"
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {(['list', 'grid'] as ViewMode[]).map((mode) => {
              const Icon = mode === 'list' ? List : Grid;
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="p-2 transition-colors duration-150"
                  style={{
                    backgroundColor: active ? 'var(--bg-surface-hover)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                  aria-label={`${mode} view`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* Search + Mode filter row */}
        <div data-tour="tour-history-search" className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search pitches, decks, verdicts..."
            className="flex-1"
          />

          {/* Mode filter pills */}
          <div
            className="flex rounded-lg border overflow-hidden flex-shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {modeFilters.map((filter) => {
              const active = modeFilter === filter.value;
              let pillColor = 'var(--text-muted)';
              let pillBg = 'transparent';
              if (active) {
                if (filter.value === 'elevator') {
                  pillColor = '#f97316';
                  pillBg = 'rgba(249,115,22,0.12)';
                } else if (filter.value === 'vc_pitch') {
                  pillColor = '#ff5941';
                  pillBg = 'rgba(255,89,65,0.12)';
                } else {
                  pillColor = 'var(--text-primary)';
                  pillBg = 'var(--bg-surface-hover)';
                }
              }
              return (
                <button
                  key={filter.value}
                  onClick={() => setModeFilter(filter.value)}
                  className="px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: pillBg,
                    color: pillColor,
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* ——— Session List / Grid ——— */}
      <GlassCard ref={runListRef} data-tour="tour-history-runs" className="flex-1 overflow-y-auto" animate={false}>
        {loading ? (
          showSkeleton ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonListRow key={i} />
              ))}
            </div>
          ) : null
        ) : Object.keys(groupedVisible).length === 0 ? (
          <EmptyState
            illustration={
              !fetchError && !(searchQuery || modeFilter !== 'all')
                ? <TimelineIllustration />
                : undefined
            }
            icon={
              fetchError || searchQuery || modeFilter !== 'all'
                ? <Clock size={32} style={{ color: 'var(--text-muted)' }} />
                : undefined
            }
            title={
              fetchError
                ? 'Failed to load pitch history'
                : searchQuery || modeFilter !== 'all'
                  ? 'No matching runs'
                  : 'No pitch history yet'
            }
            description={
              fetchError
                ? 'Check your connection and try again.'
                : searchQuery || modeFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Run your first pitch session to start building your history.'
            }
            cta={
              !fetchError && !(searchQuery || modeFilter !== 'all')
                ? { label: 'Start First Session', href: '/session', icon: <Play size={15} /> }
                : undefined
            }
            secondaryAction={fetchError ? { label: 'Try Again', onClick: loadRuns } : undefined}
            variant={fetchError ? 'error' : searchQuery || modeFilter !== 'all' ? 'filtered' : 'default'}
            showGlow={!fetchError && !(searchQuery || modeFilter !== 'all')}
          />
        ) : viewMode === 'list' ? (
          /* ——— List View ——— */
          <div className="flex flex-col gap-5">
            {DATE_GROUP_ORDER.map((group) => {
              const runs = groupedVisible[group];
              if (!runs) return null;
              return (
                <div key={group} className="flex flex-col gap-1.5">
                  {/* Group divider */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <SectionHeader icon={<Calendar size={12} />}>
                      {DATE_GROUP_LABELS[group]}
                    </SectionHeader>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  </div>

                  {/* Run rows */}
                  {runs.map((run) => {
                    const idx = animIndex++;
                    const isDeleting = deletingId === run.id;
                    return (
                      <div
                        key={run.id}
                        className={`group flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer animate-fade-in-up ${
                          isDeleting ? 'opacity-40 scale-95' : ''
                        }`}
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: 'var(--border-color)',
                          animationDelay: `${idx * 50}ms`,
                          animationFillMode: 'both',
                        }}
                        onClick={() => setSelectedRunId(run.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Play icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                        >
                          <Play size={14} style={{ color: 'var(--text-secondary)' }} fill="currentColor" />
                        </div>

                        {/* Session info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                              Pitch #{run.number}
                            </span>
                            <TagPill
                              label={getModeLabel(run.mode)}
                              color={getModeColor(run.mode)}
                              bgColor={getModeBgColor(run.mode)}
                            />
                            {run.inputType === 'upload' ? (
                              <Upload size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            ) : run.inputType === 'audio' ? (
                              <Mic size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            ) : (
                              <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            )}
                          </div>
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                            {run.one_line_verdict}
                          </p>
                        </div>

                        {/* Meta: date + duration */}
                        <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(run.createdAt)}
                          </span>
                          <span className="text-xs flex items-center gap-1 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={10} />
                            {formatDuration(run.duration_seconds)}
                          </span>
                        </div>

                        {/* Recording playback */}
                        {run.audioUrl && (
                          <div className="flex-shrink-0">
                            <RecordingPlayer recordingUrl={run.audioUrl} compact />
                          </div>
                        )}

                        {/* Score badge */}
                        <div className="flex-shrink-0">
                          <ScoreBadge score={run.overallScore} size="sm" />
                        </div>

                        {/* Delete button (hover reveal) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteRun({ id: run.id, number: run.number });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          aria-label={`Delete pitch #${run.number}`}
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* Arrow */}
                        <ArrowRight
                          size={16}
                          className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          /* ——— Grid View ——— */
          <div className="flex flex-col gap-5">
            {DATE_GROUP_ORDER.map((group) => {
              const runs = groupedVisible[group];
              if (!runs) return null;
              return (
                <div key={group} className="flex flex-col gap-3">
                  {/* Group divider */}
                  <div className="flex items-center gap-2 px-1">
                    <SectionHeader icon={<Calendar size={12} />}>
                      {DATE_GROUP_LABELS[group]}
                    </SectionHeader>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {runs.map((run) => {
                      const idx = animIndex++;
                      const isDeleting = deletingId === run.id;
                      return (
                        <div
                          key={run.id}
                          className={`group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 cursor-pointer animate-fade-in-up ${
                            isDeleting ? 'opacity-40 scale-95' : ''
                          }`}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-color)',
                            animationDelay: `${idx * 60}ms`,
                            animationFillMode: 'both',
                          }}
                          onClick={() => setSelectedRunId(run.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                          }}
                        >
                          {/* Delete button (absolute top-right, hover reveal) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteRun({ id: run.id, number: run.number });
                            }}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            aria-label={`Delete pitch #${run.number}`}
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Top row: play icon + mode pill + score */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                              >
                                <Play size={14} style={{ color: 'var(--text-secondary)' }} fill="currentColor" />
                              </div>
                              <TagPill
                                label={getModeLabel(run.mode)}
                                color={getModeColor(run.mode)}
                                bgColor={getModeBgColor(run.mode)}
                              />
                            </div>
                            <ScoreBadge score={run.overallScore} size="sm" />
                          </div>

                          {/* Title + deck */}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                Pitch #{run.number}
                              </p>
                              {run.inputType === 'audio' ? (
                                <Mic size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              ) : (
                                <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              )}
                            </div>
                            {run.deck && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                {run.deck}
                              </p>
                            )}
                          </div>

                          {/* Verdict */}
                          <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {run.one_line_verdict}
                          </p>

                          {/* Recording playback */}
                          {run.audioUrl && (
                            <RecordingPlayer recordingUrl={run.audioUrl} compact />
                          )}

                          {/* Meta row */}
                          <div className="flex items-center gap-3 mt-auto pt-1">
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Calendar size={11} />
                              {formatDate(run.createdAt)}
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Clock size={11} />
                              {formatDuration(run.duration_seconds)}
                            </span>
                          </div>

                          {/* Review link */}
                          <div className="flex items-center justify-end">
                            <span
                              className="text-xs font-medium flex items-center gap-1 transition-all duration-200 group-hover:gap-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Review
                              <ArrowRight size={13} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ——— Load More ——— */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Load More Runs
            </button>
          </div>
        )}

        {/* ——— Pagination summary ——— */}
        <div className="flex items-center justify-center mt-4 gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} run{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </GlassCard>

      <ConfirmDialog
        open={!!confirmDeleteRun}
        onClose={() => setConfirmDeleteRun(null)}
        title={confirmDeleteRun ? `Delete Pitch #${confirmDeleteRun.number}?` : ''}
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isConfirming={!!confirmDeleteRun && deletingId === confirmDeleteRun.id}
        onConfirm={async () => {
          if (!confirmDeleteRun) return;
          await performDelete(confirmDeleteRun.id);
        }}
      />
      <RunDetailModal
        runId={selectedRunId}
        onClose={() => setSelectedRunId(null)}
      />
    </main>
  );
}
