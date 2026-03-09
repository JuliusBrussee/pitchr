import type { ReactNode } from 'react';
import { SURFACE, BORDER, TEXT_MUTED, TEXT_PRIMARY } from '../utils/constants';

interface BrowserChromeProps {
  url: string;
  children: ReactNode;
  scale?: number;
  borderRadius?: number;
}

export function BrowserChrome({
  url,
  children,
  scale = 1,
  borderRadius = 16,
}: BrowserChromeProps) {
  return (
    <div
      style={{
        borderRadius,
        overflow: 'hidden',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        transform: `scale(${scale})`,
        background: SURFACE,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: `1px solid ${BORDER}`,
          background: '#fafafa',
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div
              key={c}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: c,
              }}
            />
          ))}
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 8,
            background: '#f0f0ee',
            fontSize: 13,
            color: TEXT_MUTED,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEXT_MUTED}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </div>
      </div>
      {/* Viewport */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
