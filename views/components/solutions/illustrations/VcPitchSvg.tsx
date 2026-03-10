'use client';

export function VcPitchSvg({ color, animate }: { color: string; animate: boolean }) {
  const dashStyle = animate
    ? { strokeDasharray: '800', strokeDashoffset: '0', transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)' }
    : { strokeDasharray: '800', strokeDashoffset: '800' };

  return (
    <svg viewBox="0 0 400 300" fill="none" className="sp-illustration" aria-hidden="true">
      {/* Boardroom table */}
      <g style={dashStyle}>
        <rect x="60" y="180" width="280" height="8" rx="4" stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Table legs */}
        <line x1="80" y1="188" x2="80" y2="240" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <line x1="320" y1="188" x2="320" y2="240" stroke={color} strokeWidth="1.5" opacity="0.3" />
      </g>

      {/* Founder (standing, presenting) */}
      <g style={dashStyle}>
        <circle cx="200" cy="80" r="20" stroke={color} strokeWidth="2" />
        <line x1="200" y1="100" x2="200" y2="165" stroke={color} strokeWidth="2" />
        <line x1="200" y1="125" x2="165" y2="145" stroke={color} strokeWidth="2" />
        <line x1="200" y1="125" x2="235" y2="110" stroke={color} strokeWidth="2" />
        <line x1="200" y1="165" x2="180" y2="238" stroke={color} strokeWidth="2" />
        <line x1="200" y1="165" x2="220" y2="238" stroke={color} strokeWidth="2" />
      </g>

      {/* Presentation screen */}
      <g style={dashStyle}>
        <rect x="250" y="45" width="110" height="75" rx="4" stroke={color} strokeWidth="1.5" opacity="0.5" />
        {/* Chart on screen */}
        <polyline points="265,100 285,85 305,90 325,65 345,70" stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Text lines */}
        <line x1="265" y1="55" x2="345" y2="55" stroke={color} strokeWidth="1" opacity="0.2" />
      </g>

      {/* VCs (seated, other side of table) */}
      <g style={dashStyle} opacity="0.35">
        {/* VC 1 */}
        <circle cx="110" cy="210" r="12" stroke={color} strokeWidth="1.5" />
        <line x1="110" y1="222" x2="110" y2="260" stroke={color} strokeWidth="1.5" />
        {/* VC 2 */}
        <circle cx="200" cy="215" r="12" stroke={color} strokeWidth="1.5" />
        <line x1="200" y1="227" x2="200" y2="265" stroke={color} strokeWidth="1.5" />
        {/* VC 3 */}
        <circle cx="290" cy="210" r="12" stroke={color} strokeWidth="1.5" />
        <line x1="290" y1="222" x2="290" y2="260" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Dollar signs floating */}
      <g style={dashStyle} opacity="0.2">
        <text x="55" y="80" fill={color} fontSize="16">$</text>
        <text x="355" y="140" fill={color} fontSize="14">$</text>
        <text x="40" y="140" fill={color} fontSize="12">$</text>
      </g>
    </svg>
  );
}
