'use client';

interface DemoCursorProps {
  targetX: number;
  targetY: number;
  visible: boolean;
  clicking: boolean;
}

export function DemoCursor({ targetX, targetY, visible, clicking }: DemoCursorProps) {
  return (
    <div
      className="demo-cursor"
      style={{
        left: targetX,
        top: targetY,
        opacity: visible ? 1 : 0,
      }}
    >
      {/* macOS arrow cursor SVG */}
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        className={clicking ? 'demo-cursor__arrow--clicking' : ''}
      >
        <path
          d="M2 1L2 18.5L6.5 14L11.5 22L14.5 20.5L9.5 12.5L15.5 12L2 1Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {clicking && <div className="demo-cursor__ripple" />}
    </div>
  );
}
