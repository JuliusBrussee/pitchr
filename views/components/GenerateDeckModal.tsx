'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { TEMPLATE_LIST } from '@/config/deckTemplates';
import type { TemplateId } from '@/types/deckGeneration';

interface GenerateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateDeckModal({ isOpen, onClose, onSuccess }: GenerateDeckModalProps) {
  const [templateId, setTemplateId] = useState<TemplateId>('minimal-dark');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isValid = companyName.trim().length > 0 && description.trim().length >= 10;

  const handleGenerate = async () => {
    if (!isValid || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          description: description.trim(),
          templateId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-2xl border p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 89, 65, 0.10)' }}
            >
              <Sparkles size={18} style={{ color: '#ff5941' }} />
            </div>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Generate with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Picker */}
        <div className="mb-6">
          <label
            className="block text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Choose a style
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TEMPLATE_LIST.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className="flex-shrink-0 w-36 rounded-xl border-2 p-3 transition-all duration-200 hover:scale-[1.03]"
                style={{
                  borderColor: templateId === t.id
                    ? t.colors.accent
                    : 'var(--border-color)',
                  backgroundColor: t.colors.background,
                  boxShadow: templateId === t.id
                    ? `0 0 16px ${t.colors.accent}33`
                    : 'none',
                }}
              >
                {/* Mini preview */}
                <div className="h-16 rounded-lg mb-2 flex flex-col justify-center px-2" style={{ backgroundColor: t.colors.backgroundSecondary }}>
                  <div
                    className="h-1.5 rounded-full mb-1.5"
                    style={{ backgroundColor: t.colors.accent, width: '60%' }}
                  />
                  <div
                    className="h-1 rounded-full mb-1"
                    style={{ backgroundColor: t.colors.textSecondary, width: '80%', opacity: 0.5 }}
                  />
                  <div
                    className="h-1 rounded-full"
                    style={{ backgroundColor: t.colors.textSecondary, width: '50%', opacity: 0.3 }}
                  />
                </div>
                <p
                  className="text-[11px] font-semibold text-center"
                  style={{ color: t.colors.text }}
                >
                  {t.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Company Name */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
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
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Pitch Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Describe your startup, product, market, traction, team, and what you're raising. The more detail you provide, the better the deck will be..."
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors resize-none"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex justify-end mt-1">
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {description.length} / 5,000
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!isValid || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: isGenerating
              ? 'var(--bg-surface-hover)'
              : 'linear-gradient(135deg, #ff5941, #ffaa33)',
            color: '#ffffff',
            boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(255, 89, 65, 0.3)',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating your pitch deck...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Deck
            </>
          )}
        </button>
      </div>
    </div>
  );
}
