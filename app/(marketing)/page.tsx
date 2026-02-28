'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { HeroPresenterPartName } from '@/types/heroPresenterTiles';
import { useTheme } from '@/views/components/ThemeProvider';
import { LandingPricing } from '@/views/components/landing/LandingPricing';
import { HeroPresenterTiles } from '@/views/components/landing/HeroPresenterTiles';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

const DELIVERY_WAVE_BARS = [
  { x: 20, y: 25, h: 50, d: 0.1 }, { x: 40, y: 10, h: 80, d: 0.3 },
  { x: 60, y: 30, h: 40, d: 0.5 }, { x: 80, y: 15, h: 70, d: 0.2 },
  { x: 100, y: 35, h: 30, d: 0.6 }, { x: 120, y: 5, h: 90, d: 0.1 },
  { x: 140, y: 20, h: 60, d: 0.4 }, { x: 160, y: 40, h: 20, d: 0.7 },
  { x: 180, y: 10, h: 80, d: 0.3 }, { x: 200, y: 25, h: 50, d: 0.5 },
  { x: 220, y: 15, h: 70, d: 0.2 }, { x: 240, y: 5, h: 90, d: 0.8 },
  { x: 260, y: 30, h: 40, d: 0.1 }, { x: 280, y: 20, h: 60, d: 0.4 },
  { x: 300, y: 10, h: 80, d: 0.6 }, { x: 320, y: 35, h: 30, d: 0.3 },
  { x: 340, y: 15, h: 70, d: 0.5 }, { x: 360, y: 25, h: 50, d: 0.2 },
] as const;

export default function LandingPage() {
  const { isDark, setTheme } = useTheme();
  const navRef = useRef<HTMLElement>(null);
  const radarPathRef = useRef<SVGPathElement>(null);
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const heroBgBaseRef = useRef<HTMLDivElement>(null);
  const heroPresenterRef = useRef<HTMLDivElement>(null);
  const heroSpotlightRef = useRef<HTMLDivElement>(null);
  const heroMicPulseRef = useRef<HTMLDivElement>(null);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const heroBridgeLayerRef = useRef<HTMLDivElement>(null);
  const heroBridgePrimaryRef = useRef<SVGPathElement>(null);
  const heroBridgeSecondaryRef = useRef<SVGPathElement>(null);
  const heroBridgePrimarySignalRef = useRef<SVGPathElement>(null);
  const heroBridgeSecondarySignalRef = useRef<SVGPathElement>(null);
  const deliverySectionRef = useRef<HTMLElement>(null);
  const deliveryVisualRef = useRef<HTMLDivElement>(null);
  const deliveryWaveRef = useRef<SVGSVGElement>(null);
  const deliveryTranscriptRef = useRef<HTMLDivElement>(null);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    setWaitlistStatus('loading');
    try {
      // Collect UTM params from current URL
      const params = new URLSearchParams(window.location.search);

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail.trim(),
          referrer: document.referrer || null,
          utm_source: params.get('utm_source') || null,
          utm_medium: params.get('utm_medium') || null,
          utm_campaign: params.get('utm_campaign') || null,
          landing_page: window.location.pathname,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setWaitlistStatus('success');
        setWaitlistMessage(data.message);
        setWaitlistEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMessage('Something went wrong. Please try again.');
    }
  }

  function scrollToWaitlist(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const handleScroll = useCallback(() => {
    if (!navRef.current) return;
    if (window.scrollY > 50) {
      navRef.current.classList.add('scrolled');
    } else {
      navRef.current.classList.remove('scrolled');
    }
  }, []);

  useEffect(() => {
    // Intersection Observer for reveals + SVG animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Radar chart: animate to perfect pentagon
            if (entry.target.id === 'radarReveal') {
              setTimeout(() => {
                radarPathRef.current?.setAttribute(
                  'd',
                  'M100,20 L176,75 L147,165 L53,165 L24,75 Z'
                );
              }, 300);
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.landing .reveal').forEach((el) => observer.observe(el));

    // Nav scroll effect
    window.addEventListener('scroll', handleScroll, { passive: true });

    // CTA hover glow tracking
    const ctaContainer = ctaContainerRef.current;
    const ctaGlow = ctaGlowRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ctaContainer || !ctaGlow) return;
      const rect = ctaContainer.getBoundingClientRect();
      ctaGlow.style.left = `${e.clientX - rect.left}px`;
      ctaGlow.style.top = `${e.clientY - rect.top}px`;
    };

    ctaContainer?.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      ctaContainer?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll]);

  useEffect(() => {
    const hero = heroSectionRef.current;
    const heroBase = heroBgBaseRef.current;
    const heroPresenter = heroPresenterRef.current;
    const heroSpotlight = heroSpotlightRef.current;
    const heroMicPulse = heroMicPulseRef.current;
    const heroInner = heroInnerRef.current;
    const heroScroll = heroScrollRef.current;
    const heroBridgeLayer = heroBridgeLayerRef.current;
    const heroBridgePrimary = heroBridgePrimaryRef.current;
    const heroBridgeSecondary = heroBridgeSecondaryRef.current;
    const heroBridgePrimarySignal = heroBridgePrimarySignalRef.current;
    const heroBridgeSecondarySignal = heroBridgeSecondarySignalRef.current;
    const deliverySection = deliverySectionRef.current;
    const deliveryVisual = deliveryVisualRef.current;
    const deliveryWave = deliveryWaveRef.current;
    const deliveryTranscript = deliveryTranscriptRef.current;

    if (
      !hero
      || !heroBase
      || !heroPresenter
      || !heroSpotlight
      || !heroMicPulse
      || !heroInner
      || !heroScroll
      || !heroBridgeLayer
      || !heroBridgePrimary
      || !heroBridgeSecondary
      || !heroBridgePrimarySignal
      || !heroBridgeSecondarySignal
      || !deliverySection
      || !deliveryVisual
      || !deliveryWave
      || !deliveryTranscript
    ) {
      return;
    }

    type HeroMotionConfig = {
      scrub: number;
      arcScale: number;
      liftScale: number;
      bridgeOpacity: number;
      signalIntensity: number;
      motifDepth: number;
    };

    type PresenterTileMetrics = {
      baseX: number;
      baseY: number;
      part: HeroPresenterPartName;
      seed: number;
      anticipationX: number;
      anticipationY: number;
      anticipationRotation: number;
      anticipationScale: number;
      disperseX: number;
      disperseY: number;
      disperseRotation: number;
      disperseScale: number;
      disperseOpacity: number;
      resolveX: number;
      resolveY: number;
      resolveRotation: number;
      resolveScale: number;
      resolveOpacity: number;
    };

    const tileNodes = Array.from(
      heroPresenter.querySelectorAll<SVGRectElement>('[data-hero-presenter-tile]')
    );

    if (tileNodes.length === 0) {
      return;
    }

    const parseTileValue = (value: string | undefined, fallback = 0) => {
      if (!value) {
        return fallback;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const computeTileSeed = (id: number, x: number, y: number) => {
      const raw = Math.sin(
        ((id + 1) * 12.9898)
          + (x * 0.01523)
          + (y * 0.00917)
      ) * 43758.5453;

      return raw - Math.floor(raw);
    };

    const tileSource = tileNodes.map((node, index) => {
      const id = parseTileValue(node.dataset.tileId, index);
      const x = parseTileValue(node.dataset.baseX, 0);
      const y = parseTileValue(node.dataset.baseY, 0);

      return {
        id,
        x,
        y,
        weight: parseTileValue(node.dataset.weight, 0.5),
        seed: computeTileSeed(id, x, y),
        part: (node.dataset.part as HeroPresenterPartName | undefined) ?? 'torso',
      };
    });

    const setBridgeSignal = (signalPath: SVGPathElement, pathLength: number) => {
      const segmentLength = Math.max(pathLength * 0.18, 84);
      const gapLength = Math.max(pathLength - segmentLength, 1);
      gsap.set(signalPath, {
        strokeDasharray: `${segmentLength} ${gapLength}`,
        strokeDashoffset: pathLength,
      });
    };

    const setupTimeline = (config: HeroMotionConfig) => {
      const presenterSvg = heroPresenter.querySelector('svg');
      const viewBox = presenterSvg?.viewBox.baseVal;
      const sourceWidth = viewBox?.width || 1536;
      const sourceHeight = viewBox?.height || 1024;

      const partMotion: Record<HeroPresenterPartName, {
        x: number;
        y: number;
        arc: number;
        lift: number;
        spin: number;
        scale: number;
      }> = {
        head: { x: 1190, y: 210, arc: 56, lift: 54, spin: 18, scale: 1.04 },
        torso: { x: 1200, y: 430, arc: 42, lift: 32, spin: 10, scale: 1.02 },
        leadArm: { x: 1042, y: 390, arc: 74, lift: 42, spin: -24, scale: 1.05 },
        mic: { x: 1168, y: 360, arc: 94, lift: 60, spin: 34, scale: 1.09 },
        legs: { x: 1190, y: 662, arc: 38, lift: 20, spin: 8, scale: 0.98 },
        highlights: { x: 1292, y: 392, arc: 84, lift: 26, spin: 28, scale: 1.02 },
      };

      const waveformRegion = {
        x: sourceWidth * 0.66,
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

      const transcriptCols = 34;
      const transcriptRows = 13;

      const tileMetrics: PresenterTileMetrics[] = tileSource.map((tile) => {
        const partStyle = partMotion[tile.part] ?? partMotion.torso;
        const seed = tile.seed;
        const phase = (seed * Math.PI * 2)
          + (tile.x * 0.0042)
          + (tile.y * 0.0028);

        const radial = partStyle.arc * config.arcScale * (0.55 + (seed * 0.65));
        const anticipationX = Math.sin(phase) * 4.2 * config.arcScale;
        const anticipationY = (Math.cos(phase * 0.9) * 3.2 * config.arcScale)
          - ((tile.part === 'mic' ? 4 : 1.6) * config.liftScale);

        const disperseX = (Math.cos(phase + (seed * 1.45)) * radial)
          + (Math.sin((tile.y * 0.018) + (seed * 7.3)) * partStyle.arc * 0.24 * config.arcScale);
        const disperseY = (Math.sin(phase * 0.76) * radial * 0.35)
          - (partStyle.lift * config.liftScale * (0.55 + (seed * 0.45)));
        const disperseRotation = (partStyle.spin * (0.52 + (seed * 0.72)))
          + (Math.sin(phase) * 7.5);
        const disperseScale = partStyle.scale + ((seed - 0.5) * 0.14);
        const disperseOpacity = 0.66 + (seed * 0.28);

        const resolveToWave = tile.part === 'mic'
          || tile.part === 'highlights'
          || tile.part === 'head'
          || (tile.part === 'leadArm' && seed > 0.42);

        let targetX = 0;
        let targetY = 0;
        let resolveScale = 1;
        let resolveOpacity = 1;
        let resolveRotation = 0;

        if (resolveToWave) {
          const bar = DELIVERY_WAVE_BARS[tile.id % DELIVERY_WAVE_BARS.length];
          const barX = waveformRegion.x + ((bar.x / 400) * waveformRegion.width);
          const barTop = waveformRegion.y + ((bar.y / 100) * waveformRegion.height);
          const barBottom = waveformRegion.y + (((bar.y + bar.h) / 100) * waveformRegion.height);
          const stripe = (((tile.id * 7) % 10) + (seed * 1.5)) / 10;

          targetX = barX + ((seed - 0.5) * 6);
          targetY = barBottom - (stripe * (barBottom - barTop))
            + (Math.sin((seed * Math.PI * 2) + (bar.x * 0.1)) * 2.4);
          resolveScale = (0.82 + (seed * 0.2)) * config.motifDepth;
          resolveOpacity = 0.52 + (seed * 0.36);
          resolveRotation = (seed - 0.5) * 12;
        } else {
          const transcriptSlot = (tile.id * 13) % (transcriptCols * transcriptRows);
          const col = transcriptSlot % transcriptCols;
          const row = Math.floor(transcriptSlot / transcriptCols);

          const cellWidth = transcriptRegion.width / transcriptCols;
          const cellHeight = transcriptRegion.height / transcriptRows;

          targetX = transcriptRegion.x + (col * cellWidth) + ((seed - 0.5) * 4);
          targetY = transcriptRegion.y + (row * cellHeight)
            + (Math.sin((col * 0.55) + (seed * 5.4)) * 1.8);
          resolveScale = (0.72 + (seed * 0.2)) * config.motifDepth;
          resolveOpacity = 0.38 + (seed * 0.3);
          resolveRotation = (seed - 0.5) * 8;
        }

        return {
          baseX: tile.x,
          baseY: tile.y,
          part: tile.part,
          seed,
          anticipationX,
          anticipationY,
          anticipationRotation: (seed - 0.5) * 4.6,
          anticipationScale: 0.99 + (seed * 0.02),
          disperseX,
          disperseY,
          disperseRotation,
          disperseScale,
          disperseOpacity,
          resolveX: targetX - tile.x,
          resolveY: targetY - tile.y,
          resolveRotation,
          resolveScale,
          resolveOpacity,
        };
      });

      const applyBridgeGeometry = () => {
        const layerRect = heroBridgeLayer.getBoundingClientRect();
        const micRect = heroMicPulse.getBoundingClientRect();
        const waveRect = deliveryWave.getBoundingClientRect();
        const transcriptRect = deliveryTranscript.getBoundingClientRect();

        const maxY = Math.max(waveRect.bottom, transcriptRect.bottom, micRect.bottom) - layerRect.top;
        heroBridgeLayer.style.setProperty('--hero-bridge-height', `${Math.ceil(maxY + 180)}px`);

        const resizedLayerRect = heroBridgeLayer.getBoundingClientRect();

        const startX = (micRect.left + (micRect.width / 2)) - resizedLayerRect.left;
        const startY = (micRect.top + (micRect.height / 2)) - resizedLayerRect.top;
        const waveX = (waveRect.left + (waveRect.width * 0.42)) - resizedLayerRect.left;
        const waveY = (waveRect.top + (waveRect.height * 0.56)) - resizedLayerRect.top;
        const transcriptX = (transcriptRect.left + (transcriptRect.width * 0.52)) - resizedLayerRect.left;
        const transcriptY = (transcriptRect.top + (transcriptRect.height * 0.22)) - resizedLayerRect.top;

        const primaryPath = [
          `M ${startX.toFixed(2)} ${startY.toFixed(2)}`,
          `C ${(startX - (92 * config.arcScale)).toFixed(2)} ${(startY + (148 * config.liftScale)).toFixed(2)}`,
          `${(waveX + (142 * config.arcScale)).toFixed(2)} ${(waveY - (132 * config.liftScale)).toFixed(2)}`,
          `${waveX.toFixed(2)} ${waveY.toFixed(2)}`,
        ].join(' ');

        const branchStartX = startX + ((waveX - startX) * 0.62);
        const branchStartY = startY + ((waveY - startY) * 0.62);
        const secondaryPath = [
          `M ${branchStartX.toFixed(2)} ${branchStartY.toFixed(2)}`,
          `C ${(branchStartX + (92 * config.arcScale)).toFixed(2)} ${(branchStartY + (52 * config.liftScale)).toFixed(2)}`,
          `${(transcriptX - (96 * config.arcScale)).toFixed(2)} ${(transcriptY - (72 * config.liftScale)).toFixed(2)}`,
          `${transcriptX.toFixed(2)} ${transcriptY.toFixed(2)}`,
        ].join(' ');

        heroBridgePrimary.setAttribute('d', primaryPath);
        heroBridgeSecondary.setAttribute('d', secondaryPath);
        heroBridgePrimarySignal.setAttribute('d', primaryPath);
        heroBridgeSecondarySignal.setAttribute('d', secondaryPath);

        return {
          primaryLength: heroBridgePrimary.getTotalLength(),
          secondaryLength: heroBridgeSecondary.getTotalLength(),
        };
      };

      gsap.set(heroBase, {
        transformOrigin: '50% 50%',
        yPercent: 0,
        scale: 1,
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
        autoAlpha: 0.18,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
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
      gsap.set(tileNodes, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
      });
      gsap.set(heroBridgeLayer, { autoAlpha: 0 });
      gsap.set([heroBridgePrimary, heroBridgeSecondary], {
        autoAlpha: 0.1,
      });
      gsap.set([heroBridgePrimarySignal, heroBridgeSecondarySignal], {
        autoAlpha: 0,
      });
      gsap.set(deliveryVisual, {
        transformOrigin: '50% 50%',
        scale: 0.985,
      });
      gsap.set(deliveryWave, {
        transformOrigin: '50% 70%',
        scale: 0.84,
        autoAlpha: 0.64,
      });
      gsap.set(deliveryTranscript, {
        autoAlpha: 0.62,
        y: 18,
      });

      const bridgeLengths = applyBridgeGeometry();
      setBridgeSignal(heroBridgePrimarySignal, bridgeLengths.primaryLength);
      setBridgeSignal(heroBridgeSecondarySignal, bridgeLengths.secondaryLength);

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          endTrigger: deliverySection,
          end: 'top 55%',
          scrub: config.scrub,
          invalidateOnRefresh: true,
          onRefresh: () => {
            const refreshed = applyBridgeGeometry();
            setBridgeSignal(heroBridgePrimarySignal, refreshed.primaryLength);
            setBridgeSignal(heroBridgeSecondarySignal, refreshed.secondaryLength);
          },
        },
      });

      timeline
        .to(heroScroll, { autoAlpha: 0, y: -16, duration: 0.16 }, 0)
        .to(heroBase, { yPercent: -5.5 * config.liftScale, scale: 1.026, duration: 1 }, 0)
        .to(heroSpotlight, { autoAlpha: 0.42 * config.signalIntensity, scale: 1.1, duration: 0.34 }, 0.06)
        .to(heroPresenter, {
          xPercent: -6.4 * config.arcScale,
          yPercent: -3.1 * config.liftScale,
          scale: 1.05,
          rotation: -1.2 * config.signalIntensity,
          duration: 0.4,
        }, 0.16)
        .to(heroMicPulse, { autoAlpha: 0.84 * config.signalIntensity, scale: 1.05, duration: 0.12 }, 0.2)
        .to(heroMicPulse, { autoAlpha: 0.28, scale: 1.38, duration: 0.2 }, 0.34)
        .to(heroMicPulse, { autoAlpha: 0.78 * config.signalIntensity, scale: 1.08, duration: 0.16 }, 0.52)
        .to(heroMicPulse, { autoAlpha: 0.18, scale: 1.62, duration: 0.22 }, 0.66)
        .to(tileNodes, {
          x: (index: number) => tileMetrics[index].anticipationX,
          y: (index: number) => tileMetrics[index].anticipationY,
          rotation: (index: number) => tileMetrics[index].anticipationRotation,
          scale: (index: number) => tileMetrics[index].anticipationScale,
          opacity: 1,
          duration: 0.2,
          ease: 'sine.out',
          stagger: 0.00065,
        }, 0)
        .to(tileNodes, {
          x: (index: number) => tileMetrics[index].disperseX,
          y: (index: number) => tileMetrics[index].disperseY,
          rotation: (index: number) => tileMetrics[index].disperseRotation,
          scale: (index: number) => tileMetrics[index].disperseScale,
          opacity: (index: number) => tileMetrics[index].disperseOpacity,
          duration: 0.48,
          ease: 'power2.inOut',
          stagger: 0.00085,
        }, 0.2)
        .to(heroInner, { yPercent: -7.2 * config.liftScale, autoAlpha: 0.79, duration: 0.26 }, 0.72)
        .to(heroPresenter, {
          xPercent: 3.4 * config.arcScale,
          yPercent: 2.2 * config.liftScale,
          scale: 1.01,
          autoAlpha: 0.76,
          duration: 0.24,
        }, 0.82)
        .to(tileNodes, {
          x: (index: number) => tileMetrics[index].resolveX,
          y: (index: number) => tileMetrics[index].resolveY,
          rotation: (index: number) => tileMetrics[index].resolveRotation,
          scale: (index: number) => tileMetrics[index].resolveScale,
          opacity: (index: number) => tileMetrics[index].resolveOpacity,
          duration: 0.28,
          ease: 'power3.inOut',
          stagger: 0.0008,
        }, 0.68)
        .to(heroBridgeLayer, { autoAlpha: 1, duration: 0.08 }, 0.22)
        .to([heroBridgePrimary, heroBridgeSecondary], {
          autoAlpha: config.bridgeOpacity,
          duration: 0.22,
        }, 0.24)
        .to(heroBridgePrimarySignal, {
          autoAlpha: 1,
          strokeDashoffset: 0,
          duration: 0.5,
          ease: 'none',
        }, 0.26)
        .to(heroBridgeSecondarySignal, {
          autoAlpha: 0.95,
          strokeDashoffset: 0,
          duration: 0.44,
          ease: 'none',
        }, 0.44)
        .to(deliveryVisual, {
          scale: 1,
          duration: 0.24,
        }, 0.76)
        .to(deliveryWave, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.28,
          ease: 'power2.out',
        }, 0.76)
        .to(deliveryTranscript, {
          y: 0,
          autoAlpha: 1,
          duration: 0.24,
          ease: 'power2.out',
        }, 0.8)
        .to([heroBridgePrimary, heroBridgeSecondary], { autoAlpha: 0.22, duration: 0.14 }, 0.9)
        .to(heroSpotlight, { autoAlpha: 0.08, scale: 1.05, duration: 0.18 }, 0.84)
        .to([heroBridgePrimarySignal, heroBridgeSecondarySignal], { autoAlpha: 0.28, duration: 0.12 }, 0.9)
        .to(heroMicPulse, { autoAlpha: 0, duration: 0.1 }, 0.9);

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    };

    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () =>
      setupTimeline({
        scrub: 1,
        arcScale: 1,
        liftScale: 1,
        bridgeOpacity: 0.76,
        signalIntensity: 1,
        motifDepth: 1,
      })
    );

    mm.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', () =>
      setupTimeline({
        scrub: 0.9,
        arcScale: 0.82,
        liftScale: 0.78,
        bridgeOpacity: 0.72,
        signalIntensity: 0.9,
        motifDepth: 0.88,
      })
    );

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(heroBase, { clearProps: 'transform' });
      gsap.set(heroPresenter, { clearProps: 'transform,opacity' });
      gsap.set(heroSpotlight, { clearProps: 'transform,opacity' });
      gsap.set(heroInner, { clearProps: 'transform,opacity' });
      gsap.set(heroScroll, { clearProps: 'transform,opacity' });
      gsap.set(heroMicPulse, { autoAlpha: 0, clearProps: 'transform' });
      gsap.set(heroBridgeLayer, { autoAlpha: 0 });
      gsap.set([heroBridgePrimary, heroBridgeSecondary, heroBridgePrimarySignal, heroBridgeSecondarySignal], {
        autoAlpha: 0,
      });
      gsap.set(deliveryVisual, { clearProps: 'transform' });
      gsap.set(deliveryWave, { clearProps: 'transform,opacity' });
      gsap.set(deliveryTranscript, { clearProps: 'transform,opacity' });
    });

    return () => {
      mm.revert();
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing">
      <div className="bg-noise" />

      {/* ═══ NAV ═══ */}
      <nav className="nav" ref={navRef}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-dot" />
            Pitchr
          </Link>
          <div className="nav-links">
            <a href="#delivery" className="nav-link" onClick={(e) => scrollToSection(e, 'delivery')}>
              Delivery
            </a>
            <a href="#rubric" className="nav-link" onClick={(e) => scrollToSection(e, 'rubric')}>
              Rubric
            </a>
            <a href="#growth" className="nav-link" onClick={(e) => scrollToSection(e, 'growth')}>
              Growth
            </a>
            <a href="#pricing" className="nav-link" onClick={(e) => scrollToSection(e, 'pricing')}>
              Pricing
            </a>
            <button
              className="theme-toggle"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <a href="#waitlist" className="nav-cta" onClick={scrollToWaitlist}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero" ref={heroSectionRef}>
        <div className="hero-bg hero-bg-base" ref={heroBgBaseRef} />
        <HeroPresenterTiles isDark={isDark} ref={heroPresenterRef} />
        <div className="hero-spotlight" ref={heroSpotlightRef} />
        <div className="hero-mic-pulse" ref={heroMicPulseRef} />
        <div className="container hero-inner" ref={heroInnerRef}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Pitch Coaching
          </div>

          <h1>
            Ship pitches that<br />
            <span className="accent">close rounds.</span>
          </h1>

          <p className="hero-sub">
            Record or paste your pitch. Get an investor-grade score, ranked fixes, a rewritten
            script, and delivery metrics — in seconds.
          </p>

          <div className="hero-ctas">
            <a href="#waitlist" className="btn-primary" onClick={scrollToWaitlist}>
              Join the Waitlist
              <span className="btn-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
            <a href="#delivery" className="btn-secondary" onClick={(e) => scrollToSection(e, 'delivery')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-scroll" ref={heroScrollRef}>
          <div className="hero-scroll-text">Scroll</div>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ═══ SECTION 1: DELIVERY WAVEFORM ═══ */}
      <div className="hero-delivery-bridge" ref={heroBridgeLayerRef} aria-hidden="true">
        <svg className="hero-delivery-bridge-svg" role="presentation">
          <path className="hero-bridge-rail hero-bridge-primary" ref={heroBridgePrimaryRef} />
          <path className="hero-bridge-rail hero-bridge-secondary" ref={heroBridgeSecondaryRef} />
          <path className="hero-bridge-signal hero-bridge-primary-signal" ref={heroBridgePrimarySignalRef} />
          <path className="hero-bridge-signal hero-bridge-secondary-signal" ref={heroBridgeSecondarySignalRef} />
        </svg>
      </div>

      <section className="story-section" id="delivery" ref={deliverySectionRef}>
        <div className="container story-grid">
          <div className="story-text reveal">
            <h2>
              Delivery <i>tuning</i> in real-time.
            </h2>
            <p>
              Investors tune out when you rely on filler words or speak at a frantic pace. Pitchr
              analyzes your live audio stream to detect pacing, hesitation, and vocabulary crutches
              instantly.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>
              {'> Analyzes WPM, Pauses, and Fillers'}
            </p>
          </div>
          <div className="story-visual reveal" ref={deliveryVisualRef}>
            <svg
              className="waveform-svg"
              ref={deliveryWaveRef}
              viewBox="0 0 400 100"
              preserveAspectRatio="xMidYMax meet"
            >
              {DELIVERY_WAVE_BARS.map((bar) => (
                <rect
                  key={bar.x}
                  x={bar.x}
                  y={bar.y}
                  width="8"
                  height={bar.h}
                  rx="4"
                  className="wave-bar"
                  style={{ animationDelay: `${bar.d}s` }}
                />
              ))}
            </svg>
            <div className="live-transcript" ref={deliveryTranscriptRef}>
              &quot;We are{' '}
              <span className="strike">
                um, basically
                <span className="correction">building</span>
              </span>{' '}
              the next generation of databases...&quot;
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: RUBRIC RADAR ═══ */}
      <section className="story-section" id="rubric">
        <div className="container story-grid">
          <div className="story-visual reveal" id="radarReveal">
            <div className="radar-container">
              <svg viewBox="-10 -5 220 210" width="100%" height="100%">
                <g className="radar-bg">
                  <polygon points="100,20 176,75 147,165 53,165 24,75" />
                  <polygon points="100,40 157,81 135,148 65,148 43,81" />
                  <polygon points="100,60 138,88 124,131 76,131 62,88" />
                  <polygon points="100,80 119,94 112,115 88,115 81,94" />
                </g>
                <g className="radar-axis">
                  <line x1="100" y1="100" x2="100" y2="20" />
                  <line x1="100" y1="100" x2="176" y2="75" />
                  <line x1="100" y1="100" x2="147" y2="165" />
                  <line x1="100" y1="100" x2="53" y2="165" />
                  <line x1="100" y1="100" x2="24" y2="75" />
                </g>
                <path
                  className="radar-fill"
                  ref={radarPathRef}
                  d="M100,60 L138,88 L124,131 L53,165 L24,75 Z"
                />
                <text x="100" y="-2" textAnchor="middle" className="radar-label">Structure</text>
                <text x="200" y="75" textAnchor="start" className="radar-label">Clarity</text>
                <text x="168" y="192" textAnchor="start" className="radar-label">Evidence</text>
                <text x="32" y="192" textAnchor="end" className="radar-label">Market</text>
                <text x="0" y="75" textAnchor="end" className="radar-label">Delivery</text>
              </svg>
            </div>
          </div>
          <div className="story-text reveal">
            <h2>
              The Investor-Ready <i>Matrix</i>.
            </h2>
            <p>
              A great product doesn&apos;t mean a great pitch. Pitchr evaluates you across 5
              absolute dimensions that venture capitalists care about. Stop guessing where your
              blind spots are.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)' }}>
              {'> Score: 100/100 (Perfectly Balanced)'}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: GROWTH TRAJECTORY ═══ */}
      <section className="story-section" id="growth">
        <div className="container story-grid">
          <div className="story-text reveal">
            <h2>
              Your score, <i>climbing</i>.
            </h2>
            <p>
              Your first take won&apos;t be perfect. Pitchr gives you a prioritized list of ranked
              fixes. Apply the AI rewrites, practice your delivery, and watch your score hit the
              Investor-Ready threshold.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)' }}>
              {'> Delta: +45 points in 3 sessions'}
            </p>
          </div>
          <div className="story-visual reveal" id="chartReveal">
            <div className="chart-container">
              <div className="chart-zones">
                <div className="zone-label zone-green">Investor Ready (80+)</div>
                <div className="zone-label zone-red">Needs Work (&lt;60)</div>
              </div>
              <svg className="chart-svg" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff3d00" />
                    <stop offset="50%" stopColor="#ff9100" />
                    <stop offset="100%" stopColor="#00c853" />
                  </linearGradient>
                </defs>
                <g className="chart-grid">
                  <line x1="0" y1="40" x2="500" y2="40" />
                  <line x1="0" y1="100" x2="500" y2="100" />
                  <line x1="0" y1="160" x2="500" y2="160" />
                </g>
                <path className="chart-path" d="M 0,160 Q 150,160 250,100 T 500,40" />
                <circle className="chart-dot" cx="500" cy="40" r="6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="stats-bar">
        <div className="container stats-inner reveal">
          <div className="stat">
            <div className="stat-value">100</div>
            <div className="stat-label">Point Scale</div>
          </div>
          <div className="stat">
            <div className="stat-value">5</div>
            <div className="stat-label">Rubric Categories</div>
          </div>
          <div className="stat">
            <div className="stat-value">&lt;30s</div>
            <div className="stat-label">Analysis Time</div>
          </div>
          <div className="stat">
            <div className="stat-value">2</div>
            <div className="stat-label">Pitch Modes</div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="testimonial-section" style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="testimonial-card reveal">
            <div className="testimonial-quote">
              I&apos;m used to building things — but pitching them was always the hard part. Pitchr
              is a product I can see myself coming back to every time I have a new idea to present.
            </div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">AE</div>
              <div>
                <div className="testimonial-name">Anthony Eid</div>
                <div className="testimonial-role">Software Engineer @ Zed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <LandingPricing />

      {/* ═══ WAITLIST ═══ */}
      <section className="cta-section" id="waitlist" ref={ctaContainerRef}>
        <div className="cta-glow" ref={ctaGlowRef} />
        <div className="container cta-content reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Early Access</div>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Be the first to<br />
            <span className="accent">start scoring.</span>
          </h2>
          <p className="section-desc" style={{ textAlign: 'center', margin: '0 auto 32px' }}>
            Pitchr is launching soon. Join the waitlist to get early access to AI-powered
            pitch scoring, ranked fixes, and rewritten scripts.
          </p>

          {waitlistStatus === 'success' ? (
            <div className="waitlist-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{waitlistMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="waitlist-form">
              <div className="waitlist-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="waitlist-input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  className="waitlist-input"
                  disabled={waitlistStatus === 'loading'}
                />
                <button
                  type="submit"
                  className="btn-primary waitlist-btn"
                  disabled={waitlistStatus === 'loading'}
                >
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
                  <span className="btn-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
              {waitlistStatus === 'error' && (
                <p className="waitlist-error">{waitlistMessage}</p>
              )}
            </form>
          )}

        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="nav-logo-dot" style={{ width: '6px', height: '6px' }} />
            Pitchr — AI Pitch Coach
          </div>
          <div className="footer-links">
            <a href="#delivery" className="footer-link" onClick={(e) => scrollToSection(e, 'delivery')}>
              Delivery
            </a>
            <a href="#rubric" className="footer-link" onClick={(e) => scrollToSection(e, 'rubric')}>
              Rubric
            </a>
            <a href="#pricing" className="footer-link" onClick={(e) => scrollToSection(e, 'pricing')}>
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
