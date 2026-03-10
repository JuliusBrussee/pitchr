'use client';

import { useState, useEffect } from 'react';

export type AnimationTier = 'full' | 'basic' | 'none';

export function useSolutionAnimations(): AnimationTier {
  const [tier, setTier] = useState<AnimationTier>('basic');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTier('none');
      return;
    }

    const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4);
    const cores = Number(navigator.hardwareConcurrency ?? 4);
    const isNarrow = window.innerWidth < 768;

    if (isNarrow || memory < 8 || cores < 8) {
      setTier('basic');
    } else {
      setTier('full');
    }
  }, []);

  return tier;
}
