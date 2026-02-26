'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface StepTransitionProps {
  stepKey: number;
  children: ReactNode;
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevKey = useRef(stepKey);

  useEffect(() => {
    if (stepKey !== prevKey.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
        prevKey.current = stepKey;
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [stepKey, children]);

  return (
    <div
      className="h-full transition-all duration-300 ease-out"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
      }}
    >
      {displayChildren}
    </div>
  );
}
