'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onSkip: () => void;
}

export function ProgressBar({ currentStep, totalSteps, onSkip }: ProgressBarProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Step counter */}
      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {currentStep + 1} / {totalSteps}
      </span>

      {/* Dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= currentStep ? '#ff5941' : 'transparent',
                border: i <= currentStep ? '2px solid #ff5941' : '2px solid var(--border-color)',
                transform: i === currentStep ? 'scale(1.2)' : 'scale(1)',
              }}
            />
            {i < totalSteps - 1 && (
              <div
                className="w-4 h-0.5 mx-0.5 transition-colors duration-300"
                style={{
                  backgroundColor: i < currentStep ? '#ff5941' : 'var(--border-color)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="text-xs font-medium transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        Skip
      </button>
    </div>
  );
}
