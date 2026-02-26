'use client';

import { useContext } from 'react';
import { TutorialContext } from '@/views/components/TutorialProvider';
import type { TooltipType } from '@/views/components/SmartTooltip';
import type { Placement } from '@floating-ui/react';

export function useSmartTooltip() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useSmartTooltip must be used within a TutorialProvider');
  }

  return {
    showTooltip: (
      anchorEl: HTMLElement | null,
      type: TooltipType,
      message: string,
      placement?: Placement,
    ) => ctx.showTooltip(anchorEl, type, message, placement),
    hideTooltip: ctx.hideTooltip,
  };
}
