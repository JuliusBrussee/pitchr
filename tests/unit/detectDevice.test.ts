import { describe, it, expect } from 'vitest';
import { detectDeviceType } from '@/lib/detectDevice';

describe('detectDeviceType', () => {
  it('detects iPhone as mobile', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(detectDeviceType(ua)).toBe('mobile');
  });

  it('detects Android phone as mobile', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    expect(detectDeviceType(ua)).toBe('mobile');
  });

  it('detects iPad as desktop (tablet exclusion)', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1';
    expect(detectDeviceType(ua)).toBe('desktop');
  });

  it('detects Android tablet as desktop (no "Mobile" token)', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(detectDeviceType(ua)).toBe('desktop');
  });

  it('detects desktop Chrome as desktop', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(detectDeviceType(ua)).toBe('desktop');
  });

  it('returns desktop for null user agent', () => {
    expect(detectDeviceType(null)).toBe('desktop');
  });

  it('returns desktop for undefined user agent', () => {
    expect(detectDeviceType(undefined)).toBe('desktop');
  });

  it('returns desktop for empty string', () => {
    expect(detectDeviceType('')).toBe('desktop');
  });
});
