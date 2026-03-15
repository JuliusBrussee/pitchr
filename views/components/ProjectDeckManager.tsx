'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Sparkles,
  Plus,
  Clock,
  Presentation,
  Search,
  Loader2,
  AlertCircle,
  FolderInput,
  FolderOpen,
  X,
} from 'lucide-react';
import { ConfirmDialog, SearchInput, EmptyState } from '@/views/components/ui';
import { GenerateDeckModal } from '@/views/components/GenerateDeckModal';
import { useProject } from '@/views/components/ProjectProvider';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { DeckRecord } from '@/services/deckService';

const SHIMMER_CSS = `
@keyframes deck-shimmer {
  0%, 100% { background-position: -200% 0; }
  50% { background-position: 200% 0; }
}
`;

const shimmerStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, transparent 0%, rgba(255, 89, 65, 0.06) 30%, rgba(255, 170, 51, 0.06) 50%, rgba(255, 89, 65, 0.06) 70%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'deck-shimmer 2.5s ease-in-out infinite',
};

const GRADIENT_POOL = [
  'linear-gradient(135deg, #1c1210, #2a1a16, #1c1210)',
  'linear-gradient(135deg, #0d9488, #10b981, #34d399)',
  'linear-gradient(135deg, #f97316, #ef4444, #fb7185)',
  'linear-gradient(135deg, #1a1512, #2d1c15, #3a2218)',
  'linear-gradient(135deg, #ec4899, #f43f5e, #f97316)',
  'linear-gradient(135deg, #1c1614, #261a14, #1c1210)',
];

function gradientForDeck(index: number): string {
  return GRADIENT_POOL[index % GRADIENT_POOL.length];
}

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

/* ——— Move Dropdown ——— */

interface MoveDropdownProps {
  deckId: string;
  currentProjectId: string;
  onClose: () => void;
  onMoved: () => void;
}

function MoveDropdown({ deckId, currentProjectId, onClose, onMoved }: MoveDropdownProps) {
  const { projects } = useProject();
  const [isMoving, setIsMoving] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const otherProjects = projects.filter((p) => p.id !== currentProjectId && !p.isArchived);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleMove = async (targetProjectId: string) => {
    setIsMoving(targetProjectId);
    try {
      const res = await fetchEdge('deck-detail', {
        method: 'PATCH',
        params: { deckId },
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: targetProjectId }),
      });
      if (!res.ok) throw new Error('Failed to move deck');
      onMoved();
      onClose();
    } catch {
      setIsMoving(null);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border overflow-hidden z-30"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <FolderInput size={12} style={{ color: '#ff5941' }} />
          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Move to project
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-0.5 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Project list */}
      <div className="py-1 max-h-[200px] overflow-y-auto">
        {otherProjects.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              No other projects available
            </p>
          </div>
        ) : (
          otherProjects.map((p) => (
            <button
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                void handleMove(p.id);
              }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={isMoving !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-all duration-150 disabled:opacity-40"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: hoveredId === p.id ? 'var(--bg-surface-hover)' : 'transparent',
              }}
            >
              {isMoving === p.id ? (
                <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: '#ff5941' }} />
              ) : (
                <FolderOpen
                  size={13}
                  className="flex-shrink-0"
                  style={{ color: hoveredId === p.id ? '#ff5941' : 'var(--text-muted)' }}
                />
              )}
              <span className="truncate">{p.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ——— Main Component ——— */

interface ProjectDeckManagerProps {
  projectId: string;
}

export function ProjectDeckManager({ projectId }: ProjectDeckManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [moveOpenDeckId, setMoveOpenDeckId] = useState<string | null>(null);
  const [hoveredDeckId, setHoveredDeckId] = useState<string | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await fetchEdge('deck-list', {
        params: { projectId },
      });
      if (!res.ok) throw new Error('Failed to load decks');
      const data = await res.json();
      setDecks(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load decks');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  useEffect(() => {
    const id = 'deck-shimmer-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = SHIMMER_CSS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      const res = await fetchEdge('deck-upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        const serverMsg = data.error;

        // Map status codes to user-friendly messages
        let message: string;
        switch (res.status) {
          case 401:
            message = 'Session expired. Please refresh the page and try again.';
            break;
          case 413:
            message = 'File too large. Maximum size is 50MB.';
            break;
          case 400:
            message = serverMsg?.toLowerCase().includes('too large')
              ? 'File too large. Maximum size is 50MB.'
              : serverMsg || 'Invalid upload request. Please check the file and try again.';
            break;
          case 422:
            message = serverMsg || 'Unsupported file format.';
            break;
          case 429:
            message = 'Too many uploads. Please wait a moment and try again.';
            break;
          case 500:
            message = 'Upload failed. Please try again or contact support.';
            break;
          default:
            message = serverMsg || `Upload failed (${res.status}). Please try again.`;
        }
        throw new Error(message);
      }
      await fetchDecks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, fetchDecks]);

  const performDeleteDeck = useCallback(async (deckId: string) => {
    setIsDeletingDeck(true);
    setError(null);
    try {
      const res = await fetchEdge('deck-detail', { method: 'DELETE', params: { deckId } });
      if (!res.ok) throw new Error('Failed to delete deck');
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      setDeckToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deck');
    } finally {
      setIsDeletingDeck(false);
    }
  }, []);

  const handleDownload = async (deck: DeckRecord) => {
    try {
      const res = await fetch(deck.pdf_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Decks
          </h2>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--border-color)' }}
          >
            {decks.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
            className="w-40"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          }}
        >
          <AlertCircle size={13} />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-0.5 rounded transition-colors"
            style={{ color: '#ef4444' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }}
        onClick={() => fileInputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 py-5 rounded-xl border border-dashed cursor-pointer transition-all duration-300 group overflow-hidden"
        style={{
          borderColor: isDragOver ? 'rgba(255, 89, 65, 0.5)' : 'var(--border-color)',
          backgroundColor: isDragOver ? 'rgba(255, 89, 65, 0.03)' : 'transparent',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={shimmerStyle}
        />
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {isUploading
            ? <Loader2 size={16} style={{ color: '#ff5941' }} className="animate-spin" />
            : <Upload size={16} style={{ color: 'var(--text-muted)' }} />
          }
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {isUploading ? 'Uploading...' : 'Drop slides here or click to upload (PDF, PPTX)'}
        </p>
      </div>

      {/* Deck grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {/* AI generate card */}
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 cursor-pointer transition-all duration-300 group"
          style={{
            borderColor: 'rgba(255, 89, 65, 0.15)',
            backgroundColor: 'var(--bg-surface)',
            minHeight: '200px',
          }}
          onClick={() => setIsGenerateOpen(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.35)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 89, 65, 0.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.15)';
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.08))',
              boxShadow: '0 0 24px rgba(255, 89, 65, 0.05)',
            }}
          >
            <Sparkles size={20} style={{ color: '#ff5941' }} />
          </div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Create with AI</p>
          <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>Let AI build slides for you</p>
        </div>

        {isLoading && (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: '#ff5941' }} />
          </div>
        )}

        {!isLoading && filteredDecks.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={<Search size={24} style={{ color: 'var(--text-muted)' }} />}
              message={searchQuery ? 'No decks match your search.' : 'No decks yet. Upload one to get started!'}
            />
          </div>
        )}

        {!isLoading && filteredDecks.map((deck, index) => {
          const isHovered = hoveredDeckId === deck.id;
          return (
            <div
              key={deck.id}
              onMouseEnter={() => setHoveredDeckId(deck.id)}
              onMouseLeave={() => setHoveredDeckId(null)}
              className="flex flex-col rounded-xl border overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isHovered ? 'var(--text-muted)' : 'var(--border-color)',
                boxShadow: isHovered ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              {/* Thumbnail area */}
              <div
                className="relative h-28 flex items-center justify-center overflow-hidden"
                style={{ background: gradientForDeck(index) }}
              >
                <Presentation size={28} className="text-white/50" />

                {/* Slide count badge */}
                <div
                  className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-white/90"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
                >
                  <FileText size={10} /> {deck.slide_count} slides
                </div>

                {/* Action buttons */}
                <div
                  className="absolute top-2 right-2 flex items-center gap-0.5 transition-all duration-200"
                  style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(-4px)' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setMoveOpenDeckId(moveOpenDeckId === deck.id ? null : deck.id); }}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
                    aria-label="Move to project"
                    title="Move to project"
                  >
                    <FolderInput size={13} />
                  </button>
                  {deck.pdf_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(deck); }}
                      className="p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
                      aria-label="Download"
                    >
                      <Download size={13} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeckToDelete({ id: deck.id, name: deck.name }); }}
                    className="p-1.5 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)' }}
                    aria-label="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Move dropdown */}
                {moveOpenDeckId === deck.id && (
                  <MoveDropdown
                    deckId={deck.id}
                    currentProjectId={projectId}
                    onClose={() => setMoveOpenDeckId(null)}
                    onMoved={() => fetchDecks()}
                  />
                )}
              </div>

              {/* Card footer */}
              <div className="flex flex-col gap-1 p-3">
                <h3 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {deck.name}
                </h3>
                <div className="flex items-center gap-1">
                  <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(deck.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        title="Delete deck?"
        description={deckToDelete ? `"${deckToDelete.name}" will be removed. This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isConfirming={isDeletingDeck}
        onConfirm={async () => {
          if (!deckToDelete) return;
          await performDeleteDeck(deckToDelete.id);
        }}
      />
      <GenerateDeckModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={() => fetchDecks()}
        projectId={projectId}
      />
    </div>
  );
}
