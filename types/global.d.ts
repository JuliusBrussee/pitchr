import type { HeroPresenterTilesController } from '@/types/heroPresenterTiles';

declare global {
  interface Window {
    pitchrHeroTiles?: HeroPresenterTilesController;
  }
}

export {};
