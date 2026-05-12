export type OrbState = 'idle' | 'active' | 'positive' | 'negative' | 'neutral';

export interface SiriBubbleProps {
  state: OrbState;
  intensity?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  fluid?: boolean;
  opacity?: number;
  className?: string;
}

export interface OrbColors {
  primary: string;
  secondary: string;
}

export interface OrbAnimationConfig {
  speed: number;
  displacement: number;
}
