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

function createChainable(singleData: unknown = null) {
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
    data: singleData,
    error: singleData ? null : { code: 'PGRST116' },
  });
  return chain;
}

const SUB_ROW = {
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
};

const DAY_PASS_ROW = {
  id: 'pass-1',
  user_id: 'user-1',
  purchased_at: '2026-03-10T00:00:00Z',
  expires_at: '2099-03-11T00:00:00Z',
  runs_used: 0,
  runs_limit: 15,
  decks_used: 1,
  decks_limit: 5,
  qa_seconds_used: 0,
  qa_seconds_limit: 600,
  stripe_payment_intent_id: 'pi_123',
  status: 'active',
};

function createMockSupabase() {
  const mock: Record<string, unknown> = {};
  mock.from = vi.fn().mockImplementation((table: string) => {
    if (table === 'subscriptions') return createChainable(SUB_ROW);
    if (table === 'day_passes') return createChainable(null);
    if (table === 'usage_events') return createChainable(null);
    return createChainable(null);
  });
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

      const result = await checkUsageLimit(supabase, 'user-1', 'runs');
      expect(result.allowed).toBe(true);
      expect(result.planId).toBe('free');
    });

    it('uses day-pass deck quota for deck generation', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') return createChainable(SUB_ROW);
        if (table === 'day_passes') return createChainable(DAY_PASS_ROW);
        if (table === 'usage_events') return createChainable(null);
        return createChainable(null);
      });

      const result = await checkUsageLimit(supabase, 'user-1', 'deck_generation');
      expect(result.allowed).toBe(true);
      expect(result.planId).toBe('day_pass');
      expect(result.remaining).toBe(4);
    });

    it('returns not allowed when insufficient credits and no usage remaining', async () => {
      vi.mocked(checkCredits).mockResolvedValue({
        allowed: false,
        creditsRequired: 2,
        totalAvailable: 1,
        monthlyCredits: 1,
        purchasedCredits: 0,
        bonusCredits: 0,
      });

      // Override usage_events to return count matching limit
      const usageChain = createChainable(null);
      (usageChain.select as ReturnType<typeof vi.fn>).mockReturnValue({
        ...usageChain,
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                count: 3,
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') return createChainable(SUB_ROW);
        if (table === 'day_passes') return createChainable(null);
        if (table === 'usage_events') return usageChain;
        return createChainable(null);
      });

      const result = await checkUsageLimit(supabase, 'user-1', 'runs');
      expect(result.allowed).toBe(false);
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
