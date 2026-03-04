'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface PersonalizationStepProps {
  onComplete: (name: string, projectName: string, projectDescription: string) => void;
}

export function PersonalizationStep({ onComplete }: PersonalizationStepProps) {
  const [name, setName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showProject, setShowProject] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowProject(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const isReady = name.trim().length > 0 && projectName.trim().length > 0;

  const handleLaunch = () => {
    if (!isReady) return;
    onComplete(name.trim(), projectName.trim(), projectDescription.trim());
  };

  const handleSkipToDashboard = () => {
    onComplete(name.trim() || 'Founder', '', '');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="w-full max-w-[500px]">
        {/* Name input */}
        <label
          className="block text-xl font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          What should we call you?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          autoFocus
          className="w-full text-lg px-4 py-3 rounded-xl outline-none transition-all duration-200"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#ff5941'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
        />

        {/* Project creation fields */}
        <div
          className="mt-8 transition-all duration-500 ease-out"
          style={{
            opacity: showProject ? 1 : 0,
            transform: showProject ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          <p className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            What&apos;s your startup called?
          </p>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Pitchr, Acme Corp"
            className="w-full text-lg px-4 py-3 rounded-xl outline-none transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#ff5941'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
          />

          <p className="text-sm mt-4 mb-2" style={{ color: 'var(--text-secondary)' }}>
            Describe it in one line (optional)
          </p>
          <input
            type="text"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="e.g. AI pitch coach for founders"
            className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#ff5941'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
          />
        </div>

        {/* Launch section */}
        {isReady && (
          <div className="mt-8 text-center animate-fade-in-up">
            <p className="text-lg font-medium mb-6" style={{ color: 'var(--text-primary)' }}>
              Alright <span style={{ color: '#ff5941' }}>{name.trim()}</span>, let&apos;s find out where your pitch breaks.
            </p>

            <button
              onClick={handleLaunch}
              className="flex items-center gap-2 mx-auto px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ff5941, #e63b26)',
                boxShadow: '0 0 20px rgba(255, 89, 65, 0.3)',
              }}
            >
              Start My First Session
              <ArrowRight size={20} />
            </button>

            <button
              onClick={handleSkipToDashboard}
              className="mt-4 text-sm transition-opacity hover:opacity-80 underline-offset-2 hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              or explore the dashboard first
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
