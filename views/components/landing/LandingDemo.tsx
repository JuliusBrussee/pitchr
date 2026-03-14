'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const DemoClient = dynamic(
  () => import('@/views/components/demo/DemoClient').then((m) => ({ default: m.DemoClient })),
  { ssr: false }
);

export function LandingDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Lazy-load trigger: start importing when section is within 400px of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          loadObserver.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );

    loadObserver.observe(el);
    return () => loadObserver.disconnect();
  }, []);

  // Visibility tracking: pause/resume demo based on viewport presence
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const visObserver = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );

    visObserver.observe(el);
    return () => visObserver.disconnect();
  }, []);

  // Track when component has mounted to fade in
  const handleDemoMount = useCallback(() => {
    // Small delay to let the demo render its first frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setHasLoaded(true));
    });
  }, []);

  useEffect(() => {
    if (shouldLoad) handleDemoMount();
  }, [shouldLoad, handleDemoMount]);

  // Check reduced motion preference
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const paused = !isVisible || prefersReduced;

  return (
    <section className="landing-demo" id="demo" ref={sectionRef}>
      {/* Atmospheric background */}
      <div className="landing-demo-bg" />

      <div className="container">
        <div className="landing-demo-header reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Product Demo</div>
          <h2 className="landing-demo-title">
            See it in <i>action</i>.
          </h2>
        </div>

        <div className={`landing-demo-stage${hasLoaded ? ' landing-demo-stage--loaded' : ''}`}>
          {shouldLoad ? (
            <DemoClient paused={paused} />
          ) : (
            /* Skeleton placeholder */
            <div className="landing-demo-skeleton">
              <div className="landing-demo-skeleton-bar">
                <div className="landing-demo-skeleton-dots">
                  <span /><span /><span />
                </div>
                <div className="landing-demo-skeleton-url" />
              </div>
              <div className="landing-demo-skeleton-body">
                <div className="landing-demo-skeleton-shimmer" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
