'use client';

export function ElevatorSvg({ color, animate }: { color: string; animate: boolean }) {
  const dashStyle = animate
    ? { strokeDasharray: '800', strokeDashoffset: '0', transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)' }
    : { strokeDasharray: '800', strokeDashoffset: '800' };

  return (
    <svg viewBox="0 0 400 300" fill="none" className="sp-illustration" aria-hidden="true">
      {/* Person - networking pose */}
      <g style={dashStyle}>
        {/* Head */}
        <circle cx="200" cy="80" r="22" stroke={color} strokeWidth="2" />
        {/* Body */}
        <line x1="200" y1="102" x2="200" y2="180" stroke={color} strokeWidth="2" />
        {/* Arms - one gesturing */}
        <line x1="200" y1="130" x2="160" y2="155" stroke={color} strokeWidth="2" />
        <line x1="200" y1="130" x2="245" y2="120" stroke={color} strokeWidth="2" />
        {/* Legs */}
        <line x1="200" y1="180" x2="175" y2="240" stroke={color} strokeWidth="2" />
        <line x1="200" y1="180" x2="225" y2="240" stroke={color} strokeWidth="2" />
      </g>

      {/* Speech bubble */}
      <g style={dashStyle}>
        <rect x="255" y="55" width="100" height="50" rx="12" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <path d="M265 105 L275 115 L285 105" stroke={color} strokeWidth="1.5" opacity="0.5" />
        {/* Text lines in bubble */}
        <line x1="270" y1="72" x2="340" y2="72" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <line x1="270" y1="84" x2="325" y2="84" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <line x1="270" y1="96" x2="310" y2="96" stroke={color} strokeWidth="1.5" opacity="0.3" />
      </g>

      {/* Other people - silhouettes */}
      <g style={dashStyle} opacity="0.3">
        {/* Person 2 */}
        <circle cx="100" cy="100" r="14" stroke={color} strokeWidth="1.5" />
        <line x1="100" y1="114" x2="100" y2="170" stroke={color} strokeWidth="1.5" />
        <line x1="100" y1="170" x2="85" y2="220" stroke={color} strokeWidth="1.5" />
        <line x1="100" y1="170" x2="115" y2="220" stroke={color} strokeWidth="1.5" />
        {/* Person 3 */}
        <circle cx="320" cy="110" r="14" stroke={color} strokeWidth="1.5" />
        <line x1="320" y1="124" x2="320" y2="180" stroke={color} strokeWidth="1.5" />
        <line x1="320" y1="180" x2="305" y2="230" stroke={color} strokeWidth="1.5" />
        <line x1="320" y1="180" x2="335" y2="230" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Timer / clock icon */}
      <g style={dashStyle}>
        <circle cx="200" cy="270" r="16" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <line x1="200" y1="270" x2="200" y2="260" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <line x1="200" y1="270" x2="208" y2="274" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <text x="200" y="296" textAnchor="middle" fill={color} fontSize="10" opacity="0.4">30s</text>
      </g>
    </svg>
  );
}
