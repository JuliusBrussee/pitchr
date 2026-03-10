'use client';

export function HackathonSvg({ color, animate }: { color: string; animate: boolean }) {
  const dashStyle = animate
    ? { strokeDasharray: '800', strokeDashoffset: '0', transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)' }
    : { strokeDasharray: '800', strokeDashoffset: '800' };

  return (
    <svg viewBox="0 0 400 300" fill="none" className="sp-illustration" aria-hidden="true">
      {/* Stage platform */}
      <g style={dashStyle}>
        <rect x="40" y="220" width="320" height="12" rx="3" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <line x1="50" y1="232" x2="50" y2="265" stroke={color} strokeWidth="1.5" opacity="0.2" />
        <line x1="350" y1="232" x2="350" y2="265" stroke={color} strokeWidth="1.5" opacity="0.2" />
      </g>

      {/* Team on stage */}
      <g style={dashStyle}>
        {/* Person 1 (presenting) */}
        <circle cx="200" cy="110" r="18" stroke={color} strokeWidth="2" />
        <line x1="200" y1="128" x2="200" y2="195" stroke={color} strokeWidth="2" />
        <line x1="200" y1="150" x2="170" y2="170" stroke={color} strokeWidth="2" />
        <line x1="200" y1="150" x2="235" y2="140" stroke={color} strokeWidth="2" />
        <line x1="200" y1="195" x2="185" y2="218" stroke={color} strokeWidth="2" />
        <line x1="200" y1="195" x2="215" y2="218" stroke={color} strokeWidth="2" />
      </g>

      {/* Team members flanking */}
      <g style={dashStyle} opacity="0.4">
        <circle cx="130" cy="130" r="14" stroke={color} strokeWidth="1.5" />
        <line x1="130" y1="144" x2="130" y2="200" stroke={color} strokeWidth="1.5" />
        <line x1="130" y1="200" x2="120" y2="218" stroke={color} strokeWidth="1.5" />
        <line x1="130" y1="200" x2="140" y2="218" stroke={color} strokeWidth="1.5" />

        <circle cx="270" cy="130" r="14" stroke={color} strokeWidth="1.5" />
        <line x1="270" y1="144" x2="270" y2="200" stroke={color} strokeWidth="1.5" />
        <line x1="270" y1="200" x2="260" y2="218" stroke={color} strokeWidth="1.5" />
        <line x1="270" y1="200" x2="280" y2="218" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Laptop on demo table */}
      <g style={dashStyle}>
        <rect x="160" y="60" width="80" height="48" rx="4" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <rect x="150" y="108" width="100" height="6" rx="2" stroke={color} strokeWidth="1" opacity="0.3" />
        {/* Code on screen */}
        <line x1="170" y1="72" x2="220" y2="72" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="170" y1="82" x2="210" y2="82" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="170" y1="92" x2="225" y2="92" stroke={color} strokeWidth="1" opacity="0.3" />
      </g>

      {/* Trophy */}
      <g style={dashStyle} opacity="0.3">
        <path d="M340 40 L340 55 C340 65 330 70 325 70 L355 70 C350 70 340 65 340 55" stroke={color} strokeWidth="1.5" />
        <line x1="340" y1="70" x2="340" y2="80" stroke={color} strokeWidth="1.5" />
        <line x1="330" y1="80" x2="350" y2="80" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Timer */}
      <g style={dashStyle} opacity="0.3">
        <circle cx="60" cy="60" r="14" stroke={color} strokeWidth="1.5" />
        <text x="60" y="64" textAnchor="middle" fill={color} fontSize="9">3m</text>
      </g>
    </svg>
  );
}
