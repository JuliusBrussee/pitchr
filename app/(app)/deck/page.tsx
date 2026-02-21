'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Plus,
  Clock,
  Presentation,
  FolderOpen,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SearchInput, SectionHeader, EmptyState } from '@/views/components/ui';
import { GenerateDeckModal } from '@/views/components/GenerateDeckModal';
import type { DeckRecord } from '@/services/deckService';

/* --- Helpers --- */

const glassStyles = {
  backgroundColor: 'var(--bg-surface)',
  backdropFilter: 'blur(var(--blur-strength))',
  WebkitBackdropFilter: 'blur(var(--blur-strength))',
  borderColor: 'var(--border-color)',
};

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

/* --- Component --- */

export default function DeckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch decks
  const fetchDecks = useCallback(async () => {
    try {
      const res = await fetch('/api/deck');
      if (!res.ok) throw new Error('Failed to load decks');
      const data = await res.json();
      setDecks(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load decks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Inject shimmer keyframes once on mount
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

  // Upload handler
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/deck/upload', { method: 'POST', body: formData });
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
  };

  // Delete handler
  const handleDelete = async (deckId: string) => {
    try {
      const res = await fetch(`/api/deck/${deckId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete deck');
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deck');
    }
  };

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main
      className="flex-1 flex flex-col gap-5 overflow-y-auto rounded-2xl p-6 border"
      style={glassStyles}
    >
      {/* Hidden file input */}
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

      {/* --- Header --- */}
      <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 89, 65, 0.10)' }}
          >
            <FolderOpen size={18} style={{ color: '#ff5941' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Deck Manager
            </h1>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--border-color)',
            }}
          >
            {decks.length} decks
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search decks..."
            className="w-52"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
            style={{
              background: '#1c1210',
              color: '#fff0eb',
              boxShadow: '0 4px 20px rgba(255, 89, 65, 0.2)',
            }}
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isUploading ? 'Uploading...' : 'Upload New'}
          </button>
        </div>
      </div>

      {/* --- Error Banner --- */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in-up"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- Upload Dropzone --- */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group overflow-hidden"
          style={{
            borderColor: isDragOver
              ? 'rgba(255, 89, 65, 0.4)'
              : 'var(--border-color)',
            backgroundColor: isDragOver
              ? 'rgba(255, 89, 65, 0.04)'
              : 'transparent',
          }}
        >
          {/* Animated shimmer overlay on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={shimmerStyle}
          />

          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
            }}
          >
            {isUploading ? (
              <Loader2
                size={22}
                style={{ color: '#ff5941' }}
                className="animate-spin"
              />
            ) : (
              <Upload
                size={22}
                style={{ color: 'var(--text-secondary)' }}
                className="transition-transform duration-300 group-hover:-translate-y-0.5"
              />
            )}
          </div>
          <div className="text-center relative z-10">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {isUploading ? 'Uploading...' : (
                <>
                  Drop your slides here or{' '}
                  <span style={{ color: '#ff5941' }} className="cursor-pointer transition-colors duration-200">
                    click to upload
                  </span>
                </>
              )}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              PDF, PPTX — max 50 MB
            </p>
          </div>
        </div>
      </div>

      {/* --- Section Label --- */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
      >
        <SectionHeader icon={<Presentation size={13} />}>
          Your Decks
        </SectionHeader>
      </div>

      {/* --- Deck Grid --- */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {/* Create with AI Card */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div
            className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
            style={{
              borderColor: 'rgba(255, 89, 65, 0.2)',
              backgroundColor: 'var(--bg-surface)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
              minHeight: '320px',
            }}
            onClick={() => setIsGenerateOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.2)';
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 89, 65, 0.08) 0%, rgba(255, 170, 51, 0.03) 50%, transparent 70%)',
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={shimmerStyle}
            />
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.10))',
              }}
            >
              <Sparkles
                size={28}
                className="transition-transform duration-500 group-hover:rotate-12"
                style={{ color: '#ff5941' }}
              />
            </div>
            <div className="text-center relative z-10">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Create with AI
              </p>
              <p
                className="text-xs mt-1.5 max-w-[200px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Describe your pitch and let AI build the slides for you
              </p>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(90deg, #ff5941, #ffaa33, #ff5941)',
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            className="col-span-full flex items-center justify-center py-12 animate-fade-in-up"
            style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDecks.length === 0 && (
          <div
            className="col-span-full animate-fade-in-up"
            style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
          >
            <EmptyState
              icon={<Search size={32} style={{ color: 'var(--text-muted)' }} />}
              message={searchQuery ? 'No decks match your search.' : 'No decks yet. Upload one to get started!'}
            />
          </div>
        )}

        {/* Deck Cards */}
        {!isLoading && filteredDecks.map((deck, index) => (
          <div
            key={deck.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${0.1 + (index + 1) * 0.06}s`,
              animationFillMode: 'both',
            }}
          >
            <div
              className="relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(var(--blur-strength))',
                WebkitBackdropFilter: 'blur(var(--blur-strength))',
                borderColor: 'var(--border-color)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {/* Gradient Thumbnail Area */}
              <div
                className="relative h-40 flex items-center justify-center overflow-hidden"
                style={{ background: gradientForDeck(index) }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)
                    `,
                  }}
                />
                <div
                  className="absolute top-3 right-3 w-20 h-20 rounded-full opacity-10"
                  style={{ backgroundColor: 'white' }}
                />
                <div
                  className="absolute bottom-2 left-4 w-12 h-12 rounded-lg rotate-12 opacity-10"
                  style={{ backgroundColor: 'white' }}
                />

                <Presentation
                  size={40}
                  className="relative z-10 text-white/70 transition-transform duration-300 group-hover:scale-110"
                />

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm">
                  <FileText size={12} />
                  {deck.slide_count} slides
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(deck.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-red-400 hover:bg-white/15 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="Delete deck"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex flex-col gap-3 p-4">
                <h3
                  className="text-sm font-semibold leading-tight truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {deck.name}
                </h3>

                <div className="flex items-center gap-1.5">
                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(deck.created_at)}
                  </span>
                </div>

                <div
                  className="flex items-center gap-4 pt-3 border-t"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Presentation size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {deck.slide_count} slides
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Footer Summary --- */}
      <div
        className="flex items-center justify-center animate-fade-in-up"
        style={{
          animationDelay: '0.5s',
          animationFillMode: 'both',
        }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filteredDecks.length} of {decks.length} decks shown
        </span>
      </div>
      <GenerateDeckModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={() => fetchDecks()}
      />
    </main>
  );
}
