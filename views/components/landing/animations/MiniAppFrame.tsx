'use client';

import type { CSSProperties, ReactNode } from 'react';

interface MiniAppFrameProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MiniAppFrame({ children, className = '', style }: MiniAppFrameProps) {
  return (
    <div className={`mini-app-frame ${className}`} style={style}>
      <div className="mini-app-frame-bar">
        <span className="mini-app-dot" />
        <span className="mini-app-dot" />
        <span className="mini-app-dot" />
      </div>
      <div className="mini-app-frame-content">
        {children}
      </div>
    </div>
  );
}
