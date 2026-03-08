'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CancelConfirmModalProps {
  periodEnd: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function CancelConfirmModal({ periodEnd, onConfirm, onClose }: CancelConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formattedDate = new Date(periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 89, 65, 0.12)' }}
          >
            <AlertTriangle size={24} style={{ color: '#ff5941' }} />
          </div>

          <div>
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Cancel Subscription?
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your Pro features will remain active until{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formattedDate}
              </span>
              . After that, your account will switch to the Free plan.
            </p>
          </div>

          <div
            className="w-full rounded-xl p-3 text-left text-xs space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <p>After cancellation you will lose:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Unlimited pitch analyses</li>
              <li>Deck generation & uploads</li>
              <li>Extended Q&A sessions</li>
              <li>Priority queue access</li>
            </ul>
          </div>

          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
              style={{
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
              }}
            >
              Keep Plan
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ff5941' }}
            >
              {isLoading ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
