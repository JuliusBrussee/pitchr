import { useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { WARM_WHITE, TEXT_PRIMARY } from '../utils/constants';
import { SEQ } from '../utils/constants';

export function LogoReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 18 },
  });

  const scaleOut = interpolate(frame, [SEQ.LOGO_REVEAL - 10, SEQ.LOGO_REVEAL], [1, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacityOut = interpolate(frame, [SEQ.LOGO_REVEAL - 8, SEQ.LOGO_REVEAL], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: WARM_WHITE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          transform: `scale(${scaleIn * scaleOut})`,
          opacity: opacityOut,
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{ width: 120, height: 'auto' }}
        />
        <span
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            letterSpacing: '-0.02em',
          }}
        >
          pitchr
        </span>
      </div>
    </AbsoluteFill>
  );
}
