import Image from 'next/image';

interface PitchrLogoStaticProps {
  size?: number;
  className?: string;
}

/**
 * Server-compatible PitchrLogo that uses CSS to swap between light/dark
 * variants based on html.dark class (set by the inline theme script).
 */
export function PitchrLogoStatic({ size = 24, className }: PitchrLogoStaticProps) {
  const height = Math.round(size * 1.3);
  return (
    <>
      <Image
        src="/logo-light.svg"
        alt="Pitchr"
        width={size}
        height={height}
        className={`dark-hidden ${className ?? ''}`}
        priority
      />
      <Image
        src="/logo-dark.svg"
        alt="Pitchr"
        width={size}
        height={height}
        className={`light-hidden ${className ?? ''}`}
        priority
      />
    </>
  );
}
