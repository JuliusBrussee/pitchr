'use client';

import { useEffect, type MutableRefObject } from 'react';
import type { HeroPresenterPartName } from '@/types/heroPresenterTiles';
import {
  DELIVERY_WAVE_BARS,
  mapDeliveryPower,
} from '@/views/components/landing/heroDeliveryFunnel.config';

type LandingHeroDeliveryFunnelRefs = {
  landingRef: MutableRefObject<HTMLDivElement | null>;
  heroSectionRef: MutableRefObject<HTMLElement | null>;
  heroInnerRef: MutableRefObject<HTMLDivElement | null>;
  heroBgBaseRef: MutableRefObject<HTMLDivElement | null>;
  heroPresenterRef: MutableRefObject<HTMLDivElement | null>;
  heroSpotlightRef: MutableRefObject<HTMLDivElement | null>;
  heroMicPulseRef: MutableRefObject<HTMLDivElement | null>;
  heroScrollRef: MutableRefObject<HTMLDivElement | null>;
  deliverySectionRef: MutableRefObject<HTMLElement | null>;
  deliveryVisualRef: MutableRefObject<HTMLDivElement | null>;
  deliveryWaveRef: MutableRefObject<SVGSVGElement | null>;
  deliveryTranscriptRef: MutableRefObject<HTMLDivElement | null>;
  enabled?: boolean;
};

type HeroTileSource = {
  id: number;
  x: number;
  y: number;
  weight: number;
  seed: number;
  part: HeroPresenterPartName;
};

type HeroTileMotion = {
  anticipationX: number;
  anticipationY: number;
  anticipationRotation: number;
  anticipationScale: number;
  funnelX: number;
  funnelY: number;
  funnelRotation: number;
  funnelScale: number;
  funnelOpacity: number;
  snapX: number;
  snapY: number;
  snapRotation: number;
  snapScale: number;
  snapOpacity: number;
  morphX: number;
  morphY: number;
  morphRotation: number;
  morphScale: number;
  morphOpacity: number;
  resolveX: number;
  resolveY: number;
  resolveRotation: number;
  resolveScale: number;
  resolveOpacity: number;
  trailX: number;
  trailY: number;
  trailOpacity: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const span = Math.max(0.0001, edge1 - edge0);
  const t = clamp01((value - edge0) / span);
  return t * t * (3 - (2 * t));
}

function parseTileValue(value: string | undefined, fallback = 0) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeTileSeed(id: number, x: number, y: number) {
  const raw = Math.sin(
    ((id + 1) * 12.9898)
      + (x * 0.01523)
      + (y * 0.00917)
  ) * 43758.5453;

  return raw - Math.floor(raw);
}

function sampleAnimatedNodeIndices(total: number, target: number) {
  if (target <= 0 || total <= 0) {
    return new Set<number>();
  }

  if (target >= total) {
    return new Set(Array.from({ length: total }, (_, index) => index));
  }

  const selected = new Set<number>();
  const stride = total / target;
  for (let step = 0; step < target; step += 1) {
    const index = Math.min(total - 1, Math.floor(step * stride));
    selected.add(index);
  }
  return selected;
}

function getMasterProgress(
  hero: HTMLElement,
  deliverySection: HTMLElement,
  viewportHeight: number,
  scrollY: number,
  endViewportRatio: number
) {
  const heroTop = hero.getBoundingClientRect().top + scrollY;
  const deliveryTop = deliverySection.getBoundingClientRect().top + scrollY;
  const start = heroTop;
  const end = deliveryTop - (viewportHeight * endViewportRatio);
  const range = Math.max(1, end - start);
  return clamp01((scrollY - start) / range);
}

export function useHeroDeliveryFunnel({
  landingRef,
  heroSectionRef,
  heroInnerRef,
  heroBgBaseRef,
  heroPresenterRef,
  heroSpotlightRef,
  heroMicPulseRef,
  heroScrollRef,
  deliverySectionRef,
  deliveryVisualRef,
  deliveryWaveRef,
  deliveryTranscriptRef,
  enabled = true,
}: LandingHeroDeliveryFunnelRefs) {
  useEffect(() => {
    const landing = landingRef.current;
    const hero = heroSectionRef.current;
    const heroBase = heroBgBaseRef.current;
    const heroPresenter = heroPresenterRef.current;
    const heroSpotlight = heroSpotlightRef.current;
    const heroMicPulse = heroMicPulseRef.current;
    const heroInner = heroInnerRef.current;
    const heroScroll = heroScrollRef.current;
    const deliverySection = deliverySectionRef.current;
    const deliveryVisual = deliveryVisualRef.current;
    const deliveryWave = deliveryWaveRef.current;
    const deliveryTranscript = deliveryTranscriptRef.current;

    if (
      !landing
      || !hero
      || !heroBase
      || !heroPresenter
      || !heroSpotlight
      || !heroMicPulse
      || !heroInner
      || !heroScroll
      || !deliverySection
      || !deliveryVisual
      || !deliveryWave
      || !deliveryTranscript
    ) {
      return;
    }

    if (!enabled) {
      landing.style.setProperty('--scene-blend', '0');
      deliverySection.classList.remove('is-wave-active');
      deliverySection.style.setProperty('--voice-power', '0');
      deliverySection.style.setProperty('--voice-amp', '0.58');
      return;
    }

    const setSceneBlend = (value: number) => {
      landing.style.setProperty('--scene-blend', clamp01(value).toFixed(4));
    };
    const sceneEndViewportRatio = 0.14;
    const setWaveActive = (isActive: boolean) => {
      deliverySection.classList.toggle('is-wave-active', isActive);
    };

    const applyDeliveryPower = (progress: number) => {
      const mapped = mapDeliveryPower(clamp01(progress));
      deliverySection.style.setProperty('--voice-power', mapped.power.toFixed(4));
      deliverySection.style.setProperty('--voice-amp', mapped.amp.toFixed(4));
    };

    const syncSceneByProgress = (masterProgress: number) => {
      const progress = clamp01(masterProgress);
      const blend = smoothstep(0.02, 0.9, progress);
      const power = smoothstep(0.58, 0.98, progress);
      setSceneBlend(blend);
      applyDeliveryPower(power);
      setWaveActive(power > 0.04);
    };

    syncSceneByProgress(0);

    const tileNodes = Array.from(
      heroPresenter.querySelectorAll<SVGRectElement>('[data-hero-presenter-tile]')
    );

    if (tileNodes.length === 0) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const onScroll = () => {
        const progress = getMasterProgress(
          hero,
          deliverySection,
          window.innerHeight,
          window.scrollY,
          sceneEndViewportRatio
        );
        syncSceneByProgress(progress);
        heroBase.style.opacity = `${0.62 - (smoothstep(0, 1, progress) * 0.16)}`;
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      return () => {
        window.removeEventListener('scroll', onScroll);
        syncSceneByProgress(0);
        setWaveActive(false);
      };
    }

    let cleanup: (() => void) | undefined;

    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.default;
      const { ScrollTrigger } = scrollTriggerModule;
      gsap.registerPlugin(ScrollTrigger);

      const presenterSvg = heroPresenter.querySelector('svg');
      const viewBox = presenterSvg?.viewBox.baseVal;
      const sourceWidth = viewBox?.width || 1536;
      const sourceHeight = viewBox?.height || 1024;
      const isMobile = window.innerWidth <= 900;

      const tileSourceByNode = new Map<SVGRectElement, HeroTileSource>();
      tileNodes.forEach((node, index) => {
        const id = parseTileValue(node.dataset.tileId, index);
        const x = parseTileValue(node.dataset.baseX, 0);
        const y = parseTileValue(node.dataset.baseY, 0);
        const weight = parseTileValue(node.dataset.weight, 0.5);
        const seed = computeTileSeed(id, x, y);
        const part = (node.dataset.part as HeroPresenterPartName | undefined) ?? 'torso';

        tileSourceByNode.set(node, {
          id,
          x,
          y,
          weight,
          seed,
          part,
        });
      });

      const animatedTargetCount = isMobile ? 96 : 180;
      const animatedIndexSet = sampleAnimatedNodeIndices(tileNodes.length, animatedTargetCount);
      const animatedEntries = tileNodes
        .map((node, index) => ({ node, index }))
        .filter((entry) => animatedIndexSet.has(entry.index))
        .map((entry) => ({
          node: entry.node,
          source: tileSourceByNode.get(entry.node),
        }))
        .filter((entry): entry is { node: SVGRectElement; source: HeroTileSource } => Boolean(entry.source));

      const animatedTileNodes = animatedEntries.map((entry) => entry.node);
      const animatedTileSource = animatedEntries.map((entry) => entry.source);
      if (animatedTileNodes.length === 0) {
        return;
      }

      const animatedNodeSet = new Set(animatedTileNodes);
      const passiveTileNodes = tileNodes.filter((node) => !animatedNodeSet.has(node));

      const waveformRegion = {
        x: sourceWidth * 0.664,
        y: sourceHeight * 0.67,
        width: sourceWidth * 0.24,
        height: sourceHeight * 0.16,
      };
      const transcriptRegion = {
        x: sourceWidth * 0.58,
        y: sourceHeight * 0.76,
        width: sourceWidth * 0.28,
        height: sourceHeight * 0.13,
      };
      const funnelTop = {
        x: sourceWidth * 0.73,
        y: sourceHeight * 0.24,
      };
      const funnelThroat = {
        x: sourceWidth * 0.745,
        y: sourceHeight * 0.56,
      };
      const laneCount = 12;
      const laneCenter = (laneCount - 1) / 2;

      const tileMotion: HeroTileMotion[] = animatedTileSource.map((tile, index) => {
        const seed = tile.seed;
        const phase = (seed * Math.PI * 2)
          + (tile.x * 0.0045)
          + (tile.y * 0.0032);
        const lane = tile.id % laneCount;
        const laneOffset = lane - laneCenter;
        const ring = (index % 7) + 1;
        const partBias = tile.part === 'mic'
          ? 1.3
          : tile.part === 'head'
            ? 1.15
            : tile.part === 'highlights'
              ? 1.08
              : 1;
        const anticipationX = Math.sin(phase) * (4.4 + (seed * 2.2));
        const anticipationY = (Math.cos(phase * 0.85) * (3 + (seed * 1.4))) - (partBias * 1.1);
        const anticipationRotation = (seed - 0.5) * 8;
        const anticipationScale = 0.992 + (seed * 0.022);

        const orbitRadius = (34 + (ring * 11)) * (1 + (seed * 0.42));
        const funnelAbsX = funnelTop.x
          + (laneOffset * 13)
          + (Math.cos(phase + (lane * 0.2)) * orbitRadius);
        const funnelAbsY = funnelTop.y
          + (lane * 19)
          + (Math.sin((phase * 0.82) + (lane * 0.33)) * orbitRadius * 0.46);

        const snapAbsX = funnelThroat.x + (laneOffset * 5.8) + (Math.sin(phase * 1.4) * 4.2);
        const snapAbsY = (funnelThroat.y - 176) + (lane * 15.2) + (Math.cos(phase * 1.25) * 4.8);

        const waveRole = tile.part === 'mic'
          || tile.part === 'head'
          || tile.part === 'highlights'
          || (tile.part === 'leadArm' && seed > 0.38);

        let morphAbsX = snapAbsX;
        let morphAbsY = snapAbsY;
        let morphScale = 0.88 + (seed * 0.22);
        let morphOpacity = 0.64 + (seed * 0.32);
        let morphRotation = (seed - 0.5) * 14;

        let resolveAbsX = morphAbsX;
        let resolveAbsY = morphAbsY;
        let resolveScale = morphScale;
        let resolveOpacity = morphOpacity;
        let resolveRotation = morphRotation;

        if (waveRole) {
          const bar = DELIVERY_WAVE_BARS[tile.id % DELIVERY_WAVE_BARS.length];
          const barX = waveformRegion.x + ((bar.x / 400) * waveformRegion.width);
          const barTop = waveformRegion.y + ((bar.y / 100) * waveformRegion.height);
          const barBottom = waveformRegion.y + (((bar.y + bar.h) / 100) * waveformRegion.height);
          const stripe = (((tile.id * 7) % 10) + (seed * 1.4)) / 10;

          morphAbsX = barX + ((seed - 0.5) * 7.2);
          morphAbsY = barBottom - (stripe * (barBottom - barTop));
          morphScale = 0.9 + (seed * 0.22);
          morphOpacity = 0.74 + (seed * 0.2);
          morphRotation = (seed - 0.5) * 10;

          resolveAbsX = barX + ((seed - 0.5) * 2.4);
          resolveAbsY = morphAbsY + (Math.sin((seed * Math.PI * 2) + (bar.x * 0.12)) * 2.2);
          resolveScale = 0.92 + (seed * 0.16);
          resolveOpacity = 0.82 + (seed * 0.14);
          resolveRotation = (seed - 0.5) * 5.2;
        } else if (tile.id % 3 === 0) {
          const baselineProgress = (((tile.id * 11) % 100) + (seed * 100)) / 100;
          const baselineY = waveformRegion.y + waveformRegion.height + 3;
          morphAbsX = waveformRegion.x + (baselineProgress * waveformRegion.width);
          morphAbsY = baselineY + ((tile.id % 5) - 2) * 2;
          morphScale = 0.7 + (seed * 0.2);
          morphOpacity = 0.44 + (seed * 0.28);
          morphRotation = (seed - 0.5) * 6.2;

          resolveAbsX = morphAbsX;
          resolveAbsY = morphAbsY - (4 + (seed * 2.6));
          resolveScale = morphScale * 0.95;
          resolveOpacity = Math.min(0.84, morphOpacity + 0.12);
          resolveRotation = morphRotation * 0.5;
        } else {
          const edgeProgress = (((tile.id * 13) % 100) + (seed * 100)) / 100;
          const edgeIndex = tile.id % 4;
          if (edgeIndex === 0) {
            morphAbsX = transcriptRegion.x + (edgeProgress * transcriptRegion.width);
            morphAbsY = transcriptRegion.y;
          } else if (edgeIndex === 1) {
            morphAbsX = transcriptRegion.x + transcriptRegion.width;
            morphAbsY = transcriptRegion.y + (edgeProgress * transcriptRegion.height);
          } else if (edgeIndex === 2) {
            morphAbsX = transcriptRegion.x + ((1 - edgeProgress) * transcriptRegion.width);
            morphAbsY = transcriptRegion.y + transcriptRegion.height;
          } else {
            morphAbsX = transcriptRegion.x;
            morphAbsY = transcriptRegion.y + ((1 - edgeProgress) * transcriptRegion.height);
          }

          morphScale = 0.66 + (seed * 0.16);
          morphOpacity = 0.3 + (seed * 0.28);
          morphRotation = (seed - 0.5) * 8.8;
          resolveAbsX = morphAbsX;
          resolveAbsY = morphAbsY;
          resolveScale = morphScale * 0.92;
          resolveOpacity = Math.min(0.7, morphOpacity + 0.08);
          resolveRotation = morphRotation * 0.35;
        }

        const trailDrop = (52 + (seed * 88))
          + (tile.part === 'legs' ? 34 : 0)
          + (tile.part === 'mic' ? 12 : 0);
        const trailAbsX = resolveAbsX + (Math.sin((phase * 1.1) + (seed * Math.PI)) * 7);
        const trailAbsY = resolveAbsY + trailDrop;
        const trailOpacity = Math.max(
          waveRole ? 0.32 : 0.2,
          resolveOpacity - (0.18 + (seed * 0.12))
        );

        return {
          anticipationX,
          anticipationY,
          anticipationRotation,
          anticipationScale,
          funnelX: funnelAbsX - tile.x,
          funnelY: funnelAbsY - tile.y,
          funnelRotation: ((seed - 0.5) * 56) + (laneOffset * 1.25),
          funnelScale: 0.92 + (seed * 0.2),
          funnelOpacity: 0.66 + (seed * 0.28),
          snapX: snapAbsX - tile.x,
          snapY: snapAbsY - tile.y,
          snapRotation: ((seed - 0.5) * 22) + (laneOffset * 0.8),
          snapScale: 0.86 + (seed * 0.2),
          snapOpacity: 0.74 + (seed * 0.2),
          morphX: morphAbsX - tile.x,
          morphY: morphAbsY - tile.y,
          morphRotation,
          morphScale,
          morphOpacity,
          resolveX: resolveAbsX - tile.x,
          resolveY: resolveAbsY - tile.y,
          resolveRotation,
          resolveScale,
          resolveOpacity,
          trailX: trailAbsX - tile.x,
          trailY: trailAbsY - tile.y,
          trailOpacity,
        };
      });

      gsap.set(heroBase, {
        transformOrigin: '50% 50%',
        yPercent: 0,
        scale: 1,
        autoAlpha: 0.62,
      });
      gsap.set(heroPresenter, {
        transformOrigin: '72% 42%',
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
      });
      gsap.set(heroSpotlight, {
        transformOrigin: '50% 50%',
        autoAlpha: 0.2,
        scale: 1,
      });
      gsap.set(heroMicPulse, {
        autoAlpha: 0,
        scale: 0.82,
      });
      gsap.set(heroInner, {
        yPercent: 0,
        autoAlpha: 1,
      });
      gsap.set(heroScroll, {
        autoAlpha: 1,
        y: 0,
      });
      gsap.set(animatedTileNodes, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
      });
      if (passiveTileNodes.length > 0) {
        gsap.set(passiveTileNodes, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 0.98,
        });
      }
      gsap.set(deliveryVisual, {
        transformOrigin: '50% 50%',
        scale: 0.968,
      });
      gsap.set(deliveryWave, {
        transformOrigin: '50% 70%',
        scale: 0.9,
        autoAlpha: 0.78,
      });
      gsap.set(deliveryTranscript, {
        autoAlpha: 0.78,
        y: 8,
      });

      const tileStagger = animatedTileNodes.length >= 280
        ? 0.0007
        : animatedTileNodes.length >= 180
          ? 0.001
          : 0.0013;

      const funnelTimeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          endTrigger: deliverySection,
          end: 'top 14%',
          scrub: isMobile ? 0.28 : 0.22,
          pin: false,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            syncSceneByProgress(self.progress);
          },
          onLeaveBack: () => {
            syncSceneByProgress(0);
          },
        },
      });

      funnelTimeline
        .to(heroScroll, { autoAlpha: 0, y: -16, duration: 0.12 }, 0)
        .to(heroBase, { yPercent: -10, scale: 1.06, autoAlpha: 0.74, duration: 0.45 }, 0.05)
        .to(heroSpotlight, { autoAlpha: 0.5, scale: 1.18, xPercent: -5, yPercent: 12, duration: 0.24 }, 0.08)
        .to(heroPresenter, {
          xPercent: -3.6,
          yPercent: -2.1,
          rotation: -1.05,
          scale: 1.03,
          duration: 0.2,
        }, 0.1)
        .to(heroMicPulse, { autoAlpha: 0.72, scale: 1.06, duration: 0.1 }, 0.14)
        .to(heroMicPulse, { autoAlpha: 0.14, scale: 1.48, duration: 0.16 }, 0.31)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].anticipationX,
          y: (index: number) => tileMotion[index].anticipationY,
          rotation: (index: number) => tileMotion[index].anticipationRotation,
          scale: (index: number) => tileMotion[index].anticipationScale,
          opacity: 1,
          duration: 0.1,
          ease: 'sine.out',
          stagger: tileStagger,
        }, 0)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].funnelX,
          y: (index: number) => tileMotion[index].funnelY,
          rotation: (index: number) => tileMotion[index].funnelRotation,
          scale: (index: number) => tileMotion[index].funnelScale,
          opacity: (index: number) => tileMotion[index].funnelOpacity,
          duration: 0.34,
          ease: 'power2.inOut',
          stagger: tileStagger * 1.1,
        }, 0.1)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].snapX,
          y: (index: number) => tileMotion[index].snapY,
          rotation: (index: number) => tileMotion[index].snapRotation,
          scale: (index: number) => tileMotion[index].snapScale,
          opacity: (index: number) => tileMotion[index].snapOpacity,
          duration: 0.13,
          ease: 'back.out(1.45)',
          stagger: tileStagger * 0.72,
        }, 0.44)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].morphX,
          y: (index: number) => tileMotion[index].morphY,
          rotation: (index: number) => tileMotion[index].morphRotation,
          scale: (index: number) => tileMotion[index].morphScale,
          opacity: (index: number) => tileMotion[index].morphOpacity,
          duration: 0.27,
          ease: 'power2.out',
          stagger: tileStagger,
        }, 0.55)
        .to(heroInner, { yPercent: -7, autoAlpha: 0.72, duration: 0.2 }, 0.64)
        .to(deliveryVisual, { scale: 1.01, duration: 0.2, ease: 'power2.out' }, 0.72)
        .to(deliveryWave, { scale: 1, autoAlpha: 1, duration: 0.24, ease: 'power2.out' }, 0.74)
        .to(deliveryTranscript, { y: 0, autoAlpha: 1, duration: 0.2, ease: 'power2.out' }, 0.78)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].resolveX,
          y: (index: number) => tileMotion[index].resolveY,
          rotation: (index: number) => tileMotion[index].resolveRotation,
          scale: (index: number) => tileMotion[index].resolveScale,
          opacity: (index: number) => tileMotion[index].resolveOpacity,
          duration: 0.13,
          ease: 'power2.inOut',
          stagger: tileStagger * 0.58,
        }, 0.84)
        .to(animatedTileNodes, {
          x: (index: number) => tileMotion[index].trailX,
          y: (index: number) => tileMotion[index].trailY,
          opacity: (index: number) => tileMotion[index].trailOpacity,
          duration: 0.16,
          ease: 'sine.inOut',
          stagger: tileStagger * 0.52,
        }, 0.92)
        .to(heroPresenter, {
          xPercent: 5,
          yPercent: 4.2,
          scale: 1,
          autoAlpha: 0.46,
          duration: 0.18,
        }, 0.86)
        .to(heroBase, {
          autoAlpha: 0.46,
          yPercent: -13,
          duration: 0.16,
        }, 0.86);

      if (passiveTileNodes.length > 0) {
        funnelTimeline
          .to(passiveTileNodes, {
            y: 6,
            opacity: 0.82,
            duration: 0.22,
            ease: 'sine.out',
          }, 0.16)
          .to(passiveTileNodes, {
            y: 12,
            opacity: 0.58,
            duration: 0.24,
            ease: 'sine.inOut',
          }, 0.62)
          .to(passiveTileNodes, {
            y: 48,
            opacity: 0.42,
            duration: 0.18,
            ease: 'sine.in',
          }, 0.9);
      }

      cleanup = () => {
        funnelTimeline.scrollTrigger?.kill();
        funnelTimeline.kill();
        syncSceneByProgress(0);
        setWaveActive(false);
      };
    });

    return () => cleanup?.();
  }, [
    landingRef,
    heroSectionRef,
    heroInnerRef,
    heroBgBaseRef,
    heroPresenterRef,
    heroSpotlightRef,
    heroMicPulseRef,
    heroScrollRef,
    deliverySectionRef,
    deliveryVisualRef,
    deliveryWaveRef,
    deliveryTranscriptRef,
    enabled,
  ]);
}
