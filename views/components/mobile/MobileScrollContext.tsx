// views/components/mobile/MobileScrollContext.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const MAX_ENTRIES = 15;

interface MobileScrollContextValue {
  restoreScroll: () => void;
}

const MobileScrollCtx = createContext<MobileScrollContextValue>({
  restoreScroll: () => {},
});

export function MobileScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const scrollMapRef = useRef<Map<string, number>>(new Map());
  const prevPathnameRef = useRef(pathname);

  // Save scroll on scroll events (debounced)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function onScroll() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const map = scrollMapRef.current;
        map.set(pathname, window.scrollY);
        // Evict if over limit
        if (map.size > MAX_ENTRIES) {
          const firstKey = map.keys().next().value;
          if (firstKey) map.delete(firstKey);
        }
      }, 100);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  const restoreScroll = useCallback(() => {
    const saved = scrollMapRef.current.get(pathname);
    if (saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    }
  }, [pathname]);

  // Restore on pathname change
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const saved = scrollMapRef.current.get(pathname);
      if (saved !== undefined) {
        requestAnimationFrame(() => window.scrollTo(0, saved));
      }
    }
  }, [pathname]);

  return (
    <MobileScrollCtx.Provider value={{ restoreScroll }}>
      {children}
    </MobileScrollCtx.Provider>
  );
}
