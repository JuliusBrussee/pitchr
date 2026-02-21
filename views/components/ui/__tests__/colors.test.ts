import { describe, it, expect } from 'vitest';
import { getScoreBand, getScoreColor, getScoreBandLabel, getModeColor, getModeLabel } from '../colors';

describe('getScoreBand', () => {
  it('returns "needs-work" for scores 0-39', () => {
    expect(getScoreBand(0)).toBe('needs-work');
    expect(getScoreBand(25)).toBe('needs-work');
    expect(getScoreBand(39)).toBe('needs-work');
  });

  it('returns "getting-there" for scores 40-59', () => {
    expect(getScoreBand(40)).toBe('getting-there');
    expect(getScoreBand(59)).toBe('getting-there');
  });

  it('returns "solid" for scores 60-79', () => {
    expect(getScoreBand(60)).toBe('solid');
    expect(getScoreBand(79)).toBe('solid');
  });

  it('returns "investor-ready" for scores 80-100', () => {
    expect(getScoreBand(80)).toBe('investor-ready');
    expect(getScoreBand(100)).toBe('investor-ready');
  });
});

describe('getScoreColor', () => {
  it('returns red for needs-work', () => {
    expect(getScoreColor(25)).toBe('#ef4444');
  });
  it('returns yellow for getting-there', () => {
    expect(getScoreColor(50)).toBe('#eab308');
  });
  it('returns amber for solid', () => {
    expect(getScoreColor(70)).toBe('#ffaa33');
  });
  it('returns green for investor-ready', () => {
    expect(getScoreColor(85)).toBe('#22c55e');
  });
});

describe('getScoreBandLabel', () => {
  it('returns correct labels', () => {
    expect(getScoreBandLabel(25)).toBe('Needs Work');
    expect(getScoreBandLabel(50)).toBe('Getting There');
    expect(getScoreBandLabel(70)).toBe('Solid');
    expect(getScoreBandLabel(85)).toBe('Investor-Ready');
  });
});

describe('getModeColor', () => {
  it('returns orange for elevator', () => {
    expect(getModeColor('elevator')).toBe('#f97316');
  });
  it('returns coral for vc_pitch', () => {
    expect(getModeColor('vc_pitch')).toBe('#ff5941');
  });
});

describe('getModeLabel', () => {
  it('returns display labels', () => {
    expect(getModeLabel('elevator')).toBe('Elevator');
    expect(getModeLabel('vc_pitch')).toBe('VC Pitch');
  });
});
