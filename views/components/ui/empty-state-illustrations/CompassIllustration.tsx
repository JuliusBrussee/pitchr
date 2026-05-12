'use client';

export function CompassIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-36"
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="80" cy="80" r="56" stroke="#ff5941" strokeWidth="2" opacity="0.2" />
      {/* Inner circle */}
      <circle cx="80" cy="80" r="48" stroke="#ff5941" strokeWidth="1" opacity="0.1" />

      {/* Tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="80"
          y1="28"
          x2="80"
          y2={deg % 90 === 0 ? '34' : '31'}
          stroke="#ff5941"
          strokeWidth={deg % 90 === 0 ? '2' : '1'}
          opacity={deg % 90 === 0 ? '0.4' : '0.2'}
          transform={`rotate(${deg} 80 80)`}
          strokeLinecap="round"
        />
      ))}

      {/* Cardinal labels */}
      <text x="80" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ff5941" opacity="0.35">N</text>
      <text x="142" y="83" textAnchor="middle" fontSize="7" fontWeight="600" fill="#ff5941" opacity="0.2">E</text>
      <text x="80" y="146" textAnchor="middle" fontSize="7" fontWeight="600" fill="#ff5941" opacity="0.2">S</text>
      <text x="18" y="83" textAnchor="middle" fontSize="7" fontWeight="600" fill="#ff5941" opacity="0.2">W</text>

      {/* Wobbling needle */}
      <g className="empty-needle-wobble" style={{ transformOrigin: '80px 80px' }}>
        {/* North half (coral) */}
        <path d="M80 40 L76 80 L84 80 Z" fill="#ff5941" opacity="0.85" />
        {/* South half (muted) */}
        <path d="M80 120 L76 80 L84 80 Z" fill="#ff5941" opacity="0.2" />
      </g>

      {/* Center pin */}
      <circle cx="80" cy="80" r="3" fill="#ff5941" opacity="0.9" />
      <circle cx="80" cy="80" r="1.5" fill="white" opacity="0.4" />
    </svg>
  );
}
