'use client';

import { useEffect, useRef } from 'react';

const REVEAL_SELECTOR =
  '.pp-section-card, .pp-related, .pp-cta-banner';

/**
 * Wraps the About page body and adds scroll-reveal: when each section
 * enters the viewport, adds the .visible class so public-pages.css
 * transitions run (opacity + translateY). Matches PublicPageScrollReveal
 * behavior used on delivery-rubric, scoring-logic, growth-pricing.
 */
export function AboutScrollReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      container.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    container.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="pp-body">
      {children}
    </div>
  );
}
