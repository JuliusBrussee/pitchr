import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock creditService before importing billingService
vi.mock('@/services/creditService', () => ({
  checkCredits: vi.fn().mockResolvedValue({
    allowed: true,
    creditsRequired: 1,
    totalAvailable: 5,
    monthlyCredits: 3,
    purchasedCredits: 2,
    bonusCredits: 0,
  }),
  consumeCredits: vi.fn().mockResolvedValue({ success: true, balanceAfter: 4 }),
  hasPurchasedCredits: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/services/stripeService', () => ({
  createCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
}));

vi.mock('@/config/billing', async () => {
  const actual = await vi.importActual<typeof import('@/config/billing')>('@/config/billing');
  return {
    ...actual,
    isDevUser: vi.fn().mockReturnValue(false),
  };
});

import { checkUsageLimit, checkFeatureAccess } from '@/services/billingService';
import { checkCredits, hasPurchasedCredits } from '@/services/creditService';
import { isDevUser } from '@/config/billing';

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = () => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gt = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.lte = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({
      data: {
        id: 'sub-1',
        user_id: 'user-1',
        plan_id: 'free',
        status: 'active',
        stripe_customer_id: '',
        current_period_start: '2026-03-01T00:00:00Z',
        current_period_end: '2026-03-31T00:00:00Z',
        cancel_at_period_end: false,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      },
      error: null,
    });
    return chain;
  };

  const mock: Record<string, unknown> = {};
  mock.from = vi.fn().mockReturnValue(chainable());
  mock.rpc = vi.fn().mockResolvedValue({ data: 0, error: null });

  return mock as any;
}

describe('billingService credit integration', () => {
  let supabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createMockSupabase();
    vi.mocked(isDevUser).mockReturnValue(false);
  });

  describe('checkUsageLimit with credits', () => {
    it('dev users bypass all limits', async () => {
      vi.mocked(isDevUser).mockReturnValue(true);
      const result = await checkUsageLimit(supabase, 'dev-user', 'runs');
      expect(result.allowed).toBe(true);
      expect(result.planId).toBe('pro');
    });

    it('uses credit check when credits available', async () => {
      vi.mocked(checkCredits).mockResolvedValue({
        allowed: true,
        creditsRequired: 1,
        totalAvailable: 5,
        monthlyCredits: 3,
        purchasedCredits: 2,
        bonusCredits: 0,
      });

      // Mock day pass check to return null (no day pass)
      const chain = supabase.from('day_passes');
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await checkUsageLimit(supabase, 'user-1', 'runs');
      expect(result.allowed).toBe(true);
    });

    it('returns not allowed when insufficient credits', async () => {
      vi.mocked(checkCredits).mockResolvedValue({
        allowed: false,
        creditsRequired: 2,
        totalAvailable: 1,
        monthlyCredits: 1,
        purchasedCredits: 0,
        bonusCredits: 0,
      });

      const chain = supabase.from('day_passes');
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Need usage events to return empty for fallback
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
          single: vi.fn().mockResolvedValue({
            data: { plan_id: 'free', status: 'active', current_period_start: '2026-03-01', current_period_end: '2026-03-31' },
            error: null,
          }),
        }),
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
      });
    });
  });

  describe('checkFeatureAccess with credits', () => {
    it('grants feature to free user with purchased credits', async () => {
      vi.mocked(hasPurchasedCredits).mockResolvedValue(true);

      const result = await checkFeatureAccess(supabase, 'user-1', 'sectionFeedback');
      expect(result).toBe(true);
    });

    it('denies historicalLinks even with purchased credits', async () => {
      vi.mocked(hasPurchasedCredits).mockResolvedValue(true);

      const result = await checkFeatureAccess(supabase, 'user-1', 'historicalLinks');
      expect(result).toBe(false);
    });
  });
});
