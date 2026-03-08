'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  onConfirm: (email: string, password: string) => Promise<void>;
}

export function DeleteAccountDialog({
  open,
  onClose,
  userEmail,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const emailMatches = email.toLowerCase() === userEmail.toLowerCase();
  const canSubmit = emailMatches && password.length > 0 && !isDeleting;

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setEmail('');
      setPassword('');
      setError('');
      onClose();
    }, 200);
  }, [onClose, isDeleting]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsDeleting(true);
    setError('');
    try {
      await onConfirm(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

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
        aria-labelledby="delete-account-dialog-title"
      >
        <div
          className={`w-full max-w-[420px] rounded-2xl border p-6 pointer-events-auto ${
            isOpen ? 'rdm-panel-enter' : 'rdm-panel-exit'
          }`}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
            >
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            </div>
            <h2
              id="delete-account-dialog-title"
              className="text-base font-semibold"
              style={{ color: '#ef4444' }}
            >
              Delete Account
            </h2>
          </div>

          <div
            className="text-sm mb-5 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            <p className="mb-2">This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <li>All pitch runs and analysis history</li>
              <li>Uploaded decks and recordings</li>
              <li>Credits and billing data</li>
              <li>Projects, settings, and all account data</li>
            </ul>
            <p className="mt-3 font-medium" style={{ color: '#ef4444' }}>
              This action cannot be undone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Type <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userEmail}</span> to confirm
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="off"
                disabled={isDeleting}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${emailMatches && email ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Enter your password to verify identity
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                disabled={isDeleting}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-30"
                style={{
                  backgroundColor: canSubmit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ef4444',
                }}
              >
                {isDeleting && (
                  <span
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: 'currentColor',
                      borderTopColor: 'transparent',
                    }}
                  />
                )}
                Delete my account
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
