'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isConfirming = false,
}: ConfirmDialogProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isConfirming) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose, isConfirming]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (isConfirming) return;
    try {
      await onConfirm();
      handleClose();
    } catch {
      // Leave dialog open so user can retry or cancel
    }
  }, [onConfirm, isConfirming, handleClose]);

  if (!open) return null;

  const isOpen = open && !isClosing;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 ${isOpen ? 'rdm-backdrop-enter' : 'rdm-backdrop-exit'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div
          className={`w-full max-w-[360px] rounded-2xl border p-5 pointer-events-auto ${
            isOpen ? 'rdm-panel-enter' : 'rdm-panel-exit'
          }`}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            id="confirm-dialog-title"
            className="text-base font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>
          {description && (
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
          {!description && <div className="mb-5" />}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isConfirming}
              className="px-4 py-2 rounded-xl border font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              style={
                variant === 'danger'
                  ? {
                      backgroundColor: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.5)',
                      color: '#ef4444',
                    }
                  : {
                      backgroundColor: 'var(--bg-surface-hover)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }
              }
            >
              {isConfirming && (
                <span
                  className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'currentColor',
                    borderTopColor: 'transparent',
                  }}
                />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
