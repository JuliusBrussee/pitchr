'use client';

import { useContext } from 'react';
import { TutorialContext } from '@/views/components/TutorialProvider';

export function useTutorial(pageKey?: string) {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }

  return {
    startTour: (key?: string) => ctx.startTour(key ?? pageKey ?? ''),
    nextStep: ctx.nextStep,
    skipTour: ctx.skipTour,
    isTourActive: ctx.isTourActive,
    currentStep: ctx.currentStep,
    currentPageKey: ctx.currentPageKey,
    registerPage: ctx.registerPage,
  };
}
