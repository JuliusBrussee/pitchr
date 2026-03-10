'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  resolveTileDensityTier,
} from '@/views/components/landing/heroDeliveryFunnel.config';
import { HERO_PRESENTER_TILE_TUPLES } from '@/views/components/landing/heroPresenterTiles.data';
import { useHeroDeliveryFunnel } from '@/views/components/landing/useHeroDeliveryFunnel';

/**
 * Thin client component that attaches all interactive behaviors to the
 * server-rendered landing page HTML: scroll effects, IntersectionObserver
 * reveals, CTA glow tracking, hero delivery funnel animations, and
 * referral code capture.
 *
 * Uses querySelector to find elements rendered by the server component,
 * avoiding the need to wrap the entire page in a client boundary.
 */
export function LandingEffects() {
  const landingRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const radarPathRef = useRef<SVGPathElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroInnerRef = useRef<HTMLDivElement | null>(null);
  const heroBgBaseRef = useRef<HTMLDivElement | null>(null);
  const heroPresenterRef = useRef<HTMLDivElement | null>(null);
  const heroSpotlightRef = useRef<HTMLDivElement | null>(null);
  const heroMicPulseRef = useRef<HTMLDivElement | null>(null);
  const heroScrollRef = useRef<HTMLDivElement | null>(null);
  const deliverySectionRef = useRef<HTMLElement | null>(null);
  const deliveryVisualRef = useRef<HTMLDivElement | null>(null);
  const deliveryWaveRef = useRef<SVGSVGElement | null>(null);
  const deliveryTranscriptRef = useRef<HTMLDivElement | null>(null);

  const [heroFunnelEnabled, setHeroFunnelEnabled] = useState(false);

  // Bind refs to server-rendered DOM nodes on mount
  useEffect(() => {
    landingRef.current = document.querySelector<HTMLDivElement>('.landing');
    navRef.current = document.querySelector<HTMLElement>('.landing .nav');
    radarPathRef.current = document.querySelector<SVGPathElement>('.radar-fill');
    heroSectionRef.current = document.querySelector<HTMLElement>('.landing .hero');
    heroInnerRef.current = document.querySelector<HTMLDivElement>('.landing .hero-inner');
    heroBgBaseRef.current = document.querySelector<HTMLDivElement>('.landing .hero-bg-base');
    heroPresenterRef.current = document.querySelector<HTMLDivElement>('[data-hero-presenter]');
    heroSpotlightRef.current = document.querySelector<HTMLDivElement>('.landing .hero-spotlight');
    heroMicPulseRef.current = document.querySelector<HTMLDivElement>('.landing .hero-mic-pulse');
    heroScrollRef.current = document.querySelector<HTMLDivElement>('.landing .hero-scroll');
    deliverySectionRef.current = document.querySelector<HTMLElement>('.story-section-delivery');
    deliveryVisualRef.current = document.querySelector<HTMLDivElement>('.story-section-delivery .story-visual');
    deliveryWaveRef.current = document.querySelector<SVGSVGElement>('.waveform-svg');
    deliveryTranscriptRef.current = document.querySelector<HTMLDivElement>('.live-transcript');
  }, []);

  useHeroDeliveryFunnel({
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
    enabled: heroFunnelEnabled,
  });

  // Tile density + funnel capability check
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
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const shouldEnableFunnel = !prefersReducedMotion
        && window.innerWidth >= 1200
        && memory >= 8
        && cores >= 8
        && density.tier === 'max';

      // Communicate tile cap to HeroPresenterTiles via data attribute
      const presenter = document.querySelector<HTMLDivElement>('[data-hero-presenter]');
      if (presenter) {
        presenter.dataset.tileCap = String(density.targetCount);
        presenter.dispatchEvent(new CustomEvent('tilecapchange', { detail: density.targetCount }));
      }

      setHeroFunnelEnabled(shouldEnableFunnel);
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

  // Capture ?ref= param for referral tracking
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        localStorage.setItem('pitchr_referral_code', refCode.trim());
      }
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!navRef.current) return;
    if (window.scrollY > 50) {
      navRef.current.classList.add('scrolled');
    } else {
      navRef.current.classList.remove('scrolled');
    }
  }, []);

  // IntersectionObserver for .reveal elements + nav scroll + CTA glow
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');

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

    const observedRevealNodes = new WeakSet<Element>();
    const observeRevealNodes = (root: ParentNode) => {
      root.querySelectorAll('.landing .reveal').forEach((el) => {
        if (observedRevealNodes.has(el)) return;
        observedRevealNodes.add(el);
        observer.observe(el);
      });
    };

    observeRevealNodes(document);

    const landingRoot = document.querySelector('.landing');
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('.landing .reveal') && !observedRevealNodes.has(node)) {
            observedRevealNodes.add(node);
            observer.observe(node);
          }
          observeRevealNodes(node);
        });
      }
    });
    if (landingRoot) {
      mutationObserver.observe(landingRoot, { childList: true, subtree: true });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // CTA hover glow tracking
    const ctaContainer = document.querySelector<HTMLElement>('.cta-section');
    const ctaGlow = document.querySelector<HTMLDivElement>('.cta-glow');
    const handleMouseMove = (e: MouseEvent) => {
      if (!ctaContainer || !ctaGlow) return;
      const rect = ctaContainer.getBoundingClientRect();
      ctaGlow.style.left = `${e.clientX - rect.left}px`;
      ctaGlow.style.top = `${e.clientY - rect.top}px`;
    };

    ctaContainer?.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      ctaContainer?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll]);

  // Smooth scroll for anchor links within .landing
  useEffect(() => {
    const getScrollBehavior = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' as const : 'smooth' as const;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLAnchorElement>('.landing a[href^="#"]');
      if (!target) return;
      const id = target.getAttribute('href')?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: getScrollBehavior(), block: id === 'waitlist' ? 'center' : 'start' });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
