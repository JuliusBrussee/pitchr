'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCoachToast } from '@/hooks/useCoachToast';

interface CoachToastProps {
  pageKey: string;
}

export function CoachToast({ pageKey }: CoachToastProps) {
  const toast = useCoachToast(pageKey);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (toast) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [toast, shouldRender]);

  if (!shouldRender || !toast) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      toast.dismiss();
      setShouldRender(false);
    }, 150);
  };

  return (
    <div
      className="fixed z-50 transition-all ease-out
        bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[300px]"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(12px)' : 'translateY(0)',
        transitionDuration: isExiting ? '150ms' : '200ms',
        animation: !isExiting ? 'coachToastIn 200ms ease-out' : undefined,
      }}
    >
      <style>{`
        @keyframes coachToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes coachToastIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
          borderLeft: '3px solid #ff5941',
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
            {toast.message}
          </p>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Dismiss tip"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
