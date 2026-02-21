import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiriBubble, resolveSize } from '../SiriBubble';

// Mock R3F Canvas — it requires WebGL which isn't available in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}));

vi.mock('../Orb', () => ({
  Orb: () => <div data-testid="orb-mesh" />,
}));

describe('resolveSize', () => {
  it('returns 100% for fluid mode', () => {
    const result = resolveSize('md', true);
    expect(result).toEqual({ width: '100%', height: '100%' });
  });

  it('resolves preset string sizes to pixels', () => {
    expect(resolveSize('sm', false)).toEqual({ width: '64px', height: '64px' });
    expect(resolveSize('md', false)).toEqual({ width: '128px', height: '128px' });
    expect(resolveSize('lg', false)).toEqual({ width: '256px', height: '256px' });
    expect(resolveSize('xl', false)).toEqual({ width: '512px', height: '512px' });
  });

  it('uses custom number sizes', () => {
    expect(resolveSize(200, false)).toEqual({ width: '200px', height: '200px' });
  });

  it('defaults to md when size is undefined', () => {
    expect(resolveSize(undefined, false)).toEqual({ width: '128px', height: '128px' });
  });
});

describe('SiriBubble component', () => {
  it('renders without crashing', () => {
    const { container } = render(<SiriBubble state="idle" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the R3F Canvas', () => {
    render(<SiriBubble state="idle" />);
    expect(screen.getByTestId('r3f-canvas')).toBeTruthy();
  });

  it('renders the Orb mesh inside Canvas', () => {
    render(<SiriBubble state="idle" />);
    expect(screen.getByTestId('orb-mesh')).toBeTruthy();
  });

  it('applies className prop', () => {
    const { container } = render(<SiriBubble state="idle" className="my-custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains('my-custom-class')).toBe(true);
  });

  it('applies correct size dimensions', () => {
    const { container } = render(<SiriBubble state="idle" size="lg" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('256px');
    expect(wrapper.style.height).toBe('256px');
  });

  it('applies fluid dimensions', () => {
    const { container } = render(<SiriBubble state="idle" fluid />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.height).toBe('100%');
  });
});
