import { useCurrentFrame, interpolate } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { WARM_WHITE } from '../utils/constants';
import { ScreenshotScene } from '../components/ScreenshotScene';
import { AnimatedCursor } from '../components/AnimatedCursor';

export function DashboardFlyover() {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [220, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: WARM_WHITE }}>
      <div style={{ width: '100%', height: '100%', opacity: Math.min(fadeIn, fadeOut) }}>
        <ScreenshotScene
          src="video/screenshots/dashboard.png"
          keyframes={[
            // Fade in with slight scale
            { frame: 0, scale: 1.05, x: 0, y: 0 },
            { frame: 30, scale: 1.0, x: 0, y: 0 },
            // Hold on full dashboard
            { frame: 90, scale: 1.0, x: 0, y: 0 },
            // Zoom into score ring area (left-center of dashboard)
            { frame: 130, scale: 1.8, x: 100, y: 80 },
            // Pan right to performance trend chart
            { frame: 170, scale: 1.8, x: -80, y: 80 },
            // Zoom back out
            { frame: 210, scale: 1.0, x: 0, y: 0 },
            { frame: 240, scale: 1.0, x: 0, y: 0 },
          ]}
        >
          <AnimatedCursor
            path={[
              // Appear near coaching nudge bar
              { x: 35, y: 10, frame: 30 },
              // Glide down to the score ring (47)
              { x: 24, y: 22, frame: 70 },
              // Hover on score ring
              { x: 24, y: 25, frame: 90 },
              // Move to performance trend chart
              { x: 55, y: 20, frame: 150 },
              // Move to BEST stat card
              { x: 45, y: 35, frame: 170 },
              // Drift to rubric breakdown spider
              { x: 35, y: 50, frame: 200 },
              // Back to center
              { x: 50, y: 40, frame: 230 },
            ]}
            clickFrames={[90, 170]}
          />
        </ScreenshotScene>
      </div>
    </AbsoluteFill>
  );
}
