'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface PersonalizationStepProps {
  onNext: (name: string) => void;
}

export function PersonalizationStep({ onNext }: PersonalizationStepProps) {
  const [name, setName] = useState('');
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCta(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const isReady = name.trim().length > 0;

  const handleContinue = () => {
    if (!isReady) return;
    onNext(name.trim());
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
          onKeyDown={(e) => { if (e.key === 'Enter' && isReady) { e.preventDefault(); handleContinue(); } }}
        />

        {/* Continue button */}
        <div
          className="mt-8 text-center transition-all duration-500 ease-out"
          style={{
            opacity: showCta ? 1 : 0,
            transform: showCta ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {isReady && (
            <div className="animate-fade-in-up">
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#ff5941' }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
