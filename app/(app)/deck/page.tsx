'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  MoreHorizontal,
  Sparkles,
  Plus,
  Clock,
  BarChart2,
  Presentation,
  FolderOpen,
  Image,
  Search,
} from 'lucide-react';
import { SearchInput, SectionHeader, ScoreBadge, EmptyState } from '@/views/components/ui';

/* ——— Types ——— */

interface MockDeck {
  id: string;
  title: string;
  slides: number;
  lastUsed: string;
  practices: number;
  avgScore: number;
  gradient: string;
  accentIcon: 'presentation' | 'fileText' | 'barChart' | 'image' | 'folderOpen';
}

/* ——— Mock Data ——— */

const MOCK_DECKS: MockDeck[] = [
  {
    id: '1',
    title: 'Series A Pitch',
    slides: 12,
    lastUsed: '2 hours ago',
    practices: 8,
    avgScore: 87,
    gradient: 'linear-gradient(135deg, #1c1210, #2a1a16, #1c1210)',
    accentIcon: 'presentation',
  },
  {
    id: '2',
    title: 'Product Demo',
    slides: 18,
    lastUsed: 'Yesterday',
    practices: 14,
    avgScore: 92,
    gradient: 'linear-gradient(135deg, #0d9488, #10b981, #34d399)',
    accentIcon: 'fileText',
  },
  {
    id: '3',
    title: 'Q4 Investor Update',
    slides: 24,
    lastUsed: '3 days ago',
    practices: 5,
    avgScore: 78,
    gradient: 'linear-gradient(135deg, #f97316, #ef4444, #fb7185)',
    accentIcon: 'barChart',
  },
  {
    id: '4',
    title: 'Team Standup',
    slides: 6,
    lastUsed: 'Last week',
    practices: 22,
    avgScore: 95,
    gradient: 'linear-gradient(135deg, #1a1512, #2d1c15, #3a2218)',
    accentIcon: 'presentation',
  },
  {
    id: '5',
    title: 'YC Application',
    slides: 10,
    lastUsed: '5 days ago',
    practices: 11,
    avgScore: 84,
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e, #f97316)',
    accentIcon: 'image',
  },
  {
    id: '6',
    title: 'Sales Playbook',
    slides: 32,
    lastUsed: '2 weeks ago',
    practices: 3,
    avgScore: 71,
    gradient: 'linear-gradient(135deg, #1c1614, #261a14, #1c1210)',
    accentIcon: 'folderOpen',
  },
];

const ICON_MAP = {
  presentation: Presentation,
  fileText: FileText,
  barChart: BarChart2,
  image: Image,
  folderOpen: FolderOpen,
};

/* ——— Helpers ——— */

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

/* ——— Component ——— */

export default function DeckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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

  const filteredDecks = MOCK_DECKS.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main
      className="flex-1 flex flex-col gap-5 overflow-y-auto rounded-2xl p-6 border"
      style={glassStyles}
    >
      {/* ——— Header ——— */}
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
            {MOCK_DECKS.length} decks
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: '#1c1210',
              color: '#fff0eb',
              boxShadow: '0 4px 20px rgba(255, 89, 65, 0.2)',
            }}
          >
            <Plus size={16} />
            Upload New
          </button>
        </div>
      </div>

      {/* ——— Upload Dropzone ——— */}
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
          }}
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
            <Upload
              size={22}
              style={{ color: 'var(--text-secondary)' }}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </div>
          <div className="text-center relative z-10">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Drop your slides here or{' '}
              <span style={{ color: '#ff5941' }} className="cursor-pointer transition-colors duration-200">
                click to upload
              </span>
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              PDF, PPTX, Google Slides
            </p>
          </div>
        </div>
      </div>

      {/* ——— Section Label ——— */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
      >
        <SectionHeader icon={<Presentation size={13} />}>
          Your Decks
        </SectionHeader>
      </div>

      {/* ——— Deck Grid ——— */}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.2)';
            }}
          >
            {/* Radial glow effect on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 89, 65, 0.08) 0%, rgba(255, 170, 51, 0.03) 50%, transparent 70%)',
              }}
            />

            {/* Shimmer sweep on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={shimmerStyle}
            />

            {/* Sparkle icon container */}
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

            {/* Gradient accent bar at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(90deg, #ff5941, #ffaa33, #ff5941)',
              }}
            />
          </div>
        </div>

        {/* Deck Cards */}
        {filteredDecks.length === 0 ? (
          <div
            className="col-span-full animate-fade-in-up"
            style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
          >
            <EmptyState
              icon={<Search size={32} style={{ color: 'var(--text-muted)' }} />}
              message="No decks match your search."
            />
          </div>
        ) : (
          filteredDecks.map((deck, index) => {
            const AccentIcon = ICON_MAP[deck.accentIcon];

            return (
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
                    e.currentTarget.style.boxShadow =
                      '0 8px 32px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor =
                      'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 2px 12px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {/* Gradient Thumbnail Area */}
                  <div
                    className="relative h-40 flex items-center justify-center overflow-hidden"
                    style={{ background: deck.gradient }}
                  >
                    {/* Decorative floating shapes for visual richness */}
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

                    {/* Center accent icon */}
                    <AccentIcon
                      size={40}
                      className="relative z-10 text-white/70 transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Slide count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm">
                      <FileText size={12} />
                      {deck.slides} slides
                    </div>

                    {/* More options menu (reveals on hover) */}
                    <button className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-sm font-semibold leading-tight truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {deck.title}
                      </h3>
                      <ScoreBadge score={deck.avgScore} size="sm" />
                    </div>

                    {/* Last used timestamp */}
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={12}
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {deck.lastUsed}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div
                      className="flex items-center gap-4 pt-3 border-t"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Presentation
                          size={12}
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {deck.practices} runs
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart2
                          size={12}
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Avg {deck.avgScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ——— Footer Summary ——— */}
      <div
        className="flex items-center justify-center animate-fade-in-up"
        style={{
          animationDelay: '0.5s',
          animationFillMode: 'both',
        }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filteredDecks.length} of {MOCK_DECKS.length} decks shown
        </span>
      </div>
    </main>
  );
}
