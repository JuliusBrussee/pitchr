'use client';

import { useEffect, useRef } from 'react';
import type { PublicPageKey } from '@/content/publicPages';
import { DeliveryRubricHero } from '@/views/components/public/heroes/DeliveryRubricHero';
import { ScoringLogicHero } from '@/views/components/public/heroes/ScoringLogicHero';
import { GrowthPricingHero } from '@/views/components/public/heroes/GrowthPricingHero';
import '@/app/(marketing)/public-pages.css';

const HERO_MAP: Record<PublicPageKey, React.ComponentType> = {
  deliveryRubric: DeliveryRubricHero,
  scoringLogic: ScoringLogicHero,
  growthPricing: GrowthPricingHero,
};

export function PublicPageHeroVisual({ pageKey }: { pageKey: PublicPageKey }) {
  const HeroComponent = HERO_MAP[pageKey];
  return <HeroComponent />;
}

export function PublicPageScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => el.classList.add('visible'), delay);
            } else {
              el.classList.add('visible');
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
