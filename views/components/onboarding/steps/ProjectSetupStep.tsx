'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Rocket, Sparkles, ArrowRight } from 'lucide-react';

interface ProjectSetupStepProps {
  onComplete: (projectName: string, projectDescription: string) => void;
  onSkip: () => void;
  displayName: string;
}

const NAME_MAX = 40;
const DESC_MAX = 120;

export function ProjectSetupStep({ onComplete, onSkip, displayName }: ProjectSetupStepProps) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setShowGreeting(true), 100);
    const t2 = setTimeout(() => setShowForm(true), 600);
    const t3 = setTimeout(() => setShowPreview(true), 900);
    const t4 = setTimeout(() => setShowCta(true), 1200);
    const t5 = setTimeout(() => nameInputRef.current?.focus(), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  const isReady = projectName.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!isReady || isSubmitting) return;
    setIsSubmitting(true);
    onComplete(projectName.trim(), projectDescription.trim());
  }, [isReady, isSubmitting, onComplete, projectName, projectDescription]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isReady) {
      e.preventDefault();
      handleSubmit();
    }
  }, [isReady, handleSubmit]);

  const previewName = projectName.trim() || 'Your Startup';
  const previewDesc = projectDescription.trim() || 'Ready to be pitched';
  const previewInitial = previewName[0]?.toUpperCase() || 'Y';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <style>{`
        @keyframes projectSetupGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes projectSetupPulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 89, 65, 0.15); }
          50% { box-shadow: 0 0 40px rgba(255, 89, 65, 0.3); }
        }
        @keyframes projectSetupFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes projectSetupShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="w-full max-w-[560px]">
        {/* Greeting */}
        <div
          className="mb-8 transition-all duration-700 ease-out"
          style={{
            opacity: showGreeting ? 1 : 0,
            transform: showGreeting ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: '#ffaa33' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ffaa33' }}>
              Almost there
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            Hey {displayName}, let&apos;s set up<br />
            <span style={{ color: '#ff5941' }}>your first project</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Every pitch lives under a project. Name yours and you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Form */}
          <div
            className="flex-1 transition-all duration-600 ease-out"
            style={{
              opacity: showForm ? 1 : 0,
              transform: showForm ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            {/* Project name field */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Project name
                </label>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: projectName.length > NAME_MAX ? '#ef4444' : 'var(--text-muted)' }}
                >
                  {projectName.length}/{NAME_MAX}
                </span>
              </div>
              <input
                ref={nameInputRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value.slice(0, NAME_MAX))}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Pitchr, Acme Corp"
                maxLength={NAME_MAX}
                className="w-full text-base px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ff5941'; e.target.style.backgroundColor = 'rgba(255, 89, 65, 0.04)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
              />
            </div>

            {/* Description field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  One-liner <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: projectDescription.length > DESC_MAX ? '#ef4444' : 'var(--text-muted)' }}
                >
                  {projectDescription.length}/{DESC_MAX}
                </span>
              </div>
              <input
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value.slice(0, DESC_MAX))}
                onKeyDown={handleKeyDown}
                placeholder="e.g. AI pitch coach for founders"
                maxLength={DESC_MAX}
                className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ff5941'; e.target.style.backgroundColor = 'rgba(255, 89, 65, 0.04)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
              />
            </div>
          </div>

          {/* Live preview card */}
          <div
            className="flex-shrink-0 w-full md:w-[200px] transition-all duration-600 ease-out"
            style={{
              opacity: showPreview ? 1 : 0,
              transform: showPreview ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-2 text-center md:text-left"
              style={{ color: 'var(--text-muted)' }}
            >
              Preview
            </p>
            <div
              className="rounded-2xl border p-4 transition-all duration-500"
              style={{
                borderColor: isReady ? 'rgba(255, 89, 65, 0.3)' : 'var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                animation: isReady ? 'projectSetupFloat 3s ease-in-out infinite, projectSetupPulseGlow 3s ease-in-out infinite' : 'none',
              }}
            >
              {/* Avatar / initial */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300"
                style={{
                  background: isReady
                    ? 'linear-gradient(135deg, #ff5941, #e63b26)'
                    : 'var(--bg-surface-hover, rgba(255,255,255,0.06))',
                  color: isReady ? 'white' : 'var(--text-muted)',
                }}
              >
                {previewInitial}
              </div>

              <h3
                className="text-sm font-semibold truncate transition-colors duration-300"
                style={{ color: isReady ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {previewName}
              </h3>
              <p
                className="text-[11px] mt-1 line-clamp-2 transition-colors duration-300"
                style={{ color: isReady ? 'var(--text-secondary)' : 'var(--text-muted)' }}
              >
                {previewDesc}
              </p>

              {/* Fake stat row */}
              <div
                className="flex items-center gap-2 mt-3 pt-3 transition-all duration-500"
                style={{ borderTop: '1px solid var(--border-color)' }}
              >
                <Rocket
                  size={12}
                  className="transition-colors duration-300"
                  style={{ color: isReady ? '#ff5941' : 'var(--text-muted)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {isReady ? '0 sessions — let\u2019s change that' : 'Waiting for a name...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div
          className="mt-8 flex flex-col items-center gap-3 transition-all duration-500 ease-out"
          style={{
            opacity: showCta ? 1 : 0,
            transform: showCta ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isReady || isSubmitting}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: isReady
                ? 'linear-gradient(135deg, #ff5941, #e63b26, #ff5941)'
                : 'rgba(255, 89, 65, 0.3)',
              backgroundSize: '200% 200%',
              animation: isReady ? 'projectSetupGradientShift 3s ease infinite' : 'none',
              boxShadow: isReady ? '0 0 24px rgba(255, 89, 65, 0.25)' : 'none',
              cursor: isReady ? 'pointer' : 'default',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <Rocket size={17} />
            Create & Start Pitching
            <ArrowRight size={17} />
          </button>

          <button
            onClick={onSkip}
            className="text-sm transition-opacity hover:opacity-80 underline-offset-2 hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            I&apos;ll set this up later
          </button>
        </div>
      </div>
    </div>
  );
}
