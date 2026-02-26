'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Check, X } from 'lucide-react';
import { GlassCard } from '@/views/components/ui';
import { RUBRIC_COLORS } from '@/views/components/ui/colors';
import { RUBRIC_EXPLORER } from '@/config/onboarding';
import { SCORE_BANDS } from '@/config/rubric';

interface RubricStepProps {
  onNext: () => void;
}

export function RubricStep({ onNext }: RubricStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    // Stagger entrance: each card fades in 100ms after the previous
    const timers: ReturnType<typeof setTimeout>[] = [];
    RUBRIC_EXPLORER.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCards(i + 1), 100 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-[700px]">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Five categories. One score. Zero guesswork.
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Tap any category to see what the AI evaluates.
        </p>

        {/* Category cards */}
        <div className="space-y-2 mb-6">
          {RUBRIC_EXPLORER.map((cat, i) => {
            const isExpanded = expandedId === cat.id;
            const color = RUBRIC_COLORS[cat.id] ?? '#6b7280';
            return (
              <div
                key={cat.id}
                className="transition-all duration-500 ease-out"
                style={{
                  opacity: i < visibleCards ? 1 : 0,
                  transform: i < visibleCards ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                <GlassCard padding="sm" animate={false} className="cursor-pointer">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="w-full flex items-center gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold flex-1 text-left text-sm" style={{ color: 'var(--text-primary)' }}>
                      {cat.label}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/{cat.weight}</span>
                    <ChevronDown
                      size={16}
                      className="transition-transform duration-200 flex-shrink-0"
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Expanded content */}
                  <div
                    className="overflow-hidden transition-all duration-200 ease-out"
                    style={{
                      maxHeight: isExpanded ? '200px' : '0px',
                      opacity: isExpanded ? 1 : 0,
                      marginTop: isExpanded ? '12px' : '0px',
                    }}
                  >
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {cat.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Check size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-semibold" style={{ color: '#22c55e' }}>Good:</span> {cat.good}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <X size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-semibold" style={{ color: '#ef4444' }}>Bad:</span> {cat.bad}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        {/* Score bands */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {SCORE_BANDS.map((band) => (
            <div
              key={band.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: `${band.color}15`,
                color: band.color,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
              {band.min}-{band.max} {band.label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#ff5941' }}
          >
            Watch it score
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
