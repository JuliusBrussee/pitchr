import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { fontFamily } from '../utils/fonts';
import { BRAND_CORAL, TEXT_PRIMARY, SURFACE } from '../utils/constants';

interface ChatBubbleProps {
  text: string;
  role: 'investor' | 'founder';
  delay?: number;
}

export function ChatBubble({ text, role, delay = 0 }: ChatBubbleProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18 },
  });

  const translateY = interpolate(s, [0, 1], [20, 0]);
  const isInvestor = role === 'investor';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isInvestor ? 'flex-start' : 'flex-end',
        opacity: s,
        transform: `translateY(${translateY}px)`,
        marginBottom: 12,
        fontFamily,
      }}
    >
      {isInvestor && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          VC
        </div>
      )}
      <div
        style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isInvestor ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          background: isInvestor ? SURFACE : BRAND_CORAL,
          color: isInvestor ? TEXT_PRIMARY : '#fff',
          fontSize: 15,
          lineHeight: 1.5,
          fontWeight: 500,
          border: isInvestor ? '1px solid #e5e5e3' : 'none',
          boxShadow: isInvestor
            ? '0 1px 4px rgba(0,0,0,0.05)'
            : `0 2px 8px ${BRAND_CORAL}30`,
        }}
      >
        {text}
      </div>
    </div>
  );
}
