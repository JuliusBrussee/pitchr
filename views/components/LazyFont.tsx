'use client';

import { useEffect } from 'react';

export function LazyFont({ href }: { href: string }) {
  useEffect(() => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);

  return null;
}
