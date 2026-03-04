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
} from 'lucide-react';
import { SearchInput, SectionHeader, EmptyState } from '@/views/components/ui';
import { GenerateDeckModal } from '@/views/components/GenerateDeckModal';
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
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      await fetchDecks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, fetchDecks]);

  const handleDelete = async (deckId: string) => {
    try {
      const res = await fetchEdge('deck-detail', { method: 'DELETE', params: { deckId } });
      if (!res.ok) throw new Error('Failed to delete deck');
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deck');
    }
  };

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
    <div className="flex flex-col gap-4">
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
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: '#1c1210', color: '#fff0eb' }}
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Upload
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
        >
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto underline">Dismiss</button>
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all group overflow-hidden"
        style={{
          borderColor: isDragOver ? 'rgba(255, 89, 65, 0.4)' : 'var(--border-color)',
          backgroundColor: isDragOver ? 'rgba(255, 89, 65, 0.04)' : 'transparent',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={shimmerStyle}
        />
        <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
          {isUploading ? <Loader2 size={18} style={{ color: '#ff5941' }} className="animate-spin" /> : <Upload size={18} style={{ color: 'var(--text-secondary)' }} />}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isUploading ? 'Uploading...' : 'Drop slides here or click to upload (PDF, PPTX)'}
        </p>
      </div>

      {/* Deck grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {/* AI generate card */}
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all group hover:scale-[1.02]"
          style={{ borderColor: 'rgba(255, 89, 65, 0.2)', backgroundColor: 'var(--bg-surface)', minHeight: '200px' }}
          onClick={() => setIsGenerateOpen(true)}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.10))' }}
          >
            <Sparkles size={22} style={{ color: '#ff5941' }} />
          </div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Create with AI</p>
          <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>Let AI build slides for you</p>
        </div>

        {isLoading && (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
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

        {!isLoading && filteredDecks.map((deck, index) => (
          <div
            key={deck.id}
            className="flex flex-col rounded-xl border overflow-hidden transition-all group hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ background: gradientForDeck(index) }}>
              <Presentation size={28} className="text-white/70" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-white/90 bg-black/25 backdrop-blur-sm">
                <FileText size={10} /> {deck.slide_count} slides
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {deck.pdf_url && (
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(deck); }} className="p-1 rounded text-white/70 hover:text-white hover:bg-white/15" aria-label="Download">
                    <Download size={14} />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }} className="p-1 rounded text-white/70 hover:text-red-400 hover:bg-white/15" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <h3 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{deck.name}</h3>
              <div className="flex items-center gap-1">
                <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(deck.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GenerateDeckModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={() => fetchDecks()}
        projectId={projectId}
      />
    </div>
  );
}
