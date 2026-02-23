import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetRunStats = vi.fn();

vi.mock('@/services/runService', () => ({
  getRunStats: (...args: unknown[]) => mockGetRunStats(...args),
}));

import { GET } from '@/app/api/pitch/run/stats/route';

describe('GET /api/pitch/run/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stats on success', async () => {
    const stats = {
      totalRuns: 5,
      averageScore: 72,
      bestScore: 90,
      trend: [60, 65, 70, 80, 90],
    };
    mockGetRunStats.mockResolvedValue(stats);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalRuns).toBe(5);
    expect(body.averageScore).toBe(72);
    expect(body.bestScore).toBe(90);
    expect(body.trend).toHaveLength(5);
  });

  it('returns 500 on error', async () => {
    mockGetRunStats.mockRejectedValue(new Error('DB error'));

    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('DB error');
  });
});
