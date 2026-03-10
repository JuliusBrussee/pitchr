'use client';

export function CompetitionSvg({ color, animate }: { color: string; animate: boolean }) {
  const dashStyle = animate
    ? { strokeDasharray: '800', strokeDashoffset: '0', transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)' }
    : { strokeDasharray: '800', strokeDashoffset: '800' };

  return (
    <svg viewBox="0 0 400 300" fill="none" className="sp-illustration" aria-hidden="true">
      {/* Big stage */}
      <g style={dashStyle}>
        <rect x="20" y="210" width="360" height="15" rx="4" stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Stage sides */}
        <line x1="20" y1="225" x2="20" y2="270" stroke={color} strokeWidth="1.5" opacity="0.2" />
        <line x1="380" y1="225" x2="380" y2="270" stroke={color} strokeWidth="1.5" opacity="0.2" />
        {/* Stage floor */}
        <line x1="20" y1="270" x2="380" y2="270" stroke={color} strokeWidth="1" opacity="0.15" />
      </g>

      {/* Speaker on stage */}
      <g style={dashStyle}>
        <circle cx="200" cy="100" r="20" stroke={color} strokeWidth="2" />
        <line x1="200" y1="120" x2="200" y2="185" stroke={color} strokeWidth="2" />
        <line x1="200" y1="145" x2="165" y2="165" stroke={color} strokeWidth="2" />
        <line x1="200" y1="145" x2="240" y2="135" stroke={color} strokeWidth="2" />
        <line x1="200" y1="185" x2="180" y2="208" stroke={color} strokeWidth="2" />
        <line x1="200" y1="185" x2="220" y2="208" stroke={color} strokeWidth="2" />
      </g>

      {/* Large screen behind */}
      <g style={dashStyle}>
        <rect x="70" y="25" width="260" height="55" rx="6" stroke={color} strokeWidth="1.5" opacity="0.3" />
        {/* Company name placeholder */}
        <line x1="140" y1="48" x2="260" y2="48" stroke={color} strokeWidth="2" opacity="0.25" />
        <line x1="165" y1="62" x2="235" y2="62" stroke={color} strokeWidth="1" opacity="0.15" />
      </g>

      {/* Judges panel */}
      <g style={dashStyle} opacity="0.3">
        {/* Judge desk */}
        <rect x="40" y="240" width="140" height="6" rx="2" stroke={color} strokeWidth="1.5" />
        {/* Judge 1 */}
        <circle cx="70" cy="250" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="70" y1="260" x2="70" y2="280" stroke={color} strokeWidth="1.5" />
        {/* Judge 2 */}
        <circle cx="110" cy="250" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="110" y1="260" x2="110" y2="280" stroke={color} strokeWidth="1.5" />
        {/* Judge 3 */}
        <circle cx="150" cy="250" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="150" y1="260" x2="150" y2="280" stroke={color} strokeWidth="1.5" />
      </g>

      {/* Spotlight beams */}
      <g style={dashStyle} opacity="0.15">
        <line x1="100" y1="0" x2="200" y2="100" stroke={color} strokeWidth="1" />
        <line x1="300" y1="0" x2="200" y2="100" stroke={color} strokeWidth="1" />
      </g>

      {/* Prize badge */}
      <g style={dashStyle} opacity="0.25">
        <circle cx="355" cy="120" r="18" stroke={color} strokeWidth="1.5" />
        <text x="355" y="124" textAnchor="middle" fill={color} fontSize="10">$50K</text>
      </g>

      {/* Audience indicators */}
      <g style={dashStyle} opacity="0.15">
        <circle cx="260" cy="255" r="5" stroke={color} strokeWidth="1" />
        <circle cx="280" cy="260" r="5" stroke={color} strokeWidth="1" />
        <circle cx="300" cy="253" r="5" stroke={color} strokeWidth="1" />
        <circle cx="320" cy="258" r="5" stroke={color} strokeWidth="1" />
        <circle cx="340" cy="255" r="5" stroke={color} strokeWidth="1" />
      </g>
    </svg>
  );
}
