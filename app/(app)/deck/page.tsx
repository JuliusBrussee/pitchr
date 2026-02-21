'use client';

import { useState } from 'react';
import {
  Upload,
  FileText,
  MoreHorizontal,
  Sparkles,
  Search,
  Plus,
  Clock,
  BarChart2,
  Presentation,
  FolderOpen,
  Image,
} from 'lucide-react';

/* ─── Mock Data ─── */

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

const MOCK_DECKS: MockDeck[] = [
  {
    id: '1',
    title: 'Series A Pitch',
    slides: 12,
    lastUsed: '2 hours ago',
    practices: 8,
    avgScore: 87,
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5, #6366f1)',
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
    gradient: 'linear-gradient(135deg, #2563eb, #7c3aed, #a855f7)',
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
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)',
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

export default function DeckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredDecks = MOCK_DECKS.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <main
        className="flex-1 flex flex-col gap-5 overflow-y-auto rounded-2xl p-6 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
        }}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <FolderOpen size={24} style={{ color: 'var(--text-primary)' }} />
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Deck Manager
            </h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--border-color)',
              }}
            >
              {MOCK_DECKS.length} decks
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-44"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Upload New Button */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)',
              }}
            >
              <Plus size={16} />
              Upload New
            </button>
          </div>
        </div>

        {/* ─── Upload Dropzone ─── */}
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
                ? 'rgba(124, 58, 237, 0.5)'
                : 'var(--border-color)',
              backgroundColor: isDragOver
                ? 'rgba(124, 58, 237, 0.05)'
                : 'transparent',
            }}
          >
            {/* Animated border shimmer */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.08), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />

            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110"
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
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Drop your slides here or{' '}
                <span className="text-purple-500 hover:text-purple-400 cursor-pointer">
                  click to upload
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                PDF, PPTX, Google Slides
              </p>
            </div>
          </div>
        </div>

        {/* ─── Deck Grid ─── */}
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
              className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all duration-300 group overflow-hidden hover:scale-[1.02]"
              style={{
                borderColor: 'rgba(124, 58, 237, 0.25)',
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: `blur(var(--blur-strength))`,
                WebkitBackdropFilter: `blur(var(--blur-strength))`,
                minHeight: '320px',
              }}
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
                }}
              />

              {/* Sparkle icon */}
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(59, 130, 246, 0.15))',
                }}
              >
                <Sparkles
                  size={28}
                  className="transition-transform duration-500 group-hover:rotate-12"
                  style={{ color: '#a855f7' }}
                />
              </div>

              <div className="text-center relative z-10">
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Create with AI
                </p>
                <p className="text-xs mt-1.5 max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
                  Describe your pitch and let AI build the slides for you
                </p>
              </div>

              {/* Gradient accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed)',
                }}
              />
            </div>
          </div>

          {/* Deck Cards */}
          {filteredDecks.map((deck, index) => {
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
                    backdropFilter: `blur(var(--blur-strength))`,
                    WebkitBackdropFilter: `blur(var(--blur-strength))`,
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* Thumbnail Area */}
                  <div
                    className="relative h-40 flex items-center justify-center overflow-hidden"
                    style={{ background: deck.gradient }}
                  >
                    {/* Floating shapes for visual richness */}
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

                    {/* Center icon */}
                    <AccentIcon
                      size={40}
                      className="relative z-10 text-white/70 transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Slide count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm">
                      <FileText size={12} />
                      {deck.slides} slides
                    </div>

                    {/* More menu */}
                    <button
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <h3
                        className="text-sm font-semibold leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {deck.title}
                      </h3>
                    </div>

                    {/* Last used */}
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {deck.lastUsed}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div
                      className="flex items-center gap-4 pt-2 border-t"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Presentation size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {deck.practices} runs
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart2 size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {deck.avgScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
  );
}
