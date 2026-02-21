'use client';

import { useState, useCallback, useMemo } from 'react';
import { OrbState, SiriBubbleProps } from './types';
import { DEFAULTS } from './constants';

interface UseSiriBubbleReturn {
  props: Pick<SiriBubbleProps, 'state' | 'intensity'>;
  setState: (state: OrbState) => void;
  setIntensity: (intensity: number) => void;
}

export function useSiriBubble(
  initialState: OrbState = 'idle',
  initialIntensity: number = DEFAULTS.intensity
): UseSiriBubbleReturn {
  const [state, setState] = useState<OrbState>(initialState);
  const [intensity, setIntensityRaw] = useState(initialIntensity);

  const setIntensity = useCallback((v: number) => {
    setIntensityRaw(Math.max(0, Math.min(1, v)));
  }, []);

  const props = useMemo(() => ({ state, intensity }), [state, intensity]);

  return { props, setState, setIntensity };
}
