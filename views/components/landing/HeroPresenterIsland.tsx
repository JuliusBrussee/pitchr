'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/views/components/ThemeProvider';
import { HeroPresenterTiles } from '@/views/components/landing/HeroPresenterTiles';
import {
  resolveTileDensityTier,
} from '@/views/components/landing/heroDeliveryFunnel.config';
import { HERO_PRESENTER_TILE_TUPLES } from '@/views/components/landing/heroPresenterTiles.data';

/**
 * Self-contained client island that wraps HeroPresenterTiles.
 * Reads theme from context and manages tile cap internally.
 */
export function HeroPresenterIsland() {
  const { isDark } = useTheme();
  const [tileCap, setTileCap] = useState(180);

  useEffect(() => {
    let frame = 0;

    const applyTileCap = () => {
      const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4);
      const cores = Number(navigator.hardwareConcurrency ?? 4);
      const density = resolveTileDensityTier({
        tileCount: HERO_PRESENTER_TILE_TUPLES.length,
        viewportWidth: window.innerWidth,
        deviceMemory: memory,
        hardwareConcurrency: cores,
      });
      setTileCap(density.targetCount);
    };

    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyTileCap);
    };

    applyTileCap();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <HeroPresenterTiles
      isDark={isDark}
      maxRenderTiles={tileCap}
      ref={(node) => {
        // Expose via data attribute so LandingEffects can find it
        if (node) {
          node.setAttribute('data-hero-presenter', '');
        }
      }}
    />
  );
}
