'use client';

import { useEffect, useRef } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  staggerDelay?: number;
}

export function useScrollReveal({
  threshold = 0.15,
  rootMargin = '0px',
  once = true,
  staggerDelay = 0.1,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger children with .stagger-child class
            const children = el.querySelectorAll('.stagger-child');
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * staggerDelay}s`;
            });

            el.classList.add('visible');

            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            el.classList.remove('visible');
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, staggerDelay]);

  return ref;
}
