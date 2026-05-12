'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  HERO_PRESENTER_SOURCE_HEIGHT,
  HERO_PRESENTER_SOURCE_WIDTH,
  HERO_PRESENTER_TILE_SIZE,
  HERO_PRESENTER_TILE_TUPLES,
} from '@/views/components/landing/heroPresenterTiles.data';
import {
  getHeroPresenterPartByTileIndex,
  getHeroPresenterTileSeed,
} from '@/views/components/landing/heroPresenterParts.data';
import type {
  HeroPresenterTilesController,
  HeroPresenterPartName,
  HeroPresenterTilesState,
  HeroTileCommandName,
  HeroTileCommandOptions,
} from '@/types/heroPresenterTiles';

type HeroPresenterTilesProps = {
  isDark: boolean;
  maxRenderTiles?: number;
};

type GsapInstance = (typeof import('gsap'))['default'];

type ComputedTile = {
  id: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  lightFill: string;
  darkFill: string;
  weight: number;
  part: HeroPresenterPartName;
  seed: number;
  distance: number;
  angle: number;
};

const DEFAULT_DURATION = {
  assemble: 0.55,
  explode: 0.95,
  swirl: 0.9,
  wave: 0.8,
} as const;

const DEFAULT_EASE = {
  assemble: 'power3.out',
  explode: 'power2.out',
  swirl: 'sine.inOut',
  wave: 'sine.inOut',
} as const;

const DEFAULT_STAGGER = 0.0012;

function sampleTiles<T>(items: T[], count: number) {
  if (count <= 0 || items.length === 0) {
    return [] as T[];
  }

  if (count >= items.length) {
    return [...items];
  }

  const sampled: T[] = [];
  const stride = items.length / count;
  for (let index = 0; index < count; index += 1) {
    const pointer = Math.min(items.length - 1, Math.floor(index * stride));
    sampled.push(items[pointer]);
  }

  return sampled;
}

function toComputedTiles(maxRenderTiles?: number) {
  const base: ComputedTile[] = HERO_PRESENTER_TILE_TUPLES.map((tile, index) => {
    const [x, y, lightFill, darkFill, weight] = tile;
    return {
      id: index,
      x,
      y,
      cx: x + (HERO_PRESENTER_TILE_SIZE / 2),
      cy: y + (HERO_PRESENTER_TILE_SIZE / 2),
      lightFill,
      darkFill,
      weight,
      part: getHeroPresenterPartByTileIndex(index),
      seed: getHeroPresenterTileSeed(index, x, y),
      distance: 0,
      angle: 0,
    };
  });

  const renderCount = typeof maxRenderTiles === 'number'
    ? Math.max(1, Math.floor(maxRenderTiles))
    : base.length;
  const selected = sampleTiles(base, renderCount);

  const centroidX = selected.reduce((sum, tile) => sum + tile.cx, 0) / selected.length;
  const centroidY = selected.reduce((sum, tile) => sum + tile.cy, 0) / selected.length;

  let maxDistance = 1;
  for (const tile of selected) {
    const dx = tile.cx - centroidX;
    const dy = tile.cy - centroidY;
    const distance = Math.hypot(dx, dy);
    tile.distance = distance;
    tile.angle = Math.atan2(dy, dx);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  }

  return { tiles: selected, centroidX, centroidY, maxDistance };
}

export const HeroPresenterTiles = forwardRef<HTMLDivElement, HeroPresenterTilesProps>(
  function HeroPresenterTiles({ isDark, maxRenderTiles }, forwardedRef) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const tileRefs = useRef<Array<SVGRectElement | null>>([]);
    const gsapRef = useRef<GsapInstance | null>(null);
    const timelineRef = useRef<ReturnType<GsapInstance['timeline']> | null>(null);
    const activeCommandRef = useRef<HeroTileCommandName>('assemble');
    const reducedMotionRef = useRef(false);

    const { tiles, centroidX, centroidY, maxDistance } = useMemo(
      () => toComputedTiles(maxRenderTiles),
      [maxRenderTiles]
    );

    const setRootRef = useCallback((node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (!forwardedRef) {
        return;
      }
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        forwardedRef.current = node;
      }
    }, [forwardedRef]);

    const killTimeline = useCallback(() => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    }, []);

    const withGsap = useCallback(async (callback: (gsap: GsapInstance) => void) => {
      if (!gsapRef.current) {
        const gsapModule = await import('gsap');
        gsapRef.current = gsapModule.default;
      }
      callback(gsapRef.current);
    }, []);

    const runCommand = useCallback((name: HeroTileCommandName, options: HeroTileCommandOptions = {}) => {
      const nodes = tileRefs.current.filter((node): node is SVGRectElement => Boolean(node));
      if (nodes.length === 0) {
        return;
      }

      activeCommandRef.current = name;
      killTimeline();
      void withGsap((gsap) => {
        const duration = reducedMotionRef.current
          ? 0
          : options.duration ?? DEFAULT_DURATION[name];
        const ease = options.ease ?? DEFAULT_EASE[name];
        const stagger = options.stagger ?? DEFAULT_STAGGER;

        if (name === 'assemble') {
          timelineRef.current = gsap.timeline().to(nodes, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration,
            ease,
            stagger,
          });
          return;
        }

        if (name === 'explode') {
          const radius = options.radius ?? 88;
          const randomness = options.randomness ?? 20;
          timelineRef.current = gsap.timeline().to(nodes, {
            x: (index: number) => {
              const tile = tiles[index];
              const distanceRatio = tile.distance / maxDistance;
              const drift = radius * (0.35 + (distanceRatio * 0.65));
              const jitter = (((tile.seed * 2) - 1) * randomness);
              return (Math.cos(tile.angle) * drift) + jitter;
            },
            y: (index: number) => {
              const tile = tiles[index];
              const distanceRatio = tile.distance / maxDistance;
              const drift = radius * (0.35 + (distanceRatio * 0.65));
              const secondarySeed = ((tile.seed * 1.6180339887) % 1);
              const jitter = (((secondarySeed * 2) - 1) * randomness);
              return (Math.sin(tile.angle) * drift) + jitter;
            },
            rotation: (index: number) => ((tiles[index].seed - 0.5) * 56),
            scale: (index: number) => 0.88 + (tiles[index].weight * 0.35),
            opacity: (index: number) => 0.55 + (tiles[index].weight * 0.45),
            duration,
            ease,
            stagger,
          });
          return;
        }

        if (name === 'swirl') {
          const rotations = options.rotations ?? 1.25;
          const radius = options.radius ?? 36;
          timelineRef.current = gsap.timeline().to(nodes, {
            x: (index: number) => {
              const tile = tiles[index];
              const dx = tile.cx - centroidX;
              const turn = rotations * Math.PI * 2 * (1 - (tile.distance / maxDistance));
              const nextAngle = tile.angle + turn;
              const nextX = Math.cos(nextAngle) * tile.distance;
              return (nextX - dx) + (Math.cos(nextAngle) * radius * 0.16);
            },
            y: (index: number) => {
              const tile = tiles[index];
              const dy = tile.cy - centroidY;
              const turn = rotations * Math.PI * 2 * (1 - (tile.distance / maxDistance));
              const nextAngle = tile.angle + turn;
              const nextY = Math.sin(nextAngle) * tile.distance;
              return (nextY - dy) + (Math.sin(nextAngle) * radius * 0.16);
            },
            rotation: (index: number) => {
              const tile = tiles[index];
              return rotations * 130 * (1 - (tile.distance / maxDistance));
            },
            scale: (index: number) => 0.94 + (tiles[index].weight * 0.2),
            opacity: 1,
            duration,
            ease,
            stagger,
          });
          return;
        }

        const amplitude = options.amplitude ?? 17;
        const frequency = options.frequency ?? 0.085;
        timelineRef.current = gsap.timeline().to(nodes, {
          x: (index: number) => {
            const tile = tiles[index];
            return Math.sin((tile.y * frequency) + (index * frequency)) * (amplitude * 0.45);
          },
          y: (index: number) => {
            const tile = tiles[index];
            return Math.cos((tile.x * frequency) + (index * frequency)) * amplitude;
          },
          rotation: (index: number) => Math.sin(index * frequency) * 10,
          scale: 1,
          opacity: 1,
          duration,
          ease,
          stagger: stagger * 0.75,
        });
      });
    }, [centroidX, centroidY, killTimeline, maxDistance, tiles, withGsap]);

    const reset = useCallback(() => {
      runCommand('assemble', { duration: DEFAULT_DURATION.assemble });
    }, [runCommand]);

    const getState = useCallback((): HeroPresenterTilesState => ({
      activeCommand: activeCommandRef.current,
      tileCount: tiles.length,
      isDark,
      reducedMotion: reducedMotionRef.current,
    }), [isDark, tiles.length]);

    useEffect(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const applyPreference = () => {
        reducedMotionRef.current = media.matches;
      };
      applyPreference();

      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', applyPreference);
        return () => media.removeEventListener('change', applyPreference);
      }

      media.addListener(applyPreference);
      return () => media.removeListener(applyPreference);
    }, []);

    useEffect(() => {
      const nodes = tileRefs.current.filter((node): node is SVGRectElement => Boolean(node));
      if (nodes.length === 0) {
        return;
      }
      void withGsap((gsap) => {
        gsap.set(nodes, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          transformOrigin: '50% 50%',
        });
      });
    }, [withGsap]);

    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      const controller: HeroPresenterTilesController = {
        command: runCommand,
        reset,
        getState,
      };

      window.pitchrHeroTiles = controller;

      return () => {
        if (window.pitchrHeroTiles === controller) {
          delete window.pitchrHeroTiles;
        }
        killTimeline();
      };
    }, [getState, killTimeline, reset, runCommand]);

    return (
      <div className="hero-presenter-layer" ref={setRootRef} aria-hidden="true">
        <svg
          className="hero-presenter-svg"
          viewBox={`0 0 ${HERO_PRESENTER_SOURCE_WIDTH} ${HERO_PRESENTER_SOURCE_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          role="presentation"
          shapeRendering="crispEdges"
        >
          {tiles.map((tile, index) => (
            <rect
              key={tile.id}
              ref={(node) => {
                if (node) {
                  tileRefs.current[index] = node;
                } else {
                  tileRefs.current[index] = null;
                }
              }}
              className="hero-presenter-tile"
              data-hero-presenter-tile=""
              data-tile-id={tile.id}
              data-part={tile.part}
              data-base-x={tile.x}
              data-base-y={tile.y}
              data-weight={tile.weight}
              x={tile.x}
              y={tile.y}
              width={HERO_PRESENTER_TILE_SIZE}
              height={HERO_PRESENTER_TILE_SIZE}
              fill={isDark ? tile.darkFill : tile.lightFill}
            />
          ))}
        </svg>
      </div>
    );
  }
);
