import { useCurrentFrame, useVideoConfig, spring, Img, staticFile } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { WARM_WHITE, BRAND_CORAL } from '../utils/constants';
import { WordByWord } from '../components/WordByWord';

export function EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame, fps, config: { damping: 18 } });
  const taglineS = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 200 } });
  const urlS = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 200 } });
  const ctaS = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 18 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: WARM_WHITE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        gap: 28,
      }}
    >
      {/* Logo */}
      <div style={{ opacity: logoS, transform: `scale(${logoS})` }}>
        <Img
          src={staticFile('logo.svg')}
          style={{ width: 80, height: 'auto' }}
        />
      </div>

      {/* Tagline — word by word */}
      <div style={{ opacity: taglineS }}>
        <WordByWord
          text="Pitch it. Perfect it."
          fontSize={56}
          stagger={8}
          startFrame={10}
        />
      </div>

      {/* URL */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#888888',
          opacity: urlS,
        }}
      >
        pitchr.com
      </div>

      {/* CTA button */}
      <div
        style={{
          padding: '16px 48px',
          borderRadius: 12,
          background: BRAND_CORAL,
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
          opacity: ctaS,
          transform: `scale(${ctaS})`,
          boxShadow: `0 4px 24px ${BRAND_CORAL}40`,
        }}
      >
        Try it free on Product Hunt
      </div>
    </AbsoluteFill>
  );
}
