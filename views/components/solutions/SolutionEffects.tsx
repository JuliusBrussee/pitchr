'use client';

import { useEffect } from 'react';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionEffects({ solution }: { solution: SolutionConfig }) {
  useEffect(() => {
    let scrollTriggerInstances: unknown[] = [];

    const initGsap = async () => {
      try {
        const gsapModule = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsapModule.gsap.registerPlugin(ScrollTrigger);

        // Hero pin + scale-down
        const heroEl = document.querySelector<HTMLElement>('.sp-hero');
        const heroContent = document.querySelector<HTMLElement>('.sp-hero-inner');
        if (heroEl && heroContent) {
          const st = ScrollTrigger.create({
            trigger: heroEl,
            start: 'top top',
            end: '+=80%',
            pin: true,
            pinSpacing: true,
            onUpdate: (self) => {
              const progress = self.progress;
              const scale = 1 - progress * 0.15;
              const opacity = 1 - progress;
              heroContent.style.transform = `scale(${scale})`;
              heroContent.style.opacity = String(opacity);
            },
          });
          scrollTriggerInstances.push(st);
        }

        // Timeline horizontal scroll
        const timelineTrack = document.querySelector<HTMLElement>('.sp-timeline-track');
        const timelineContainer = document.querySelector<HTMLElement>('.sp-timeline');
        if (timelineTrack && timelineContainer) {
          const scrollWidth = timelineTrack.scrollWidth - timelineTrack.clientWidth;
          if (scrollWidth > 0) {
            const st = ScrollTrigger.create({
              trigger: timelineContainer,
              start: 'top center',
              end: `+=${scrollWidth}`,
              pin: true,
              pinSpacing: true,
              scrub: 1,
              onUpdate: (self) => {
                timelineTrack.scrollLeft = self.progress * scrollWidth;
                const progressBar = timelineContainer.querySelector<HTMLElement>('.sp-timeline-progress-fill');
                if (progressBar) {
                  progressBar.style.width = `${self.progress * 100}%`;
                }
              },
            });
            scrollTriggerInstances.push(st);
          }
        }

        // Transformation pinned scroll
        const transformSection = document.querySelector<HTMLElement>('.sp-transformation');
        const transformBefore = document.querySelector<HTMLElement>('.sp-transform-before');
        const transformAnalysis = document.querySelector<HTMLElement>('.sp-transform-analysis');
        const transformAfter = document.querySelector<HTMLElement>('.sp-transform-after');
        const scoreRing = document.querySelector<SVGCircleElement>('.sp-score-ring-fill');

        if (transformSection && transformBefore && transformAnalysis && transformAfter) {
          const st = ScrollTrigger.create({
            trigger: transformSection,
            start: 'top top',
            end: '+=200%',
            pin: true,
            pinSpacing: true,
            scrub: 1,
            onUpdate: (self) => {
              const p = self.progress;
              if (p < 0.3) {
                // Phase 1: Before fades in
                const phase = p / 0.3;
                transformBefore.style.opacity = String(phase);
                transformAnalysis.style.opacity = '0';
                transformAfter.style.opacity = '0';
                if (scoreRing) {
                  const circumference = 2 * Math.PI * 54;
                  const beforeScore = 52;
                  scoreRing.style.strokeDashoffset = String(circumference * (1 - (phase * beforeScore) / 100));
                  scoreRing.style.stroke = solution.color + '60';
                }
              } else if (p < 0.6) {
                // Phase 2: Analysis overlay
                const phase = (p - 0.3) / 0.3;
                transformBefore.style.opacity = String(1 - phase * 0.5);
                transformAnalysis.style.opacity = String(phase);
                transformAfter.style.opacity = '0';
              } else {
                // Phase 3: After fades in
                const phase = (p - 0.6) / 0.4;
                transformBefore.style.opacity = '0';
                transformAnalysis.style.opacity = String(1 - phase);
                transformAfter.style.opacity = String(phase);
                if (scoreRing) {
                  const circumference = 2 * Math.PI * 54;
                  const afterScore = 88;
                  scoreRing.style.strokeDashoffset = String(circumference * (1 - (afterScore) / 100));
                  scoreRing.style.stroke = solution.color;
                }
              }
            },
          });
          scrollTriggerInstances.push(st);
        }

        // Feature cards stagger
        const featureCards = document.querySelectorAll<HTMLElement>('.sp-feature-card');
        if (featureCards.length > 0) {
          gsapModule.gsap.from(featureCards, {
            y: 40,
            opacity: 0,
            rotation: -2,
            stagger: 0.12,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.sp-feature-cards-section',
              start: 'top 80%',
            },
          });
        }
      } catch {
        // GSAP not available — fall back to CSS
      }
    };

    initGsap();

    return () => {
      scrollTriggerInstances.forEach((st) => {
        if (st && typeof (st as { kill: () => void }).kill === 'function') {
          (st as { kill: () => void }).kill();
        }
      });
    };
  }, [solution]);

  return null;
}
