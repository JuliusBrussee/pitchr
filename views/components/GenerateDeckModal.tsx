'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Check, Wand2, FileText, Palette } from 'lucide-react';
import { TEMPLATE_LIST } from '@/config/deckTemplates';
import { CREDIT_COSTS } from '@/config/billing';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { parseRetryAfter } from '@/lib/supabase/edge-error';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import type { TemplateId } from '@/types/deckGeneration';

interface GenerateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string | null;
}

const GENERATION_STEPS = [
  { label: 'Analyzing your story', icon: Wand2 },
  { label: 'Writing slides', icon: FileText },
  { label: 'Applying theme', icon: Palette },
  { label: 'Rendering PDF', icon: Sparkles },
];

interface DeckGenerationAccess {
  allowed: boolean;
  planId: 'free' | 'day_pass' | 'pro';
  used: number;
  limit: number | null;
  remaining: number | null;
}

function getAccessMessage(access: DeckGenerationAccess | null): string {
  if (!access) {
    return `Deck generation costs ${CREDIT_COSTS.deckGeneration} credits.`;
  }

  if (access.planId === 'day_pass') {
    const remaining = access.remaining ?? 0;
    return access.allowed
      ? `Day Pass active. ${remaining} deck ${remaining === 1 ? 'generation' : 'generations'} remaining.`
      : 'Your Day Pass deck quota is used up.';
  }

  const remaining = access.remaining ?? 0;
  return access.allowed
    ? `Deck generation costs ${CREDIT_COSTS.deckGeneration} credits. ${remaining} available now.`
    : `Deck generation needs ${CREDIT_COSTS.deckGeneration} credits. ${remaining} available now.`;
}

function TemplatePreviewCard({
  template,
  isSelected,
  onClick,
}: {
  template: (typeof TEMPLATE_LIST)[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 rounded-2xl border-2 transition-all duration-300 overflow-hidden group"
      style={{
        width: '170px',
        borderColor: isSelected ? template.colors.accent : 'var(--border-color)',
        boxShadow: isSelected
          ? `0 0 0 1px ${template.colors.accent}44, 0 8px 32px ${template.colors.accent}22`
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Selected check badge */}
      {isSelected && (
        <div
          className="absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: template.colors.accent }}
        >
          <Check size={11} color="#fff" strokeWidth={3} />
        </div>
      )}

      {/* Slide mockup */}
      <div
        className="relative p-4 pb-3"
        style={{
          backgroundColor: template.colors.background,
          minHeight: '110px',
        }}
      >
        {/* Decorative corner accent */}
        <div
          className="absolute top-0 left-0 w-12 h-12 opacity-20"
          style={{
            background: `radial-gradient(circle at 0% 0%, ${template.colors.accent}, transparent 70%)`,
          }}
        />

        {/* Mock title bar */}
        <div
          className="h-2 rounded-full mb-2.5"
          style={{
            backgroundColor: template.colors.accent,
            width: '55%',
            opacity: isSelected ? 1 : 0.8,
          }}
        />

        {/* Mock subtitle */}
        <div
          className="h-1.5 rounded-full mb-3"
          style={{
            backgroundColor: template.colors.textSecondary,
            width: '75%',
            opacity: 0.4,
          }}
        />

        {/* Mock bullet lines */}
        <div className="flex flex-col gap-1.5">
          {[65, 80, 50].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: template.colors.accent, opacity: 0.6 }}
              />
              <div
                className="h-1 rounded-full"
                style={{
                  backgroundColor: template.colors.textSecondary,
                  width: `${w}%`,
                  opacity: 0.25,
                }}
              />
            </div>
          ))}
        </div>

        {/* Mock callout badge */}
        <div
          className="absolute bottom-3 right-3 px-2 py-1 rounded-md"
          style={{
            backgroundColor: `${template.colors.accent}18`,
          }}
        >
          <div
            className="h-1.5 w-6 rounded-full"
            style={{ backgroundColor: template.colors.accent, opacity: 0.5 }}
          />
        </div>
      </div>

      {/* Label */}
      <div
        className="px-3 py-2.5 text-center border-t"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isSelected ? `${template.colors.accent}22` : 'var(--border-color)',
        }}
      >
        <p
          className="text-[11px] font-semibold tracking-wide"
          style={{
            color: isSelected ? template.colors.accent : 'var(--text-secondary)',
          }}
        >
          {template.name}
        </p>
      </div>
    </button>
  );
}

function GeneratingOverlay({ step }: { step: number }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 rounded-2xl generate-overlay-enter"
      style={{
        backgroundColor: 'var(--bg-primary)',
        opacity: 0.98,
      }}
    >
      {/* Animated orb */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-full generate-orb-pulse"
          style={{
            background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
            boxShadow: '0 0 60px rgba(255, 89, 65, 0.3), 0 0 120px rgba(255, 170, 51, 0.15)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={28} color="#fff" className="generate-icon-spin" />
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-64">
        {GENERATION_STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-500"
              style={{
                backgroundColor: isActive ? 'rgba(255, 89, 65, 0.08)' : 'transparent',
                opacity: isDone ? 0.5 : isActive ? 1 : 0.3,
                transform: isActive ? 'translateX(4px)' : 'translateX(0)',
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? 'rgba(34, 197, 94, 0.15)'
                    : isActive
                      ? 'rgba(255, 89, 65, 0.15)'
                      : 'var(--border-color)',
                }}
              >
                {isDone ? (
                  <Check size={12} style={{ color: '#22c55e' }} />
                ) : isActive ? (
                  <Loader2 size={12} style={{ color: '#ff5941' }} className="animate-spin" />
                ) : (
                  <Icon size={12} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: isDone
                    ? 'var(--text-muted)'
                    : isActive
                      ? '#ff5941'
                      : 'var(--text-muted)',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p
        className="text-[11px] mt-2"
        style={{ color: 'var(--text-muted)' }}
      >
        This usually takes 15-30 seconds
      </p>
    </div>
  );
}

export function GenerateDeckModal({ isOpen, onClose, onSuccess, projectId }: GenerateDeckModalProps) {
  const [templateId, setTemplateId] = useState<TemplateId>('minimal-dark');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckAccess, setDeckAccess] = useState<DeckGenerationAccess | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isRateLimited, rateLimitMessage, triggerCooldown } = useRateLimitCooldown();

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Simulate generation steps for UX feedback
  useEffect(() => {
    if (!isGenerating) {
      setGenStep(0);
      return;
    }
    const timers = [
      setTimeout(() => setGenStep(1), 3000),
      setTimeout(() => setGenStep(2), 8000),
      setTimeout(() => setGenStep(3), 13000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsCheckingAccess(true);

    void fetch('/api/billing/usage?resource=deck_generation')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to check deck generation access');
        }
        return res.json() as Promise<DeckGenerationAccess>;
      })
      .then((data) => {
        if (!cancelled) {
          setDeckAccess(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeckAccess(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingAccess(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = companyName.trim().length > 0 && description.trim().length >= 10;
  const charCount = description.length;
  const charPercent = Math.min((charCount / 5000) * 100, 100);
  const accessMessage = getAccessMessage(deckAccess);
  const isAccessBlocked = deckAccess !== null && !deckAccess.allowed;

  const handleGenerate = async () => {
    if (!isValid || isGenerating || isCheckingAccess) return;
    if (isAccessBlocked) {
      setError(accessMessage);
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetchEdge('deck-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          description: description.trim(),
          templateId,
          projectId: projectId ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          const retryAfter = parseRetryAfter(res, data as Record<string, unknown>);
          triggerCooldown(retryAfter);
          throw new Error('Too many requests. Please try again shortly.');
        }
        throw new Error(data.error || 'Generation failed');
      }

      onSuccess();
      onClose();
      setCompanyName('');
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={scrollRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden mx-4 rounded-2xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Generating overlay */}
        {isGenerating && <GeneratingOverlay step={genStep} />}

        {/* Top accent line */}
        <div
          className="h-[2px] rounded-t-2xl"
          style={{
            background: 'linear-gradient(90deg, #ff5941, #ffaa33, #ff5941)',
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center generate-icon-glow"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.15), rgba(255, 170, 51, 0.10))',
                }}
              >
                <Sparkles size={20} style={{ color: '#ff5941' }} />
              </div>
              <div>
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Generate with AI
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Describe your startup and we'll build the deck
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-30"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Template Picker */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={13} style={{ color: 'var(--text-muted)' }} />
              <label
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Slide Theme
              </label>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 generate-scroll-fade">
              {TEMPLATE_LIST.map((t) => (
                <TemplatePreviewCard
                  key={t.id}
                  template={t}
                  isSelected={templateId === t.id}
                  onClick={() => setTemplateId(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Company Name */}
          <div className="mb-5">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Acme AI"
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 generate-input-focus"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Pitch Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Describe your startup, product, market, traction, team, and what you're raising. The more detail you provide, the better the deck..."
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 resize-none generate-input-focus"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            {/* Character counter with progress bar */}
            <div className="flex items-center gap-3 mt-2">
              <div
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border-color)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${charPercent}%`,
                    background: charPercent > 90
                      ? '#ef4444'
                      : charPercent > 50
                        ? 'linear-gradient(90deg, #ff5941, #ffaa33)'
                        : '#ff5941',
                  }}
                />
              </div>
              <span
                className="text-[10px] tabular-nums flex-shrink-0"
                style={{ color: charPercent > 90 ? '#ef4444' : 'var(--text-muted)' }}
              >
                {charCount.toLocaleString()} / 5,000
              </span>
            </div>
          </div>

          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
            style={{
              backgroundColor: isAccessBlocked ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
              color: isAccessBlocked ? '#ef4444' : 'var(--text-secondary)',
              border: isAccessBlocked
                ? '1px solid rgba(239, 68, 68, 0.15)'
                : '1px solid var(--border-color)',
            }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: isAccessBlocked
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(255, 89, 65, 0.08)',
              }}
            >
              {isCheckingAccess ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
            </div>
            <span className="flex-1">
              {isCheckingAccess ? 'Checking deck generation access...' : accessMessage}
            </span>
          </div>

          {/* Error */}
          {(rateLimitMessage ?? error) && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fade-in-up"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <X size={10} />
              </div>
              <span className="flex-1">{rateLimitMessage ?? error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!isValid || isGenerating || isRateLimited || isCheckingAccess || isAccessBlocked}
            className="relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed generate-btn-hover"
            style={{
              background: 'linear-gradient(135deg, #ff5941, #e63b26)',
              color: '#ffffff',
              boxShadow: isValid && !isGenerating && !isRateLimited
                ? '0 4px 24px rgba(255, 89, 65, 0.35), 0 1px 3px rgba(0, 0, 0, 0.1)'
                : 'none',
            }}
          >
            {/* Shine sweep */}
            <div
              className="absolute inset-0 generate-btn-shine pointer-events-none"
              style={{
                background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.2), rgba(255,255,255,0.12), transparent)',
                transform: 'translateX(-100%) skewX(-18deg)',
              }}
            />
            <Sparkles size={16} />
            {isRateLimited ? rateLimitMessage : 'Generate Pitch Deck'}
          </button>

          {/* Footer hint */}
          <p
            className="text-center text-[10px] mt-3"
            style={{ color: 'var(--text-muted)' }}
          >
            AI generates 8 slides — Hook, Problem, Solution, Traction, Market, Business Model, Team, and Ask
          </p>
        </div>
      </div>
    </div>
  );
}
