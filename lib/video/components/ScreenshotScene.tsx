import type { ReactNode } from 'react';
import { useCurrentFrame, interpolate, Img, staticFile } from 'remotion';

interface Keyframe {
  frame: number;
  scale: number;
  x: number;
  y: number;
}

interface ScreenshotSceneProps {
  src: string;
  keyframes: Keyframe[];
  shadow?: boolean;
  borderRadius?: number;
  children?: ReactNode;
}

/**
 * Zoomable/pannable screenshot wrapper.
 * Children (e.g. AnimatedCursor) are rendered inside the same transform
 * so their coordinates are relative to the screenshot image.
 * Cursor x/y should be in *percentage* of the image (0–100).
 */
export function ScreenshotScene({
  src,
  keyframes,
  shadow = true,
  borderRadius = 16,
  children,
}: ScreenshotSceneProps) {
  const frame = useCurrentFrame();

  if (keyframes.length === 0) return null;

  const frames = keyframes.map((kf) => kf.frame);
  const scales = keyframes.map((kf) => kf.scale);
  const xs = keyframes.map((kf) => kf.x);
  const ys = keyframes.map((kf) => kf.y);

  const scale = interpolate(frame, frames, scales, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = interpolate(frame, frames, xs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, frames, ys, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '85%',
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius,
            boxShadow: shadow ? '0 16px 48px rgba(0,0,0,0.15)' : 'none',
            display: 'block',
          }}
        />
        {/* Children (cursor, overlays) positioned relative to the image */}
        {children}
      </div>
    </div>
  );
}
