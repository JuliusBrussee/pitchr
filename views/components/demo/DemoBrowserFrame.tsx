'use client';

import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

interface DemoBrowserFrameProps {
  urlText: string;
  children: ReactNode;
}

export function DemoBrowserFrame({ urlText, children }: DemoBrowserFrameProps) {
  return (
    <div className="demo-browser">
      <div className="demo-browser-bar">
        <div className="demo-traffic-lights">
          <div className="demo-traffic-dot demo-traffic-dot--red" />
          <div className="demo-traffic-dot demo-traffic-dot--yellow" />
          <div className="demo-traffic-dot demo-traffic-dot--green" />
        </div>
        <div className="demo-url-bar">
          <Lock size={10} className="demo-url-lock" />
          {urlText}
        </div>
      </div>
      <div className="demo-browser-viewport">
        {children}
      </div>
    </div>
  );
}
