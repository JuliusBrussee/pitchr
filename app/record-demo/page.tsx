'use client';

import { useCallback, useEffect, useState } from 'react';
import { DemoClient } from '@/views/components/demo/variations/F5/DemoClient';

export default function RecordDemoPage() {
  const [done, setDone] = useState(false);

  // Hide Next.js dev indicators
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-nextjs-dialog-overlay],
      #__next-build-indicator,
      nextjs-portal,
      [data-next-mark] { display: none !important; }
      html, body { overflow: hidden !important; }
      * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      *::-webkit-scrollbar { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleComplete = useCallback(() => {
    setDone(true);
    (window as unknown as Record<string, unknown>).__DEMO_COMPLETE__ = true;
  }, []);

  return (
    <div className="dark" style={{ background: '#050505', height: '100vh', overflow: 'hidden' }}>
      <DemoClient onComplete={handleComplete} />
      {done && (
        <div
          id="demo-complete-marker"
          style={{ position: 'fixed', bottom: 0, right: 0, opacity: 0 }}
        />
      )}
    </div>
  );
}
