'use client';

export function RocketIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-32 h-32 empty-rocket-drift"
      aria-hidden="true"
    >
      {/* Rocket body */}
      <g transform="translate(80 70)">
        {/* Nose cone */}
        <path d="M0 -30 L-10 -6 L10 -6 Z" fill="#ff5941" opacity="0.9" />
        {/* Body */}
        <rect x="-10" y="-6" width="20" height="30" rx="2" fill="#ff5941" opacity="0.75" />
        {/* Window */}
        <circle cx="0" cy="6" r="4" fill="white" opacity="0.3" />
        {/* Fins */}
        <path d="M-10 18 L-18 28 L-10 24 Z" fill="#ffaa33" opacity="0.7" />
        <path d="M10 18 L18 28 L10 24 Z" fill="#ffaa33" opacity="0.7" />
        {/* Exhaust nozzle */}
        <rect x="-6" y="24" width="12" height="4" rx="1" fill="#e63b26" opacity="0.6" />
      </g>

      {/* Particle trail */}
      <circle cx="80" cy="106" r="2.5" fill="#ffaa33" className="empty-particle" style={{ animationDelay: '0s' }} />
      <circle cx="76" cy="114" r="2" fill="#ff5941" className="empty-particle" style={{ animationDelay: '0.3s' }} />
      <circle cx="84" cy="118" r="1.5" fill="#ffaa33" className="empty-particle" style={{ animationDelay: '0.6s' }} />
      <circle cx="78" cy="126" r="2" fill="#ff5941" className="empty-particle" style={{ animationDelay: '0.9s' }} />
      <circle cx="82" cy="134" r="1.5" fill="#ffaa33" className="empty-particle" style={{ animationDelay: '1.2s' }} />

      {/* Sparkle dots */}
      <circle cx="46" cy="44" r="1.5" fill="#ff5941" opacity="0.4" className="empty-particle" style={{ animationDelay: '0.2s' }} />
      <circle cx="114" cy="52" r="1.5" fill="#ffaa33" opacity="0.4" className="empty-particle" style={{ animationDelay: '0.7s' }} />
      <circle cx="56" cy="90" r="1" fill="#ffaa33" opacity="0.3" className="empty-particle" style={{ animationDelay: '1.0s' }} />
      <circle cx="106" cy="84" r="1" fill="#ff5941" opacity="0.3" className="empty-particle" style={{ animationDelay: '0.5s' }} />
    </svg>
  );
}
