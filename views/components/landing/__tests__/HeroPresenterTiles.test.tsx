import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HeroPresenterTiles } from '@/views/components/landing/HeroPresenterTiles';
import { HERO_PRESENTER_TILE_TUPLES } from '@/views/components/landing/heroPresenterTiles.data';
import { HERO_PRESENTER_PARTS } from '@/views/components/landing/heroPresenterParts.data';

function createMatchMedia(matches: boolean) {
  return () => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

describe('HeroPresenterTiles', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMedia(false),
    });
  });

  afterEach(() => {
    delete window.pitchrHeroTiles;
  });

  it('renders one rect per tile and exposes the command API', () => {
    const { container, unmount } = render(<HeroPresenterTiles isDark={false} />);

    expect(container.querySelectorAll('[data-hero-presenter-tile]')).toHaveLength(
      HERO_PRESENTER_TILE_TUPLES.length
    );

    expect(window.pitchrHeroTiles).toBeDefined();
    expect(window.pitchrHeroTiles?.getState().activeCommand).toBe('assemble');

    act(() => {
      window.pitchrHeroTiles?.command('explode', { duration: 0 });
    });
    expect(window.pitchrHeroTiles?.getState().activeCommand).toBe('explode');

    act(() => {
      window.pitchrHeroTiles?.reset();
    });
    expect(window.pitchrHeroTiles?.getState().activeCommand).toBe('assemble');

    unmount();
    expect(window.pitchrHeroTiles).toBeUndefined();
  }, 60000);

  it('switches tile fills across light and dark themes', () => {
    const { container, rerender } = render(<HeroPresenterTiles isDark={false} />);
    const firstTile = container.querySelector('[data-hero-presenter-tile]');
    expect(firstTile?.getAttribute('fill')).toBe(HERO_PRESENTER_TILE_TUPLES[0][2]);
    expect(HERO_PRESENTER_PARTS.includes(firstTile?.getAttribute('data-part') as never)).toBe(true);

    rerender(<HeroPresenterTiles isDark />);
    const firstTileAfter = container.querySelector('[data-hero-presenter-tile]');
    expect(firstTileAfter?.getAttribute('fill')).toBe(HERO_PRESENTER_TILE_TUPLES[0][3]);
  }, 60000);
});
