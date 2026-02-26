'use client';

import { useCallback, useContext, useMemo } from 'react';
import { TutorialContext } from '@/views/components/TutorialProvider';

export function useTutorial(pageKey?: string) {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }

  const startTour = useCallback(
    (key?: string) => ctx.startTour(key ?? pageKey ?? ''),
    [ctx.startTour, pageKey],
  );

  return useMemo(() => ({
    startTour,
    nextStep: ctx.nextStep,
    skipTour: ctx.skipTour,
    resetTours: ctx.resetTours,
    isTourActive: ctx.isTourActive,
    currentStep: ctx.currentStep,
    currentPageKey: ctx.currentPageKey,
    registerPage: ctx.registerPage,
  }), [startTour, ctx.nextStep, ctx.skipTour, ctx.resetTours, ctx.isTourActive, ctx.currentStep, ctx.currentPageKey, ctx.registerPage]);
}
