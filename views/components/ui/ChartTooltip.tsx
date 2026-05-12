'use client';

import { createPortal } from 'react-dom';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useTransitionStyles,
  type Placement,
} from '@floating-ui/react';

export interface CursorPosition {
  x: number;
  y: number;
}

interface ChartTooltipProps {
  anchorEl: Element | null;
  content: React.ReactNode;
  visible: boolean;
  placement?: Placement;
  offset?: number;
  cursorPosition?: CursorPosition | null;
}

export function ChartTooltip({
  anchorEl,
  content,
  visible,
  placement = 'top',
  offset: offsetPx = 12,
  cursorPosition = null,
}: ChartTooltipProps) {
  const isCursorMode = Boolean(cursorPosition);
  const isOpen = visible && (Boolean(anchorEl) || isCursorMode);
  const placementForCursor = isCursorMode ? 'top' : placement;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen && !isCursorMode,
    placement: placementForCursor,
    elements: { reference: isCursorMode ? undefined : anchorEl },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetPx),
      flip({ padding: 16 }),
      shift({ padding: 16 }),
    ],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 150,
    initial: { opacity: 0, transform: 'translateY(4px)' },
  });

  if (!visible || (!anchorEl && !cursorPosition)) return null;
  if (!isCursorMode && !isMounted) return null;

  const tooltip = (
    <div
      ref={isCursorMode ? undefined : refs.setFloating}
      style={{
        position: isCursorMode ? 'fixed' : 'absolute',
        zIndex: 10000,
        ...(isCursorMode
          ? {
              left: cursorPosition!.x,
              top: cursorPosition!.y - offsetPx,
              transform: 'translate(-50%, -100%)',
            }
          : {
              ...floatingStyles,
              ...transitionStyles,
            }),
      }}
      role="tooltip"
    >
      <div
        className="rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-md"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {content}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(tooltip, document.body)
    : null;
}
