'use client';

export function TimelineIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-32 h-32"
      aria-hidden="true"
    >
      {/* Vertical dashed line */}
      <line
        x1="50"
        y1="20"
        x2="50"
        y2="140"
        stroke="#ff5941"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.25"
      />

      {/* Node 1 - top, pulsing "next entry" */}
      <circle cx="50" cy="36" r="6" fill="#ff5941" opacity="0.15" className="empty-pulse-ring" />
      <circle cx="50" cy="36" r="4" fill="#ff5941" opacity="0.9" />
      {/* Placeholder text lines */}
      <rect x="68" y="30" width="60" height="4" rx="2" fill="#ff5941" opacity="0.2" />
      <rect x="68" y="38" width="40" height="3" rx="1.5" fill="#ff5941" opacity="0.1" />

      {/* Node 2 - middle */}
      <circle cx="50" cy="72" r="4" fill="#ffaa33" opacity="0.4" />
      <rect x="68" y="66" width="52" height="4" rx="2" fill="#ffaa33" opacity="0.15" />
      <rect x="68" y="74" width="36" height="3" rx="1.5" fill="#ffaa33" opacity="0.08" />

      {/* Node 3 - bottom */}
      <circle cx="50" cy="108" r="4" fill="#ff5941" opacity="0.25" />
      <rect x="68" y="102" width="48" height="4" rx="2" fill="#ff5941" opacity="0.1" />
      <rect x="68" y="110" width="32" height="3" rx="1.5" fill="#ff5941" opacity="0.06" />

      {/* Dashed future entry */}
      <circle
        cx="50"
        cy="140"
        r="3"
        fill="none"
        stroke="#ff5941"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.2"
      />
    </svg>
  );
}
