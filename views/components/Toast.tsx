'use client';

import { createContext, useCallback, useContext, useState, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  dismissing: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ComponentType<{ size?: number }>> = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<ToastType, { icon: string; border: string; bg: string }> = {
  error: { icon: '#ef4444', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)' },
  success: { icon: '#22c55e', border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.08)' },
  info: { icon: '#3b82f6', border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.08)' },
  warning: { icon: '#f59e0b', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)' },
};

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, dismissing: false }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const colors = COLORS[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300"
              style={{
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: colors.border,
                opacity: t.dismissing ? 0 : 1,
                transform: t.dismissing ? 'translateX(120%)' : 'translateX(0)',
                animation: t.dismissing ? undefined : 'toastSlideIn 0.3s ease-out',
              }}
            >
              <div
                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
                style={{ backgroundColor: colors.bg }}
              >
                <Icon size={14} />
              </div>
              <p
                className="flex-1 text-sm leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
