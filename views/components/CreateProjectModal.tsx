'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Loader2, CornerDownLeft } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import { ModeSegmentedControl } from '@/views/components/ModeSegmentedControl';
import type { PitchMode } from '@/types/pitch';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const { createProject } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scoringRequirements, setScoringRequirements] = useState('');
  const [selectedMode, setSelectedMode] = useState<PitchMode>('vc_pitch');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = name.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const created = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        extraNotes: scoringRequirements.trim() || undefined,
        defaultMode: selectedMode,
        promptOverrides: scoringRequirements.trim()
          ? { analysis_system_prompt: scoringRequirements.trim() }
          : undefined,
        setActive: true,
      });
      setName('');
      setDescription('');
      setScoringRequirements('');
      setSelectedMode('vc_pitch');
      onCreated(created.id);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isCreating) {
      e.preventDefault();
      void handleCreate();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: isVisible ? 'blur(12px)' : 'blur(0px)',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="relative w-full max-w-[420px] rounded-2xl border transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04) inset',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, #ff5941 30%, #ffaa33 50%, #ff5941 70%, transparent 95%)',
          }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.15), rgba(255, 170, 51, 0.08))',
                  boxShadow: '0 0 24px rgba(255, 89, 65, 0.06)',
                }}
              >
                <FolderPlus size={18} style={{ color: '#ff5941' }} />
              </div>
              <div>
                <h2 id="create-project-title" className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  New Project
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Give your startup or idea a home
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Project Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
              placeholder="e.g. Acme AI"
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: name.trim() ? 'rgba(255, 89, 65, 0.25)' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = name.trim() ? 'rgba(255, 89, 65, 0.25)' : 'var(--border-color)'}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: '0' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              placeholder="One-line description of your startup"
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.3)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Default Pitch Mode */}
          <div className="mb-6">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Default Pitch Mode
            </label>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              Sets the default grading criteria for sessions
            </p>
            <ModeSegmentedControl value={selectedMode} onChange={setSelectedMode} />
          </div>

          <div className="mb-6">
            <label
              className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Scoring Requirements <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: '0' }}>(optional)</span>
            </label>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              What should the AI judge explicitly check for? These requirements customize how your pitches are graded and will appear in your results.
            </p>
            <textarea
              value={scoringRequirements}
              onChange={(e) => setScoringRequirements(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder='Example: Must mention SOC2 and 18-month runway. If missing, evidence cannot exceed 8/20.'
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 resize-y"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.3)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.12)',
              }}
            >
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              background: isValid ? 'linear-gradient(135deg, #ff5941, #e63b26)' : 'var(--bg-surface-hover)',
              color: isValid ? '#ffffff' : 'var(--text-muted)',
              boxShadow: isValid && !isCreating
                ? '0 4px 20px rgba(255, 89, 65, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : 'none',
            }}
          >
            {isCreating ? <Loader2 size={15} className="animate-spin" /> : <FolderPlus size={15} />}
            Create Project
          </button>

          {/* Keyboard hint */}
          {isValid && !isCreating && (
            <p
              className="flex items-center justify-center gap-1.5 text-[10px] mt-3 transition-opacity duration-300"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              <CornerDownLeft size={10} />
              Press Enter to create
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
