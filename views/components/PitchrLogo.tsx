'use client';

import Image from 'next/image';
import { useTheme } from '@/views/components/ThemeProvider';

interface PitchrLogoProps {
  size?: number;
  className?: string;
}

export function PitchrLogo({ size = 24, className }: PitchrLogoProps) {
  const { isDark } = useTheme();
  return (
    <Image
      src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
      alt="Pitchr"
      width={size}
      height={Math.round(size * 1.3)}
      className={className}
      priority
    />
  );
}
