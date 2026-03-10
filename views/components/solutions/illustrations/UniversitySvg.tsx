'use client';

export function UniversitySvg({ color, animate }: { color: string; animate: boolean }) {
  const dashStyle = animate
    ? { strokeDasharray: '800', strokeDashoffset: '0', transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)' }
    : { strokeDasharray: '800', strokeDashoffset: '800' };

  return (
    <svg viewBox="0 0 400 300" fill="none" className="sp-illustration" aria-hidden="true">
      {/* Podium / lectern */}
      <g style={dashStyle}>
        <rect x="170" y="140" width="60" height="80" rx="4" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <rect x="165" y="136" width="70" height="8" rx="2" stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Microphone */}
        <line x1="200" y1="136" x2="200" y2="120" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <circle cx="200" cy="116" r="5" stroke={color} strokeWidth="1.5" opacity="0.4" />
      </g>

      {/* Student presenting */}
      <g style={dashStyle}>
        <circle cx="200" cy="60" r="18" stroke={color} strokeWidth="2" />
        <line x1="200" y1="78" x2="200" y2="136" stroke={color} strokeWidth="2" />
        <line x1="200" y1="100" x2="168" y2="120" stroke={color} strokeWidth="2" />
        <line x1="200" y1="100" x2="232" y2="115" stroke={color} strokeWidth="2" />
      </g>

      {/* Presentation screen */}
      <g style={dashStyle}>
        <rect x="260" y="40" width="110" height="75" rx="4" stroke={color} strokeWidth="1.5" opacity="0.5" />
        {/* Chart / diagram */}
        <circle cx="315" cy="65" r="15" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="315" y1="65" x2="330" y2="65" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="315" y1="65" x2="315" y2="50" stroke={color} strokeWidth="1" opacity="0.3" />
        {/* Text */}
        <line x1="275" y1="95" x2="355" y2="95" stroke={color} strokeWidth="1" opacity="0.2" />
        <line x1="275" y1="105" x2="340" y2="105" stroke={color} strokeWidth="1" opacity="0.2" />
      </g>

      {/* Audience / judges */}
      <g style={dashStyle} opacity="0.3">
        <circle cx="80" cy="200" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="80" y1="210" x2="80" y2="245" stroke={color} strokeWidth="1.5" />
        <circle cx="130" cy="195" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="130" y1="205" x2="130" y2="240" stroke={color} strokeWidth="1.5" />
        <circle cx="270" cy="200" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="270" y1="210" x2="270" y2="245" stroke={color} strokeWidth="1.5" />
        <circle cx="320" cy="195" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="320" y1="205" x2="320" y2="240" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Graduation cap */}
      <g style={dashStyle} opacity="0.25">
        <path d="M40 60 L70 45 L100 60 L70 75 Z" stroke={color} strokeWidth="1.5" />
        <line x1="70" y1="75" x2="70" y2="95" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Grade badge */}
      <g style={dashStyle} opacity="0.3">
        <rect x="40" y="120" width="35" height="20" rx="4" stroke={color} strokeWidth="1.5" />
        <text x="57" y="134" textAnchor="middle" fill={color} fontSize="10">A+</text>
      </g>
    </svg>
  );
}
