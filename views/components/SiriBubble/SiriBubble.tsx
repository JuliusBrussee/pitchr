'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Orb } from './Orb';
import { SiriBubbleProps } from './types';
import { SIZE_MAP, DEFAULTS } from './constants';

export function resolveSize(
  size: SiriBubbleProps['size'],
  fluid: boolean
): { width: string; height: string } {
  if (fluid) return { width: '100%', height: '100%' };
  const px = typeof size === 'number' ? size : SIZE_MAP[size ?? 'md'];
  return { width: `${px}px`, height: `${px}px` };
}

function CSSFallback({ size, fluid }: { size: SiriBubbleProps['size']; fluid: boolean }) {
  const { width, height } = resolveSize(size, fluid);
  return (
    <div
      style={{ width, height, background: 'radial-gradient(circle, #ff5941, #e63b26, #1c1210)' }}
      className="rounded-full opacity-80 blur-sm animate-pulse"
    />
  );
}

export function SiriBubble({
  state,
  intensity = DEFAULTS.intensity,
  size = DEFAULTS.size,
  fluid = false,
  opacity = DEFAULTS.opacity,
  className,
}: SiriBubbleProps) {
  const { width, height } = resolveSize(size, fluid);

  return (
    <div className={className} style={{ width, height }}>
      <Suspense fallback={<CSSFallback size={size} fluid={fluid} />}>
        <Canvas
          gl={{ alpha: true, premultipliedAlpha: false, antialias: true }}
          camera={{ position: [0, 0, 3], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Orb state={state} intensity={intensity} opacity={opacity} />
        </Canvas>
      </Suspense>
    </div>
  );
}
