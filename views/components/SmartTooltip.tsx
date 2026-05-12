'use client';

import { useRef } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useTransitionStyles,
  type Placement,
} from '@floating-ui/react';
import { X, ChevronRight } from 'lucide-react';

export type TooltipType = 'error' | 'info' | 'tour';

interface TourControls {
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}

interface SmartTooltipProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  type: TooltipType;
  title?: string;
  message: string;
  placement?: Placement;
  onDismiss: () => void;
  tourControls?: TourControls;
}

const TYPE_STYLES: Record<TooltipType, { accent: string; accentBg: string }> = {
  error: { accent: '#ef4444', accentBg: 'rgba(239,68,68,0.08)' },
  info: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.08)' },
  tour: { accent: '#ff5941', accentBg: 'rgba(255,89,65,0.08)' },
};

export function SmartTooltip({
  anchorEl,
  open,
  type,
  title,
  message,
  placement: preferredPlacement = 'bottom',
  onDismiss,
  tourControls,
}: SmartTooltipProps) {
  const arrowRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: open && Boolean(anchorEl),
    placement: preferredPlacement,
    elements: { reference: anchorEl },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({ padding: 16 }),
      shift({ padding: 16 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 200,
    initial: { opacity: 0, transform: 'scale(0.95)' },
  });

  if (!isMounted || !anchorEl) return null;

  const styles = TYPE_STYLES[type];
  const isLastStep = tourControls && tourControls.step === tourControls.total;

  // Arrow positioning
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const side = context.placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const arrowSide: Record<string, string> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        ...transitionStyles,
        zIndex: 10001,
        maxWidth: 320,
      }}
      role={type === 'tour' ? 'dialog' : 'alert'}
      aria-label={title || 'Notification'}
    >
      <div
        className="rounded-xl border overflow-hidden shadow-lg"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border-color)',
          borderLeft: `3px solid ${styles.accent}`,
        }}
      >
        <div className="p-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            {title && (
              <h4
                className="text-xs font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h4>
            )}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-60 ml-auto"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>

          {/* Message */}
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {message}
          </p>

          {/* Tour controls */}
          {tourControls && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                {tourControls.step} / {tourControls.total}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={tourControls.onSkip}
                  className="text-[11px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Skip
                </button>
                <button
                  onClick={tourControls.onNext}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-90"
                  style={{
                    color: 'white',
                    backgroundColor: styles.accent,
                  }}
                >
                  {isLastStep ? 'Done' : 'Next'}
                  {!isLastStep && <ChevronRight size={11} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        ref={arrowRef}
        className="absolute w-2.5 h-2.5 rotate-45"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          left: arrowX != null ? `${arrowX}px` : undefined,
          top: arrowY != null ? `${arrowY}px` : undefined,
          [arrowSide[side]]: '-5px',
          borderBottom: side === 'top' ? '1px solid var(--border-color)' : undefined,
          borderRight: side === 'top' ? '1px solid var(--border-color)' : undefined,
          borderTop: side === 'bottom' ? '1px solid var(--border-color)' : undefined,
          borderLeft: side === 'bottom' ? '1px solid var(--border-color)' : undefined,
        }}
      />
    </div>
  );
}
