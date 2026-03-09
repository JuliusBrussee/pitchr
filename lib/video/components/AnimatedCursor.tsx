import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND_CORAL } from '../utils/constants';

/**
 * Path points use percentage coordinates (0–100) relative to the
 * parent container (typically the ScreenshotScene image wrapper).
 */
interface PathPoint {
  x: number; // % from left
  y: number; // % from top
  frame: number;
}

interface AnimatedCursorProps {
  path: PathPoint[];
  clickFrames?: number[];
}

export function AnimatedCursor({ path, clickFrames = [] }: AnimatedCursorProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (path.length === 0) return null;

  // Find position by interpolating between keyframes
  let x = path[0].x;
  let y = path[0].y;

  if (frame <= path[0].frame) {
    x = path[0].x;
    y = path[0].y;
  } else if (frame >= path[path.length - 1].frame) {
    x = path[path.length - 1].x;
    y = path[path.length - 1].y;
  } else {
    for (let i = 0; i < path.length - 1; i++) {
      if (frame >= path[i].frame && frame <= path[i + 1].frame) {
        const segDuration = path[i + 1].frame - path[i].frame;
        const progress = spring({
          frame: frame - path[i].frame,
          fps,
          durationInFrames: segDuration,
          config: { damping: 28 },
        });
        x = interpolate(progress, [0, 1], [path[i].x, path[i + 1].x]);
        y = interpolate(progress, [0, 1], [path[i].y, path[i + 1].y]);
        break;
      }
    }
  }

  // Fade in at first keyframe
  const cursorOpacity = interpolate(frame, [path[0].frame, path[0].frame + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Click ripple
  const activeClick = clickFrames.find((cf) => frame >= cf && frame < cf + 12);
  let rippleScale = 0;
  let rippleOpacity = 0;
  if (activeClick !== undefined) {
    const clickProgress = (frame - activeClick) / 12;
    rippleScale = interpolate(clickProgress, [0, 0.5, 1], [0, 1.2, 0]);
    rippleOpacity = interpolate(clickProgress, [0, 0.3, 1], [0.3, 0.2, 0]);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        opacity: cursorOpacity,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Click ripple */}
      {activeClick !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: BRAND_CORAL,
            opacity: rippleOpacity,
            transform: `translate(-50%, -50%) scale(${rippleScale})`,
          }}
        />
      )}

      {/* macOS-style cursor */}
      <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M2 2L2 22L7.5 17L12.5 26L15.5 24.5L10.5 16L17.5 16L2 2Z"
          fill="white"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
