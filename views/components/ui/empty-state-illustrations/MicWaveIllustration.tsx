'use client';

export function MicWaveIllustration() {
  // Mic capsule: y=56..92 → center = 74
  // Stand cradle at y=88, pole to y=108, base at y=108
  // Waves centered on y=74 (mic capsule center)
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-32 h-28"
      aria-hidden="true"
    >
      {/* Mic capsule */}
      <rect x="72" y="56" width="16" height="36" rx="8" fill="#ff5941" opacity="0.9" />

      {/* Stand cradle — hugs bottom of capsule */}
      <path
        d="M63 88 C63 100 72 108 80 108 C88 108 97 100 97 88"
        stroke="#ff5941"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Stand pole + base */}
      <line x1="80" y1="108" x2="80" y2="120" stroke="#ff5941" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="70" y1="120" x2="90" y2="120" stroke="#ff5941" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />

      {/* Left wave arcs — centered on y=74 */}
      <path
        d="M48 92 C42 80 42 68 48 56"
        stroke="#ff5941"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0s' }}
      />
      <path
        d="M38 100 C30 82 30 66 38 48"
        stroke="#ff5941"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0.3s' }}
      />
      <path
        d="M28 106 C18 84 18 64 28 42"
        stroke="#ff5941"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0.6s' }}
      />

      {/* Right wave arcs — centered on y=74 */}
      <path
        d="M112 92 C118 80 118 68 112 56"
        stroke="#ffaa33"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0.15s' }}
      />
      <path
        d="M122 100 C130 82 130 66 122 48"
        stroke="#ffaa33"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0.45s' }}
      />
      <path
        d="M132 106 C142 84 142 64 132 42"
        stroke="#ffaa33"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        className="empty-wave-arc"
        style={{ animationDelay: '0.75s' }}
      />

      {/* Floating particles */}
      <circle cx="52" cy="100" r="2" fill="#ff5941" className="empty-particle" style={{ animationDelay: '0s' }} />
      <circle cx="68" cy="106" r="1.5" fill="#ffaa33" className="empty-particle" style={{ animationDelay: '0.4s' }} />
      <circle cx="92" cy="104" r="1.5" fill="#ff5941" className="empty-particle" style={{ animationDelay: '0.8s' }} />
      <circle cx="108" cy="98" r="2" fill="#ffaa33" className="empty-particle" style={{ animationDelay: '1.2s' }} />
      <circle cx="80" cy="44" r="1.5" fill="#ff5941" className="empty-particle" style={{ animationDelay: '0.6s' }} />
    </svg>
  );
}
