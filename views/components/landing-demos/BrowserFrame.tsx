'use client';

import type { ReactNode } from 'react';

export function BrowserFrame({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`dl-browser ${className || ''}`}>
      <div className="dl-browser-bar">
        <div className="dl-traffic">
          <span className="dl-dot dl-dot--r" />
          <span className="dl-dot dl-dot--y" />
          <span className="dl-dot dl-dot--g" />
        </div>
        <div className="dl-url">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </div>
      </div>
      <div className="dl-viewport">{children}</div>
    </div>
  );
}
