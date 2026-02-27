export type HeroTileCommandName = 'assemble' | 'explode' | 'swirl' | 'wave';

export type HeroPresenterTileTuple = readonly [
  x: number,
  y: number,
  lightFill: string,
  darkFill: string,
  weight: number,
];

export type HeroTileCommandOptions = {
  duration?: number;
  ease?: string;
  stagger?: number;
  radius?: number;
  randomness?: number;
  rotations?: number;
  amplitude?: number;
  frequency?: number;
};

export type HeroPresenterTilesState = {
  activeCommand: HeroTileCommandName;
  tileCount: number;
  isDark: boolean;
  reducedMotion: boolean;
};

export type HeroPresenterTilesController = {
  command: (name: HeroTileCommandName, options?: HeroTileCommandOptions) => void;
  reset: () => void;
  getState: () => HeroPresenterTilesState;
};
